import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  price: z.number().positive('Price must be greater than 0'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.number().int().min(0).default(5),
  images: z.array(z.string()).default([]),
  vetRecommended: z.boolean().default(false),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const search = searchParams.get('search');
    const vetRecommended = searchParams.get('vetRecommended');
    const sellerId = searchParams.get('sellerId');
    const brand = searchParams.get('brand');
    const maxPrice = searchParams.get('maxPrice');

    const where: any = {
      status: 'PUBLISHED',
    };

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (vetRecommended === 'true') {
      where.vetRecommended = true;
    }

    if (brand) {
      where.brand = { contains: brand };
    }

    if (maxPrice) {
      where.price = { lte: parseFloat(maxPrice) };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        seller: true,
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'SELLER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!seller && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        sellerId: seller ? seller.id : body.sellerId,
        categoryId: validatedData.categoryId,
        name: validatedData.name,
        brand: validatedData.brand,
        description: validatedData.description,
        price: validatedData.price,
        stock: validatedData.stock,
        lowStockThreshold: validatedData.lowStockThreshold,
        images: JSON.stringify(validatedData.images),
        vetRecommended: validatedData.vetRecommended,
        status: 'PUBLISHED',
      },
      include: { category: true, seller: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
