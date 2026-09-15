import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { sendOrderConfirmationEmail } from '@/lib/order-emails';
import { createTransactionHash, createTransactionSignature } from '@/lib/transaction-security';

export const dynamic = 'force-dynamic';

const SHIPPING_FEE_NPR = 100;

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      qty: z.number().int().positive(),
    })
  ),
  paymentMethod: z.enum(['ESEWA', 'KHALTI', 'COD', 'CREDIT_CARD']),
  shippingAddress: z.string().min(5, 'Shipping address is required'),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    let orders;

    if (role === 'ADMIN') {
      orders = await prisma.order.findMany({
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: {
            include: {
              product: true,
              seller: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'SELLER') {
      const seller = await prisma.sellerProfile.findUnique({
        where: { userId },
      });

      if (!seller) {
        return NextResponse.json([]);
      }

      orders = await prisma.order.findMany({
        where: {
          items: {
            some: {
              sellerId: seller.id,
            },
          },
        },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: {
            where: { sellerId: seller.id },
            include: {
              product: true,
              seller: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // CUSTOMER
      orders = await prisma.order.findMany({
        where: { customerId: userId },
        include: {
          items: {
            include: {
              product: true,
              seller: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = orderSchema.parse(body);

    // Create order & deduct stock
    const order = await prisma.$transaction(async (tx) => {
      const productIds = validatedData.items.map((item) => item.productId);
      if (new Set(productIds).size !== productIds.length) {
        throw new Error('Each product may only appear once in an order');
      }
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productById = new Map(products.map((product) => [product.id, product]));
      let merchandiseTotal = 0;

      // Verify stock for all items
      for (const item of validatedData.items) {
        const product = productById.get(item.productId);
        if (!product || product.stock < item.qty) {
          throw new Error(`Insufficient stock for ${product?.name || 'item'}`);
        }
        merchandiseTotal += product.price * item.qty;
      }

      // Deduct stock
      for (const item of validatedData.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        });
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          customerId: session.user.id,
          // Totals and seller IDs are derived server-side, never trusted from the browser.
          total: Math.round((merchandiseTotal + SHIPPING_FEE_NPR) * 100) / 100,
          paymentMethod: validatedData.paymentMethod,
          paymentStatus: validatedData.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
          status: 'PENDING',
          shippingAddress: validatedData.shippingAddress,
          items: {
            create: validatedData.items.map((i) => ({
              productId: i.productId,
              sellerId: productById.get(i.productId)!.sellerId,
              qty: i.qty,
              priceAtPurchase: productById.get(i.productId)!.price,
            })),
          },
        },
        include: {
          items: {
            include: { product: true, seller: true },
          },
        },
      });

      // Cryptographic Security: Generate canonical transaction payload, SHA-256 hash & RSA signature
      const canonicalData = {
        transactionId: newOrder.id,
        orderId: newOrder.id,
        customerId: newOrder.customerId,
        amount: newOrder.total,
        currency: 'NPR',
        paymentMethod: newOrder.paymentMethod,
        paymentStatus: newOrder.paymentStatus,
        timestamp: newOrder.createdAt.toISOString(),
      };

      const transactionHash = createTransactionHash(canonicalData);
      const digitalSignature = createTransactionSignature(canonicalData);

      const securedOrder = await tx.order.update({
        where: { id: newOrder.id },
        data: {
          transactionHash,
          digitalSignature,
          signedAt: new Date(),
        },
        include: {
          items: {
            include: { product: true, seller: true },
          },
        },
      });

      return securedOrder;
    });

    // Fire dynamic order confirmation email asynchronously after successful order creation
    sendOrderConfirmationEmail(order.id).catch((err) => {
      console.error('[Orders API] Failed to send order confirmation email:', err);
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 400 });
  }
}

