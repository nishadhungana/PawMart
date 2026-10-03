'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import PlaceholderImage from '@/components/ui/PlaceholderImage';
import { formatNPR } from '@/lib/utils';
import { trackCustomEvent } from '@/lib/meta-pixel';

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    images?: string | string[];
    stock: number;
    lowStockThreshold?: number;
    vetRecommended?: boolean;
    category?: {
      id?: string;
      name: string;
      slug?: string;
    };
    seller?: {
      shopName: string;
    };
    reviews?: {
      rating: number;
    }[];
  };
  showSeller?: boolean;
  priorityBadge?: string;
}

export default function TrackableProductCard({
  product,
  showSeller = true,
  priorityBadge,
}: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const impressionLogged = useRef(false);

  // Parse images safely
  let images: string[] = [];
  try {
    images = typeof product.images === 'string' ? JSON.parse(product.images || '[]') : product.images || [];
  } catch {
    images = [];
  }

  // Calculate review rating
  const reviews = product.reviews || [];
  const ratingSum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = reviews.length ? (ratingSum / reviews.length).toFixed(1) : null;

  // Track product impression when visible in viewport
  useEffect(() => {
    const element = cardRef.current;
    if (!element || impressionLogged.current) return;

    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionLogged.current) {
            impressionLogged.current = true;
            trackCustomEvent('ProductImpression', {
              content_ids: [product.id],
              content_name: product.name,
              category: product.category?.name || 'Pet Supplies',
              value: product.price,
              currency: 'NPR',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.25, // Trigger when 25% of card is visible
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [product]);

  // Track product click
  const handleProductClick = () => {
    trackCustomEvent('ProductClick', {
      content_ids: [product.id],
      content_name: product.name,
      category: product.category?.name || 'Pet Supplies',
      value: product.price,
      currency: 'NPR',
    });
  };

  const isLowStock =
    product.stock > 0 &&
    typeof product.lowStockThreshold === 'number' &&
    product.stock <= product.lowStockThreshold;
  const isOutOfStock = product.stock === 0;

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-lg transition flex flex-col justify-between group"
    >
      <div>
        <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50">
          <Link href={`/marketplace/${product.id}`} onClick={handleProductClick} className="block w-full h-full">
            <PlaceholderImage src={images[0]} alt={product.name} />
          </Link>

          {/* Badges */}
          {priorityBadge ? (
            <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              {priorityBadge}
            </span>
          ) : product.vetRecommended ? (
            <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              Vet Approved
            </span>
          ) : null}

          {isOutOfStock ? (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              Low Stock ({product.stock})
            </span>
          ) : null}
        </div>

        {/* Category & Seller */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          {product.category?.name && (
            <span className="font-medium text-emerald-700">{product.category.name}</span>
          )}
          {showSeller && product.seller?.shopName && (
            <span className="text-gray-400 truncate max-w-[120px]">{product.seller.shopName}</span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-emerald-600 transition mb-2">
          <Link href={`/marketplace/${product.id}`} onClick={handleProductClick}>
            {product.name}
          </Link>
        </h2>

        {/* Ratings */}
        {avgRating && (
          <div className="flex items-center gap-1 text-xs text-amber-600 mb-2">
            <span>★</span>
            <span className="font-bold">{avgRating}</span>
            <span className="text-gray-400">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Footer / Price & Button */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Price</div>
          <div className="font-extrabold text-gray-900 text-lg">{formatNPR(product.price)}</div>
        </div>
        <Link
          href={`/marketplace/${product.id}`}
          onClick={handleProductClick}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
