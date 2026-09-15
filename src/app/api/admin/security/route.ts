import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  canonicalizeTransaction,
  createTransactionHash,
  createTransactionSignature,
  verifyTransactionIntegrity,
  getPublicKey,
  type CanonicalTransactionData,
} from '@/lib/transaction-security';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // For demonstration completeness: If any existing order was created before this feature,
    // automatically generate its cryptographic signature and hash so it can be demonstrated.
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        let hash = order.transactionHash;
        let signature = order.digitalSignature;
        let signedAt = order.signedAt;

        const canonical: CanonicalTransactionData = {
          transactionId: order.id,
          orderId: order.id,
          customerId: order.customerId,
          amount: order.total,
          currency: 'NPR',
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          timestamp: order.createdAt.toISOString(),
        };

        if (!hash || !signature) {
          hash = createTransactionHash(canonical);
          signature = createTransactionSignature(canonical);
          signedAt = new Date();

          await prisma.order.update({
            where: { id: order.id },
            data: {
              transactionHash: hash,
              digitalSignature: signature,
              signedAt,
            },
          });
        }

        const verification = verifyTransactionIntegrity(canonical, hash, signature);

        return {
          id: order.id,
          customerId: order.customerId,
          customerName: order.customer?.name || 'Valued Customer',
          customerEmail: order.customer?.email || 'N/A',
          total: order.total,
          currency: 'NPR',
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
          itemCount: order.items.reduce((sum, item) => sum + item.qty, 0),
          items: order.items.map((i) => ({
            name: i.product?.name || 'Product',
            qty: i.qty,
            price: i.priceAtPurchase,
          })),
          transactionHash: hash,
          digitalSignature: signature,
          signedAt: signedAt || order.createdAt,
          canonicalData: canonical,
          canonicalString: canonicalizeTransaction(canonical),
          verification,
        };
      })
    );

    return NextResponse.json({
      orders: enrichedOrders,
      publicKey: getPublicKey(),
      hashingAlgorithm: 'SHA-256',
      signatureAlgorithm: 'RSA-SHA256 (2048-bit)',
    });
  } catch (error: any) {
    console.error('[AdminSecurityAPI] GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * In-memory verification endpoint for tampering demonstration.
 * Receives transaction data (which may be intentionally altered by the admin to test verification)
 * and verifies it against the stored hash and digital signature.
 * DOES NOT MODIFY THE DATABASE.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 401 });
    }

    const body = await req.json();
    const { transactionData, storedHash, storedSignature } = body;

    if (!transactionData || !storedHash || !storedSignature) {
      return NextResponse.json(
        { error: 'Missing transactionData, storedHash, or storedSignature' },
        { status: 400 }
      );
    }

    const canonicalString = canonicalizeTransaction(transactionData);
    const verification = verifyTransactionIntegrity(transactionData, storedHash, storedSignature);

    return NextResponse.json({
      canonicalString,
      ...verification,
    });
  } catch (error: any) {
    console.error('[AdminSecurityAPI] POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
