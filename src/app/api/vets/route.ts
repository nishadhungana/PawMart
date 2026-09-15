import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const search = searchParams.get('search');

    const where: any = {
      verified: true,
    };

    if (city) {
      where.city = { equals: city };
    }

    if (search) {
      where.OR = [
        { clinicName: { contains: search } },
        { address: { contains: search } },
        { servicesOffered: { contains: search } },
      ];
    }

    const vets = await prisma.vetProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { rating: 'desc' },
    });

    return NextResponse.json(vets);
  } catch (error) {
    console.error('Error fetching vets:', error);
    return NextResponse.json({ error: 'Failed to fetch vet clinics' }, { status: 500 });
  }
}
