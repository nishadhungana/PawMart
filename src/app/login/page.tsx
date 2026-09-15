'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Store, Stethoscope, User, ShieldAlert } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If user is already authenticated, redirect to appropriate dashboard unless switching role
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = session.user.role;
      const roleParam = searchParams.get('role');

      // If user is intentionally switching to a different demo role, don't auto-redirect
      if (roleParam && roleParam.toUpperCase() !== role) {
        return;
      }

      const callback = searchParams.get('callbackUrl');
      if (callback && !callback.startsWith('/login')) {
        window.location.href = decodeURIComponent(callback);
      } else if (role === 'SELLER') {
        window.location.href = '/seller/dashboard';
      } else if (role === 'VET') {
        window.location.href = '/vet/dashboard';
      } else if (role === 'ADMIN') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/customer/dashboard';
      }
    }
  }, [session, status, searchParams]);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'customer') {
      setEmail('customer@pawmart.test');
      setPassword('password123');
    } else if (roleParam === 'seller') {
      setEmail('seller@pawmart.test');
      setPassword('password123');
    } else if (roleParam === 'vet') {
      setEmail('vet@pawmart.test');
      setPassword('password123');
    } else if (roleParam === 'admin') {
      setEmail('admin@pawmart.test');
      setPassword('password123');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanEmail = email.toLowerCase().trim();
      let targetUrl = '/customer/dashboard';
      if (cleanEmail.includes('seller')) {
        targetUrl = '/seller/dashboard';
      } else if (cleanEmail.includes('vet')) {
        targetUrl = '/vet/dashboard';
      } else if (cleanEmail.includes('admin')) {
        targetUrl = '/admin/dashboard';
      }

      const callback = searchParams.get('callbackUrl');
      if (callback && !callback.startsWith('/login')) {
        targetUrl = decodeURIComponent(callback);
      }

      const res = await signIn('credentials', {
        email: cleanEmail,
        password,
        redirect: false,
        callbackUrl: targetUrl,
      });

      if (res?.error) {
        setError(res.error === 'CredentialsSignin' ? 'Invalid email or password.' : res.error);
        setLoading(false);
      } else if (res?.url) {
        window.location.href = res.url;
      } else {
        window.location.href = targetUrl;
      }
    } catch (err) {
      setError('An error occurred during sign in');
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  const roleParam = searchParams.get('role');
  const isSwitchingRole = Boolean(roleParam && session?.user && roleParam.toUpperCase() !== session.user.role);

  if (status === 'authenticated' && session?.user && !isSwitchingRole) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-bold text-gray-900">Signed in as {session.user.name}</h2>
          <p className="text-xs text-gray-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div>
          <div className="flex justify-center text-4xl mb-2">🐾</div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Welcome to PawMart Nepal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your role-based dashboard
          </p>
        </div>

        {/* Demo Account Fill Helpers */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 text-center">
            ⚡ Quick Demo Logins (1-Click Fill)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoFill('customer@pawmart.test')}
              className="flex items-center justify-center gap-1 bg-white hover:bg-emerald-100 text-emerald-900 p-2 rounded border border-emerald-300 font-medium transition"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" /> Customer
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('seller@pawmart.test')}
              className="flex items-center justify-center gap-1 bg-white hover:bg-orange-100 text-orange-900 p-2 rounded border border-orange-300 font-medium transition"
            >
              <Store className="w-3.5 h-3.5 text-orange-600" /> Seller
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('vet@pawmart.test')}
              className="flex items-center justify-center gap-1 bg-white hover:bg-blue-100 text-blue-900 p-2 rounded border border-blue-300 font-medium transition"
            >
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Vet Clinic
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('admin@pawmart.test')}
              className="flex items-center justify-center gap-1 bg-white hover:bg-purple-100 text-purple-900 p-2 rounded border border-purple-300 font-medium transition"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                placeholder="e.g. customer@pawmart.test"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
