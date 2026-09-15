import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CUSTOMER', 'SELLER', 'VET', 'ADMIN']),
  phone: z.string().optional(),
  shopName: z.string().optional(),
  city: z.string().optional(),
  clinicName: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const passwordHash = bcrypt.hashSync(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        passwordHash,
        role: validatedData.role,
        phone: validatedData.phone || '+977-9800000000',
        ...(validatedData.role === 'CUSTOMER' && {
          customerProfile: {
            create: {
              addresses: JSON.stringify([
                {
                  id: 'addr-default',
                  title: 'Home',
                  street: validatedData.address || 'Kathmandu',
                  city: validatedData.city || 'Kathmandu',
                  phone: validatedData.phone || '+977-9800000000',
                  isDefault: true,
                },
              ]),
              pets: JSON.stringify([]),
            },
          },
        }),
        ...(validatedData.role === 'SELLER' && {
          sellerProfile: {
            create: {
              shopName: validatedData.shopName || `${validatedData.name}'s Pet Shop`,
              city: validatedData.city || 'Kathmandu',
              address: validatedData.address || 'New Road, Kathmandu',
              verified: true,
            },
          },
        }),
        ...(validatedData.role === 'VET' && {
          vetProfile: {
            create: {
              clinicName: validatedData.clinicName || `${validatedData.name} Vet Clinic`,
              city: validatedData.city || 'Kathmandu',
              address: validatedData.address || 'Lazimpat, Kathmandu',
              verified: true,
            },
          },
        }),
      },
    });

    return NextResponse.json({
      message: 'Account created successfully',
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
