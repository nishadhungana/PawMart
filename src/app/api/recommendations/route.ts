import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRecommendations } from '@/lib/recommendations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Authenticate user server-side via NextAuth
    // Never trust a userId supplied by client query params or headers
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // 2. Execute recommendation engine (collaborative filtering or cold-start fallback)
    const result = await getRecommendations(userId, 4);

    // 3. Return sanitized, customer-safe response
    return NextResponse.json({
      type: result.type,
      title: result.title,
      subtitle: result.subtitle,
      products: result.products,
      recommendations: result.products, // Alias for client convenience
    });
  } catch (error: any) {
    console.error('API /api/recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve recommendations', details: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
