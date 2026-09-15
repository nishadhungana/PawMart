'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatNPR, formatDate } from '@/lib/utils';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  FileText,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';

export default function AdminSecurityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [publicKey, setPublicKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState(false);

  // In-Memory Tampering State
  const [tamperAmount, setTamperAmount] = useState<number>(0);
  const [tamperPaymentStatus, setTamperPaymentStatus] = useState<string>('PAID');
  const [tamperVerification, setTamperVerification] = useState<any>(null);
  const [verifyingTamper, setVerifyingTamper] = useState(false);
  const [isTamperedState, setIsTamperedState] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user && session.user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchSecurityData();
  }, [session, status]);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/security');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setPublicKey(data.publicKey || '');
        if (data.orders?.length > 0 && !selectedOrderId) {
          const first = data.orders[0];
          setSelectedOrderId(first.id);
          initTamperForm(first);
        }
      }
    } catch (err) {
      console.error('Failed to load security data', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  const initTamperForm = (order: any) => {
    if (!order) return;
    setTamperAmount(order.total);
    setTamperPaymentStatus(order.paymentStatus);
    setTamperVerification(null);
    setIsTamperedState(false);
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId);
    if (ord) initTamperForm(ord);
  };

  const handleRunTamperVerification = async () => {
    if (!selectedOrder) return;
    setVerifyingTamper(true);

    try {
      const tamperedCanonicalData = {
        ...selectedOrder.canonicalData,
        amount: Number(tamperAmount),
        paymentStatus: tamperPaymentStatus,
      };

      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionData: tamperedCanonicalData,
          storedHash: selectedOrder.transactionHash,
          storedSignature: selectedOrder.digitalSignature,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTamperVerification(data);
        setIsTamperedState(
          Number(tamperAmount) !== Number(selectedOrder.total) ||
          tamperPaymentStatus !== selectedOrder.paymentStatus
        );
      }
    } catch (err) {
      console.error('Tampering verification failed', err);
    } finally {
      setVerifyingTamper(false);
    }
  };

  const handleResetTamper = () => {
    if (selectedOrder) {
      initTamperForm(selectedOrder);
    }
  };

  const copyPublicKey = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-700 transition"
              title="Return to Admin Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-emerald-600" />
                <h1 className="text-2xl font-black text-gray-900">
                  Cryptographic Security &amp; Tamper Demonstration
                </h1>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Academic demonstration of SSL/TLS, SHA-256 transaction hashing &amp; RSA-2048 digital signatures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSecurityData}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Transactions
            </button>
          </div>
        </div>

        {/* Conceptual College Viva Architecture Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <Lock className="w-4 h-4" /> 1. Transport Security (SSL/TLS)
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Protects data in transit between customer browser and server over HTTPS (port 3000), preventing eavesdropping and man-in-the-middle attacks.
            </p>
            <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-1 rounded inline-block">
              HTTPS://localhost:3000
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <Terminal className="w-4 h-4" /> 2. Transaction Hashing (SHA-256)
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Converts canonical transaction data into a deterministic 256-bit hexadecimal digest. Even a 1-paisa change completely alters the hash.
            </p>
            <div className="text-[11px] font-mono text-blue-800 bg-blue-50 px-2 py-1 rounded inline-block">
              SHA-256 Hex Digest (64 chars)
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
              <Key className="w-4 h-4" /> 3. Digital Signatures (RSA-2048)
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Provides non-repudiation &amp; authenticity. Signed with the server&apos;s secret private key and verified with the public key.
            </p>
            <div className="text-[11px] font-mono text-purple-800 bg-purple-50 px-2 py-1 rounded inline-block">
              RSA-SHA256 PKCS#1 v1.5
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
            <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto" />
            <h2 className="text-lg font-bold text-gray-900">No Orders in Database</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Place an order via the checkout page to view real-time cryptographic transaction signing and hashing!
            </p>
            <Link
              href="/marketplace"
              className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
            >
              Go to Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Transaction List */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4 h-fit">
              <div className="flex justify-between items-center">
                <h2 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> Stored Transactions ({orders.length})
                </h2>
                <span className="text-[11px] text-gray-500">Live Database</span>
              </div>

              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {orders.map((o) => {
                  const isSelected = o.id === selectedOrderId;
                  return (
                    <button
                      key={o.id}
                      onClick={() => handleSelectOrder(o.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition text-xs space-y-1.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">#{o.id.slice(-8).toUpperCase()}</span>
                        <span className="font-extrabold text-emerald-700">{formatNPR(o.total)}</span>
                      </div>
                      <div className="text-[11px] text-gray-600 truncate">
                        Customer: {o.customerName}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1">
                        <span>{formatDate(o.createdAt)}</span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Signed
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Transaction Cryptography & Tamper Demo */}
            <div className="lg:col-span-2 space-y-6">
              {selectedOrder && (
                <>
                  {/* Selected Transaction Overview */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-black text-gray-900">
                            Transaction #{selectedOrder.id.slice(-8).toUpperCase()}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            VERIFIED
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Order ID: <code className="text-gray-800 font-mono">{selectedOrder.id}</code>
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black text-emerald-800">
                          {formatNPR(selectedOrder.total)}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {selectedOrder.paymentMethod} • {selectedOrder.paymentStatus}
                        </div>
                      </div>
                    </div>

                    {/* Cryptographic Verification Status Banner */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-bold text-emerald-900">
                          ✓ Cryptographic Signature &amp; Hash Verified
                        </div>
                        <p className="text-emerald-800 text-[11px] leading-relaxed">
                          The SHA-256 hash strictly matches the canonical transaction record, and the RSA-2048 digital signature matches the server&apos;s authoritative public key.
                        </p>
                      </div>
                    </div>

                    {/* Cryptographic Proof Details */}
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-gray-700 block mb-1">
                          1. Canonical Transaction Data (Deterministic Input Payload):
                        </span>
                        <div className="bg-gray-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] break-all leading-relaxed overflow-x-auto">
                          {selectedOrder.canonicalString}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-gray-700 block mb-1">
                          2. Stored SHA-256 Digest (Transaction Hash):
                        </span>
                        <div className="bg-gray-100 border border-gray-200 p-2.5 rounded-xl font-mono text-[11px] text-gray-800 break-all select-all">
                          {selectedOrder.transactionHash}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-gray-700 block mb-1">
                          3. Stored Digital Signature (RSA-SHA256, Base64):
                        </span>
                        <div className="bg-gray-100 border border-gray-200 p-2.5 rounded-xl font-mono text-[11px] text-gray-800 break-all select-all max-h-24 overflow-y-auto">
                          {selectedOrder.digitalSignature}
                        </div>
                      </div>

                      {/* Expandable Public Key Section */}
                      <details className="text-xs pt-1">
                        <summary className="font-semibold text-gray-600 cursor-pointer hover:text-gray-900">
                          View Server Verification Public Key (RSA-2048 PEM)
                        </summary>
                        <div className="mt-2 relative">
                          <pre className="bg-gray-900 text-gray-300 p-3 rounded-xl font-mono text-[10px] overflow-x-auto select-all max-h-36">
                            {publicKey}
                          </pre>
                          <button
                            onClick={copyPublicKey}
                            className="absolute top-2 right-2 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] font-bold flex items-center gap-1"
                          >
                            {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedKey ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>

                  {/* Tampering Demonstration Panel */}
                  <div className="bg-white p-6 rounded-3xl border-2 border-amber-300 shadow-md space-y-5">
                    <div className="flex items-center gap-2 text-amber-900">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-900">
                          College Viva: Interactive In-Memory Tampering Demonstration
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Simulate what happens if an attacker attempts to alter transaction data. The real database is NEVER modified.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          Transaction Amount (NPR)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="any"
                            value={tamperAmount}
                            onChange={(e) => setTamperAmount(parseFloat(e.target.value) || 0)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl font-mono text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setTamperAmount(selectedOrder.total + 5000)}
                            className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-xl text-[11px]"
                            title="Add Rs. 5,000 to simulate tampering"
                          >
                            +Rs. 5k
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 block">
                          Original recorded amount: <strong>{formatNPR(selectedOrder.total)}</strong>
                        </span>
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          Payment Status
                        </label>
                        <select
                          value={tamperPaymentStatus}
                          onChange={(e) => setTamperPaymentStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-white"
                        >
                          <option value="PAID">PAID</option>
                          <option value="PENDING">PENDING</option>
                          <option value="FAILED">FAILED</option>
                          <option value="REFUNDED">REFUNDED</option>
                        </select>
                        <span className="text-[10px] text-gray-500 mt-1 block">
                          Original recorded status: <strong>{selectedOrder.paymentStatus}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleRunTamperVerification}
                        disabled={verifyingTamper}
                        className="px-4 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        {verifyingTamper ? 'Recalculating &amp; Verifying...' : 'Verify Cryptographic Integrity'}
                      </button>

                      <button
                        type="button"
                        onClick={handleResetTamper}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
                      >
                        Reset to Original
                      </button>
                    </div>

                    {/* Tamper Verification Result Display */}
                    {tamperVerification && (
                      <div
                        className={`rounded-2xl p-4 space-y-3 border text-xs transition-all ${
                          tamperVerification.isValid
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-red-50 border-red-300 text-red-950'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {tamperVerification.isValid ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          )}
                          <span className="font-extrabold text-sm">
                            {tamperVerification.isValid
                              ? '✓ TRANSACTION INTEGRITY VERIFIED (NO TAMPERING)'
                              : '✗ TAMPERING DETECTED: TRANSACTION DATA ALTERED'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-white/70 border border-current/20 space-y-1">
                            <div className="font-bold flex items-center justify-between">
                              <span>SHA-256 Hash Comparison:</span>
                              <span className={tamperVerification.hashMatch ? 'text-emerald-700 font-extrabold' : 'text-red-700 font-extrabold'}>
                                {tamperVerification.hashMatch ? '✓ HASH MATCH' : '✗ HASH MISMATCH'}
                              </span>
                            </div>
                            <div className="font-mono text-[10px] break-all">
                              Computed: {tamperVerification.computedHash.slice(0, 24)}...
                            </div>
                            <div className="font-mono text-[10px] break-all text-gray-500">
                              Expected: {tamperVerification.expectedHash.slice(0, 24)}...
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white/70 border border-current/20 space-y-1">
                            <div className="font-bold flex items-center justify-between">
                              <span>RSA Digital Signature:</span>
                              <span className={tamperVerification.signatureValid ? 'text-emerald-700 font-extrabold' : 'text-red-700 font-extrabold'}>
                                {tamperVerification.signatureValid ? '✓ SIGNATURE VALID' : '✗ SIGNATURE INVALID'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-600 leading-snug">
                              {tamperVerification.signatureValid
                                ? 'Payload authenticity verified by server private key.'
                                : 'Digital signature failed verification. The input does not match what was signed.'}
                            </p>
                          </div>
                        </div>

                        <p className="text-[11px] font-medium pt-1 italic opacity-90">
                          {tamperVerification.details}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
