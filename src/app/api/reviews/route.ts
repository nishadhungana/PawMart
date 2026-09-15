import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3, 'Review comment must be at least 3 characters'),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = reviewSchema.parse(body);

    // Check if customer bought product
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        customerId: session.user.id,
        status: 'DELIVERED',
        items: {
          some: { productId: validatedData.productId },
        },
      },
    });

    const review = await prisma.review.create({
      data: {
        productId: validatedData.productId,
        customerId: session.user.id,
        rating: validatedData.rating,
        comment: validatedData.comment,
        verifiedPurchase: !!deliveredOrder,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
