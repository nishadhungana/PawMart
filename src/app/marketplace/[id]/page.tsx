'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/components/providers/CartProvider';
import PlaceholderImage from '@/components/ui/PlaceholderImage';
import { formatNPR } from '@/lib/utils';
import { ShoppingBag, Heart, Stethoscope, Store, MapPin, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const productId = params?.id as string;

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    const images = JSON.parse(product.images || '[]');
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: images[0] || '',
        sellerId: product.sellerId,
        sellerShopName: product.seller.shopName,
        stock: product.stock,
      },
      quantity
    );
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 3000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push('/login');
      return;
    }
    setReviewError('');
    setSubmittingReview(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || 'Failed to submit review');
      } else {
        setComment('');
        // Refresh product data
        const updatedRes = await fetch(`/api/products/${productId}`);
        const updatedData = await updatedRes.json();
        setProduct(updatedData);
      }
    } catch (err) {
      setReviewError('Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Loading product details...</p>
      </div>
    );
  }

  if (!product || product.error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
        <p className="text-xs text-gray-500">This product listing may have been removed or is unavailable.</p>
        <button
          onClick={() => router.push('/marketplace')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const images = JSON.parse(product.images || '[]');
  const inWishlist = isInWishlist(product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Product Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
            <PlaceholderImage src={images[0]} alt={product.name} />
            {product.vetRecommended && (
              <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow">
                <Stethoscope className="w-3.5 h-3.5" /> Vet Recommended
              </span>
            )}
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold mb-2">
              <span className="bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">{product.category.name}</span>
              {product.brand && <span className="bg-gray-100 px-2.5 py-1 rounded-md text-gray-700">Brand: {product.brand}</span>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>

            {/* Seller Info */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
              <div className="flex items-center gap-1.5 font-medium">
                <Store className="w-4 h-4 text-orange-500" />
                <span>Sold by <strong className="text-gray-900">{product.seller.shopName}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{product.seller.city} ({product.seller.address})</span>
              </div>
            </div>
          </div>

          {/* Price & Stock */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Price in NPR</div>
              <div className="text-3xl font-extrabold text-gray-900">{formatNPR(product.price)}</div>
            </div>
            <div className="text-right">
              {product.stock > 0 ? (
                <div>
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                    In Stock ({product.stock} units available)
                  </span>
                  {product.stock <= product.lowStockThreshold && (
                    <div className="text-[11px] text-orange-600 font-semibold mt-1">⚠️ Low Stock Alert</div>
                  )}
                </div>
              ) : (
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                  Currently Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Quantity Selector & Action Buttons */}
          {product.stock > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 font-bold text-sm text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-600/30 transition flex items-center justify-center gap-2 text-sm"
                >
                  <ShoppingBag className="w-5 h-5" /> Add to Cart
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-center ${
                    inWishlist
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? 'fill-rose-600' : ''}`} />
                </button>
              </div>

              {addedMessage && (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Added {quantity} x &quot;{product.name}&quot; to your cart!
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="border-t border-gray-200 pt-6 space-y-2">
            <h3 className="font-bold text-gray-900 text-sm">Product Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-gray-200 pt-10 space-y-6">
        <h2 className="text-2xl font-extrabold text-gray-900">Verified Customer Reviews</h2>

        {/* Add Review Form */}
        {session && session.user.role === 'CUSTOMER' && (
          <form onSubmit={handleReviewSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4 max-w-2xl">
            <h3 className="font-bold text-gray-900 text-sm">Write a Product Review</h3>
            {reviewError && <div className="text-xs text-red-600">{reviewError}</div>}

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700">Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-lg focus:outline-none"
                  >
                    <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your pet's experience with this product?"
              className="w-full p-3 border border-gray-300 rounded-xl text-sm"
            ></textarea>

            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {product.reviews.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
            No reviews yet for this product. Be the first customer to leave a review!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.reviews.map((r: any) => (
              <div key={r.id} className="bg-white p-5 rounded-2xl border border-gray-200 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm">{r.customer.name}</span>
                  {r.verifiedPurchase && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                      Verified Purchase
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>

                <p className="text-xs text-gray-600 italic">&quot;{r.comment}&quot;</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
