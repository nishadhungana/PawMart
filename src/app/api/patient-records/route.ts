import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const recordSchema = z.object({
  petName: z.string().min(1, 'Pet name is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  diagnosis: z.string().min(3, 'Diagnosis is required'),
  prescription: z.string().min(3, 'Prescription details are required'),
  followUpNotes: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const petName = searchParams.get('petName');
    const customerId = searchParams.get('customerId');

    const { role, id: userId } = session.user;
    const where: any = {};

    if (role === 'CUSTOMER') {
      where.customerId = userId;
    } else if (role === 'VET') {
      const vet = await prisma.vetProfile.findUnique({ where: { userId } });
      if (vet) where.vetId = vet.id;
    }

    if (petName) {
      where.petName = { contains: petName };
    }

    if (customerId && role !== 'CUSTOMER') {
      where.customerId = customerId;
    }

    const records = await prisma.patientRecord.findMany({
      where,
      include: {
        customer: { select: { name: true, phone: true } },
        vet: { select: { clinicName: true, city: true } },
      },
      orderBy: { visitDate: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching patient records:', error);
    return NextResponse.json({ error: 'Failed to fetch patient records' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'VET' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vet = await prisma.vetProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!vet && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Vet profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = recordSchema.parse(body);

    const record = await prisma.patientRecord.create({
      data: {
        petName: validatedData.petName,
        customerId: validatedData.customerId,
        vetId: vet ? vet.id : body.vetId,
        diagnosis: validatedData.diagnosis,
        prescription: validatedData.prescription,
        followUpNotes: validatedData.followUpNotes,
      },
      include: {
        customer: { select: { name: true } },
        vet: { select: { clinicName: true } },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error logging patient record:', error);
    return NextResponse.json({ error: 'Failed to create patient record' }, { status: 500 });
  }
}
