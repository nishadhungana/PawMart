'use client';

import { useState } from 'react';
import { useCart } from '@/components/providers/CartProvider';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { formatNPR } from '@/lib/utils';
import { ShieldCheck, CheckCircle, CreditCard, MapPin, Truck, AlertCircle, Lock } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { cart, cartTotal, clearCart } = useCart();

  const [address, setAddress] = useState('Baneshwor Height, Ward 10, Kathmandu');
  const [phone, setPhone] = useState('+977-9841234567');
  const [paymentMethod, setPaymentMethod] = useState<'ESEWA' | 'KHALTI' | 'COD' | 'CREDIT_CARD'>('ESEWA');
  
  // Payment Simulation Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [walletId, setWalletId] = useState('9841234567');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Credit Card Form State
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  const deliveryFee = 100;
  const grandTotal = cartTotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
        <button
          onClick={() => router.push('/marketplace')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  // Format card number with spaces every 4 digits
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // Format expiry as MM/YY
  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return digits.slice(0, 2) + '/' + digits.slice(2);
    }
    return digits;
  };

  // Detect card type from number
  const getCardType = (number: string): string => {
    const digits = number.replace(/\D/g, '');
    if (digits.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
    if (/^3[47]/.test(digits)) return 'Amex';
    if (digits.startsWith('6011') || digits.startsWith('65')) return 'Discover';
    return '';
  };

  // Get card brand color
  const getCardBrandColor = (type: string) => {
    switch (type) {
      case 'Visa': return 'text-blue-600';
      case 'Mastercard': return 'text-red-500';
      case 'Amex': return 'text-blue-800';
      case 'Discover': return 'text-orange-500';
      default: return 'text-gray-400';
    }
  };

  // Validate credit card form
  const validateCard = (): boolean => {
    const errors: Record<string, string> = {};
    const digits = cardNumber.replace(/\D/g, '');
    
    if (!cardName.trim()) {
      errors.name = 'Cardholder name is required';
    }
    
    if (digits.length < 13 || digits.length > 16) {
      errors.number = 'Enter a valid card number (13-16 digits)';
    }
    
    const expiryDigits = cardExpiry.replace(/\D/g, '');
    if (expiryDigits.length !== 4) {
      errors.expiry = 'Enter a valid expiry (MM/YY)';
    } else {
      const month = parseInt(expiryDigits.slice(0, 2));
      if (month < 1 || month > 12) {
        errors.expiry = 'Invalid month';
      }
    }
    
    if (cardCvv.length < 3 || cardCvv.length > 4) {
      errors.cvv = 'Enter a valid CVV (3-4 digits)';
    }
    
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!session) {
      router.push('/login?callbackUrl=/checkout');
      return;
    }

    if (paymentMethod === 'ESEWA' || paymentMethod === 'KHALTI') {
      setShowPaymentModal(true);
      return;
    }

    if (paymentMethod === 'CREDIT_CARD') {
      setShowCardModal(true);
      return;
    }

    // COD Direct submission
    await processOrderSubmission('COD');
  };

  const handleCardPayment = async () => {
    if (!validateCard()) return;
    await processOrderSubmission('CREDIT_CARD');
  };

  const processOrderSubmission = async (method: 'ESEWA' | 'KHALTI' | 'COD' | 'CREDIT_CARD') => {
    setSubmitting(true);
    setError('');

    try {
      const orderItems = cart.map((item) => ({
        productId: item.id,
        sellerId: item.sellerId,
        qty: item.quantity,
        priceAtPurchase: item.price,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          total: grandTotal,
          paymentMethod: method,
          shippingAddress: `${address} (${phone})`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to place order');
        setSubmitting(false);
        setShowPaymentModal(false);
        setShowCardModal(false);
      } else {
        clearCart();
        router.push('/customer/dashboard?orderSuccess=true');
      }
    } catch (err) {
      setError('An error occurred while placing order');
      setSubmitting(false);
      setShowPaymentModal(false);
      setShowCardModal(false);
    }
  };

  const detectedCardType = getCardType(cardNumber);
  const maskedCardNum = cardNumber.replace(/\D/g, '');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500">Complete your shipping address and payment details</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 shadow-sm">
          <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>🔒 Secure Checkout • Protected with SSL/TLS &amp; SHA-256 / RSA Signatures</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Shipping & Contact Details
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Full Shipping Address in Nepal</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl"
                  placeholder="e.g. Baneshwor Height, Ward 10, Kathmandu"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Contact Phone Number (+977)</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl"
                  placeholder="+977-98XXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" /> Payment Option
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Credit Card */}
              <button
                type="button"
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`p-4 rounded-xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">💳</span>
                <span className="text-sm font-bold">Credit / Debit Card</span>
                <span className="text-[10px] text-gray-500">Visa, Mastercard, Amex</span>
              </button>

              {/* eSewa */}
              <button
                type="button"
                onClick={() => setPaymentMethod('ESEWA')}
                className={`p-4 rounded-xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  paymentMethod === 'ESEWA'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">🟢</span>
                <span className="text-sm font-bold">eSewa Mobile Wallet</span>
                <span className="text-[10px] text-gray-500">Instant digital QR</span>
              </button>

              {/* Khalti */}
              <button
                type="button"
                onClick={() => setPaymentMethod('KHALTI')}
                className={`p-4 rounded-xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  paymentMethod === 'KHALTI'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">🟣</span>
                <span className="text-sm font-bold">Khalti Digital Wallet</span>
                <span className="text-[10px] text-gray-500">Instant web checkout</span>
              </button>

              {/* COD */}
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  paymentMethod === 'COD'
                    ? 'border-orange-600 bg-orange-50 text-orange-900 font-bold'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">💵</span>
                <span className="text-sm font-bold">Cash on Delivery</span>
                <span className="text-[10px] text-gray-500">Pay upon delivery</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items Total ({cart.length})</span>
              <span className="font-semibold text-gray-900">{formatNPR(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Standard Shipping</span>
              <span className="font-semibold text-gray-900">{formatNPR(deliveryFee)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-extrabold text-gray-900">
              <span>Total Payable</span>
              <span className="text-emerald-700">{formatNPR(grandTotal)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={submitting}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-600/30 transition flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              'Processing Order...'
            ) : (
              <>
                Confirm & Pay <ShieldCheck className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payment Simulation Modal for eSewa / Khalti */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl border border-gray-100">
            <div className="text-center space-y-2">
              <span className="text-4xl">
                {paymentMethod === 'ESEWA' ? '🟢' : '🟣'}
              </span>
              <h3 className="text-xl font-extrabold text-gray-900">
                Simulated {paymentMethod} Gateway
              </h3>
              <p className="text-xs text-gray-500">
                Mock payment authorization for PawMart Nepal purchase of <strong>{formatNPR(grandTotal)}</strong>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Merchant:</span>
                <span className="font-bold text-gray-900">PawMart Nepal Pvt. Ltd.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Amount:</span>
                <span className="font-bold text-emerald-700">{formatNPR(grandTotal)}</span>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {paymentMethod} Registered Phone / ID
                </label>
                <input
                  type="text"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">MPIN / Token (Mock)</label>
                <input
                  type="password"
                  defaultValue="1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => processOrderSubmission(paymentMethod)}
                disabled={submitting}
                className={`flex-1 py-2.5 font-bold text-white rounded-xl text-xs transition ${
                  paymentMethod === 'ESEWA'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {submitting ? 'Verifying...' : `Pay ${formatNPR(grandTotal)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Card Payment Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">
                Secure Card Payment
              </h3>
              <p className="text-xs text-gray-500">
                Pay <strong className="text-blue-700">{formatNPR(grandTotal)}</strong> to PawMart Nepal Pvt. Ltd.
              </p>
            </div>

            {/* Visual Card Preview */}
            <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xl overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-24 h-24 rounded-full border-2 border-white/30" />
                <div className="absolute top-4 right-12 w-24 h-24 rounded-full border-2 border-white/30" />
              </div>
              
              <div className="relative space-y-4">
                {/* Chip & Card Type */}
                <div className="flex justify-between items-start">
                  <div className="w-10 h-7 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md" />
                  <div className="text-right">
                    {detectedCardType ? (
                      <span className="text-sm font-bold tracking-wider">{detectedCardType}</span>
                    ) : (
                      <span className="text-xs text-white/50">Card Type</span>
                    )}
                  </div>
                </div>
                
                {/* Card Number */}
                <div className="font-mono text-lg tracking-[0.2em] text-white/90">
                  {maskedCardNum.length > 0
                    ? formatCardNumber(maskedCardNum)
                    : '•••• •••• •••• ••••'}
                </div>
                
                {/* Name & Expiry */}
                <div className="flex justify-between items-end text-xs">
                  <div>
                    <div className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Cardholder</div>
                    <div className="font-semibold tracking-wide">
                      {cardName.trim() || 'YOUR NAME'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Expires</div>
                    <div className="font-semibold font-mono">
                      {cardExpiry || 'MM/YY'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Form Fields */}
            <div className="space-y-4 text-sm">
              {/* Cardholder Name */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Cardholder Name</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className={`w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${
                    cardErrors.name ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="e.g. RAM BAHADUR SHRESTHA"
                />
                {cardErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{cardErrors.name}</p>
                )}
              </div>

              {/* Card Number */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCardNumber(cardNumber)}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    className={`w-full px-4 py-2.5 border rounded-xl bg-white font-mono tracking-wider pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${
                      cardErrors.number ? 'border-red-400' : 'border-gray-300'
                    }`}
                    placeholder="1234 5678 9012 3456"
                    inputMode="numeric"
                  />
                  {detectedCardType && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${getCardBrandColor(detectedCardType)}`}>
                      {detectedCardType}
                    </span>
                  )}
                </div>
                {cardErrors.number && (
                  <p className="text-red-500 text-xs mt-1">{cardErrors.number}</p>
                )}
              </div>

              {/* Expiry & CVV Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">Expiry Date</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    className={`w-full px-4 py-2.5 border rounded-xl bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${
                      cardErrors.expiry ? 'border-red-400' : 'border-gray-300'
                    }`}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    maxLength={5}
                  />
                  {cardErrors.expiry && (
                    <p className="text-red-500 text-xs mt-1">{cardErrors.expiry}</p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">CVV</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className={`w-full px-4 py-2.5 border rounded-xl bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${
                        cardErrors.cvv ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="•••"
                      inputMode="numeric"
                      maxLength={4}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {cardErrors.cvv && (
                    <p className="text-red-500 text-xs mt-1">{cardErrors.cvv}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl border border-blue-100">
              <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-[11px] text-blue-700">
                <strong>Simulated payment</strong> — No real charges will be made. This is a demo checkout experience for PawMart Nepal.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCardModal(false);
                  setCardErrors({});
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCardPayment}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  'Processing...'
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pay {formatNPR(grandTotal)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
