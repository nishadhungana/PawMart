import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import PlaceholderImage from '@/components/ui/PlaceholderImage';
import { formatNPR } from '@/lib/utils';
import { Search, Filter, Stethoscope, Check } from 'lucide-react';

export const revalidate = 0;

interface SearchParams {
  category?: string;
  search?: string;
  vetRecommended?: string;
  maxPrice?: string;
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category, search, vetRecommended, maxPrice } = searchParams;

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  const where: any = { status: 'PUBLISHED' };

  if (category) {
    where.category = { slug: category };
  }

  if (vetRecommended === 'true') {
    where.vetRecommended = true;
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
    include: { category: true, seller: true, reviews: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-8 rounded-3xl shadow-md">
        <h1 className="text-3xl font-extrabold tracking-tight">Pet Supplies Marketplace</h1>
        <p className="text-emerald-100 text-sm mt-1 max-w-xl">
          Browse authentic dog food, cat treats, bird supplies, grooming kits & vet-approved health care from verified Nepali shop sellers.
        </p>

        {/* Search Bar */}
        <form className="mt-6 flex gap-2 max-w-2xl" action="/marketplace" method="GET">
          {category && <input type="hidden" name="category" value={category} />}
          {vetRecommended && <input type="hidden" name="vetRecommended" value={vetRecommended} />}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="Search Royal Canin, Whiskas, Anti-tick shampoo, Kong toy..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-gray-900 bg-white placeholder-gray-400 text-sm border-0 focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Options & Category Pills */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
          {/* Category Selector Pills */}
          <div className="flex flex-wrap gap-2 items-center">
            <Link
              href={`/marketplace${vetRecommended ? '?vetRecommended=true' : ''}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                !category ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/marketplace?category=${cat.slug}${vetRecommended ? '&vetRecommended=true' : ''}`}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  category === cat.slug ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Vet Recommended Toggle Button */}
          <Link
            href={`/marketplace?${category ? `category=${category}&` : ''}${
              vetRecommended === 'true' ? '' : 'vetRecommended=true'
            }`}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition border ${
              vetRecommended === 'true'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vet Recommended Only</span>
            {vetRecommended === 'true' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </Link>
        </div>

        {/* Results Counter */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Showing <strong className="text-gray-900">{products.length}</strong> products in Nepal</span>
          {(category || search || vetRecommended) && (
            <Link href="/marketplace" className="text-emerald-600 hover:underline font-medium">
              Reset Filters
            </Link>
          )}
        </div>
      </div>

      {/* Product Catalog Grid */}
      {products.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-4 max-w-md mx-auto my-12">
          <div className="text-5xl">🔍</div>
          <h3 className="text-lg font-bold text-gray-900">No products found</h3>
          <p className="text-xs text-gray-500">
            We couldn&apos;t find any pet products matching your selected search query or filters.
          </p>
          <Link
            href="/marketplace"
            className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
          >
            Clear Filters & View All
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const images = JSON.parse(product.images || '[]');
            const ratingSum = product.reviews.reduce((acc, r) => acc + r.rating, 0);
            const avgRating = product.reviews.length ? (ratingSum / product.reviews.length).toFixed(1) : null;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-lg transition flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50">
                    <PlaceholderImage src={images[0]} alt={product.name} />
                    {product.vetRecommended && (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Vet Approved
                      </span>
                    )}
                    {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                      <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Low Stock ({product.stock})
                      </span>
                    )}
                    {product.stock === 0 && (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="font-medium text-emerald-700">{product.category.name}</span>
                    <span className="text-gray-400">{product.seller.shopName}</span>
                  </div>

                  <h2 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-emerald-600 transition mb-2">
                    <Link href={`/marketplace/${product.id}`}>{product.name}</Link>
                  </h2>

                  {avgRating && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 mb-2">
                      <span>★</span>
                      <span className="font-bold">{avgRating}</span>
                      <span className="text-gray-400">({product.reviews.length})</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Price</div>
                    <div className="font-extrabold text-gray-900 text-lg">{formatNPR(product.price)}</div>
                  </div>
                  <Link
                    href={`/marketplace/${product.id}`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
