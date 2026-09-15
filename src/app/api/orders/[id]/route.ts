import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  handleOrderStatusTransition,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendRefundCompletedEmail,
} from '@/lib/order-emails';

export const dynamic = 'force-dynamic';

const orderStatuses = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUND_INITIATED',
  'REFUND_COMPLETED',
] as const;

const orderUpdateSchema = z.object({
  status: z.enum(orderStatuses).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  shippingMethod: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  deliveryDate: z.string().optional(),
  shippingNotes: z.string().optional(),
  cancellationReason: z.string().optional(),
  refundAmount: z.number().optional(),
  refundReason: z.string().optional(),
  transactionId: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        items: {
          include: {
            product: true,
            seller: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (session.user.role !== 'ADMIN' && order.customerId !== session.user.id) {
      if (session.user.role !== 'SELLER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } });
      if (!seller || !order.items.some((item) => item.sellerId === seller.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Role check: Admin or Seller associated with items in this order
    if (role !== 'ADMIN') {
      if (role !== 'SELLER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const seller = await prisma.sellerProfile.findUnique({ where: { userId } });
      if (!seller || !existingOrder.items.some((item) => item.sellerId === seller.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const {
      status,
      paymentStatus,
      trackingNumber,
      carrier,
      shippingMethod,
      estimatedDelivery,
      deliveryDate,
      shippingNotes,
      cancellationReason,
      refundAmount,
      refundReason,
      transactionId,
    } = orderUpdateSchema.parse(await req.json());

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: status !== undefined ? status : undefined,
        paymentStatus: paymentStatus !== undefined ? paymentStatus : undefined,
      },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        items: {
          include: {
            product: true,
            seller: true,
          },
        },
      },
    });

    // 1. Order status transition dynamic notification (with built-in duplicate prevention)
    if (status && status !== existingOrder.status) {
      handleOrderStatusTransition(updatedOrder.id, status, existingOrder.status, {
        trackingNumber,
        carrier,
        shippingMethod,
        estimatedDelivery,
        deliveryDate,
        shippingNotes,
        cancellationReason,
        refundAmount,
        refundReason,
      }).catch((err) => {
        console.error(`[Orders API] Failed to dispatch status email for order ${updatedOrder.id}:`, err);
      });
    }

    // 2. Payment status change dynamic notification (with built-in duplicate prevention)
    if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) {
      if (paymentStatus === 'PAID') {
        sendPaymentSuccessEmail(updatedOrder.id, { transactionId }).catch((err) => {
          console.error(`[Orders API] Failed to send payment success email for order ${updatedOrder.id}:`, err);
        });
      } else if (paymentStatus === 'FAILED') {
        sendPaymentFailedEmail(updatedOrder.id, { paymentFailureReason: 'Payment could not be verified' }).catch((err) => {
          console.error(`[Orders API] Failed to send payment failed email for order ${updatedOrder.id}:`, err);
        });
      } else if (paymentStatus === 'REFUNDED') {
        sendRefundCompletedEmail(updatedOrder.id, { refundAmount, refundReason }).catch((err) => {
          console.error(`[Orders API] Failed to send refund completed email for order ${updatedOrder.id}:`, err);
        });
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}

