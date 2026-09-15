'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/components/providers/CartProvider';
import Link from 'next/link';
import PlaceholderImage from '@/components/ui/PlaceholderImage';
import { formatNPR } from '@/lib/utils';
import { Trash2, ShoppingBag, Heart } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlist.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data.filter((p: any) => wishlist.includes(p.id)));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [wishlist]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">Loading wishlist...</div>;
  }

  if (products.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="text-6xl mb-2">❤️</div>
        <h1 className="text-2xl font-bold text-gray-900">Your Wishlist is Empty</h1>
        <p className="text-gray-500 text-sm">Save items you love by tapping the heart icon on any product.</p>
        <Link
          href="/marketplace"
          className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
        >
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-2xl font-extrabold text-gray-900 border-b border-gray-200 pb-4">
        My Saved Wishlist ({products.length} items)
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const images = JSON.parse(product.images || '[]');
          return (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50">
                  <PlaceholderImage src={images[0]} alt={product.name} />
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur text-rose-600 rounded-full hover:bg-white transition"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs font-semibold text-emerald-700">{product.category.name}</div>
                <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{product.name}</h3>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="font-extrabold text-gray-900 text-base">{formatNPR(product.price)}</span>
                <button
                  onClick={() =>
                    addToCart({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: images[0] || '',
                      sellerId: product.sellerId,
                      sellerShopName: product.seller.shopName,
                      stock: product.stock,
                    })
                  }
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Move to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
