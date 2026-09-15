import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notification = await prisma.notification.updateMany({
      where: { id: params.id, userId: session.user.id },
      data: { read: true },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error marking notification read:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
