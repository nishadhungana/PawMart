import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      include: {
        customerProfile: true,
        sellerProfile: true,
        vetProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sellerId, vetId, verified } = body;

    if (sellerId) {
      const seller = await prisma.sellerProfile.update({
        where: { id: sellerId },
        data: { verified },
      });
      return NextResponse.json(seller);
    }

    if (vetId) {
      const vet = await prisma.vetProfile.update({
        where: { id: vetId },
        data: { verified },
      });
      return NextResponse.json(vet);
    }

    return NextResponse.json({ error: 'Invalid update request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating profile status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
