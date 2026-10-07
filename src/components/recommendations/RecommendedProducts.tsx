'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import TrackableProductCard from '@/components/product/TrackableProductCard';
import type { RecommendedProduct, RecommendationResponse } from '@/lib/recommendations';

interface RecommendedProductsProps {
  title?: string;
  subtitle?: string;
  maxDisplay?: number;
  className?: string;
}

export default function RecommendedProducts({
  title: customTitle,
  subtitle: customSubtitle,
  maxDisplay = 4,
  className = '',
}: RecommendedProductsProps) {
  const { data: session, status } = useSession();
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchRecommendations() {
      setLoading(true);
      try {
        const res = await fetch('/api/recommendations');
        if (!res.ok) throw new Error('Failed to load recommendations');
        const json: RecommendationResponse = await res.json();

        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        console.error('Recommendations fetch error:', err);
        if (isMounted) {
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Run fetch whenever authentication status changes (login / logout)
    if (status !== 'loading') {
      fetchRecommendations();
    }

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, status]);

  // Loading skeleton state
  if (loading) {
    return (
      <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 ${className}`}>
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-gray-200 animate-pulse rounded-full" />
            <div className="h-7 w-56 bg-gray-200 animate-pulse rounded-lg" />
            <div className="h-4 w-72 bg-gray-100 animate-pulse rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-pulse space-y-3"
            >
              <div className="aspect-square bg-gray-100 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <div className="h-5 bg-gray-200 rounded w-16" />
                <div className="h-8 bg-gray-200 rounded-xl w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // If no products available or error occurred, gracefully return null
  if (!data || !data.products || data.products.length === 0) {
    return null;
  }

  const isCollaborative = data.type === 'collaborative';
  const displayTitle = customTitle || data.title;
  const displaySubtitle = customSubtitle || data.subtitle;
  const displayProducts = data.products.slice(0, maxDisplay);

  return (
    <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 mb-2">
            {isCollaborative ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Collaborative Recommendations</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                <span>Popular in Nepal</span>
              </>
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{displayTitle}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{displaySubtitle}</p>
        </div>

        <Link
          href="/marketplace"
          className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group transition"
        >
          View Marketplace <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>

      {/* Responsive Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayProducts.map((product, idx) => {
          let badge: string | undefined = undefined;
          if (isCollaborative) {
            badge = idx === 0 ? 'Top Pick' : 'Recommended';
          } else {
            badge = idx === 0 ? 'Trending' : 'Popular';
          }

          return (
            <TrackableProductCard
              key={product.id}
              product={product}
              priorityBadge={badge}
            />
          );
        })}
      </div>
    </section>
  );
}
