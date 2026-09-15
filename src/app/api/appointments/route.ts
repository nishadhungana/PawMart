import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const appointmentSchema = z.object({
  vetId: z.string().min(1, 'Vet clinic is required'),
  petName: z.string().min(1, 'Pet name is required'),
  petType: z.string().min(1, 'Pet type is required'),
  type: z.enum(['CLINIC_VISIT', 'HOME_VISIT']),
  requestedDate: z.string().min(1, 'Date is required'),
  requestedTime: z.string().min(1, 'Time slot is required'),
  address: z.string().optional(),
  notes: z.string().optional(),
  isUrgent: z.boolean().default(false),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    let appointments;

    if (role === 'VET') {
      const vet = await prisma.vetProfile.findUnique({ where: { userId } });
      if (!vet) return NextResponse.json([]);

      appointments = await prisma.appointment.findMany({
        where: { vetId: vet.id },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          vet: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'ADMIN') {
      appointments = await prisma.appointment.findMany({
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          vet: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // CUSTOMER
      appointments = await prisma.appointment.findMany({
        where: { customerId: userId },
        include: {
          vet: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = appointmentSchema.parse(body);

    const appointment = await prisma.appointment.create({
      data: {
        customerId: session.user.id,
        vetId: validatedData.vetId,
        petName: validatedData.petName,
        petType: validatedData.petType,
        type: validatedData.type,
        requestedDate: validatedData.requestedDate,
        requestedTime: validatedData.requestedTime,
        address: validatedData.address || undefined,
        notes: validatedData.notes || undefined,
        isUrgent: validatedData.isUrgent,
        status: 'PENDING',
        feeEstimate: validatedData.type === 'HOME_VISIT' ? 2500 : 1200,
      },
      include: { vet: true },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error booking appointment:', error);
    return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 });
  }
}
