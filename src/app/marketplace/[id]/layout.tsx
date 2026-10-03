import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true, seller: true },
    });

    if (!product) {
      return {
        title: 'Product Not Found | PawMart Nepal',
        description: 'The requested pet product could not be found on PawMart Nepal.',
      };
    }

    let images: string[] = [];
    try {
      images = typeof product.images === 'string' ? JSON.parse(product.images || '[]') : product.images || [];
    } catch {
      images = [];
    }

    const title = `${product.name} | Pet Supplies Nepal`;
    const description = product.description
      ? product.description.slice(0, 160)
      : `Buy authentic ${product.name} online at PawMart Nepal for NPR ${product.price}. Genuine pet supplies with fast delivery across Nepal.`;

    const imageUrl = images[0] || '/hero.jpeg';

    return {
      title,
      description,
      openGraph: {
        title: `${product.name} | PawMart Nepal`,
        description,
        type: 'website',
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 800,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} | PawMart Nepal`,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Product Details | PawMart Nepal',
      description: 'Shop genuine pet supplies in Nepal on PawMart.',
    };
  }
}

export default function ProductDetailLayout({ children }: Props) {
  return <>{children}</>;
}
