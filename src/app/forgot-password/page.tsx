'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, KeyRound, ExternalLink } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ message: string; resetUrl?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send reset link. Please try again.');
      } else {
        setSuccessData({
          message: data.message || 'If an account exists with this email, a password reset link has been sent.',
          resetUrl: data.resetUrl,
        });
      }
    } catch (err: any) {
      setError('An error occurred while sending the reset request. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 shadow-inner mb-1">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Forgot Password?
          </h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Enter your registered email address and we&apos;ll send you a secure link to reset your password.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {successData ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                Reset Link Sent!
              </div>
              <p className="text-emerald-700 leading-relaxed">
                {successData.message}
              </p>
              <p className="text-[11px] text-emerald-600">
                The link is valid for <strong>1 hour</strong>. Please check your spam folder if you don&apos;t see it in your inbox.
              </p>
            </div>

            {/* Direct Link Preview for Instant Testing */}
            {successData.resetUrl && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  ⚡ Quick Test Link (Development):
                </span>
                <Link
                  href={successData.resetUrl}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold break-all flex items-center gap-1.5 underline"
                >
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" /> Open Password Reset Page Directly
                </Link>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessData(null);
                  setEmail('');
                }}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Send to Another Email
              </button>
              <Link
                href="/login"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs text-center transition shadow"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs bg-white"
                  placeholder="e.g. customer@pawmart.test"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Sending Link...
                </>
              ) : (
                'Send Password Reset Link'
              )}
            </button>

            <div className="pt-3 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-gray-500 hover:text-emerald-700 font-bold transition text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
