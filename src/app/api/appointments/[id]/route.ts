import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, feeEstimate, notes } = body;

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: status || undefined,
        feeEstimate: feeEstimate !== undefined ? parseFloat(feeEstimate) : undefined,
        notes: notes || undefined,
      },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        vet: true,
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}
