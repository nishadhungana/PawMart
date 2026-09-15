'use client';

import { useCart } from '@/components/providers/CartProvider';
import Link from 'next/link';
import PlaceholderImage from '@/components/ui/PlaceholderImage';
import { formatNPR } from '@/lib/utils';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();

  const deliveryFee = cart.length > 0 ? 100 : 0;
  const grandTotal = cartTotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-6xl mb-2">🛒</div>
        <h1 className="text-2xl font-bold text-gray-900">Your Cart is Empty</h1>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Explore PawMart Nepal&apos;s wide range of pet foods, treats, toys, and grooming kits.
        </p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition"
        >
          <ShoppingBag className="w-5 h-5" /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900">Shopping Cart ({cart.length} items)</h1>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-700 font-semibold"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex gap-4 items-center"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <PlaceholderImage src={item.image} alt={item.name} />
              </div>

              <div className="flex-1 space-y-1">
                <div className="text-[11px] text-emerald-700 font-semibold">{item.sellerShopName}</div>
                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h3>
                <div className="text-xs text-gray-500">{formatNPR(item.price)} each</div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-gray-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs"
                  >
                    +
                  </button>
                </div>

                <div className="w-24 text-right font-extrabold text-gray-900 text-sm">
                  {formatNPR(item.price * item.quantity)}
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-gray-900">{formatNPR(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Standard Delivery (Nepal)</span>
              <span className="font-semibold text-gray-900">{formatNPR(deliveryFee)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-extrabold text-gray-900">
              <span>Grand Total</span>
              <span className="text-emerald-700">{formatNPR(grandTotal)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Encrypted digital payments via eSewa, Khalti, or Cash on Delivery.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
