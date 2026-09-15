'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Store, Stethoscope, Mail, Lock, Phone, MapPin } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'CUSTOMER' | 'SELLER' | 'VET'>('CUSTOMER');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    shopName: '',
    clinicName: '',
    city: 'Kathmandu',
    address: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to register');
        setLoading(false);
      } else {
        router.push(`/login?role=${role.toLowerCase()}`);
      }
    } catch (err) {
      setError('An error occurred during registration');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div>
          <div className="flex justify-center text-4xl mb-2">🐾</div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create your PawMart Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Nepal&apos;s leading pet care community
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 rounded-xl text-sm font-semibold">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              role === 'CUSTOMER' ? 'bg-white text-emerald-700 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4" /> Pet Owner
          </button>
          <button
            type="button"
            onClick={() => setRole('SELLER')}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              role === 'SELLER' ? 'bg-white text-orange-700 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Store className="w-4 h-4" /> Pet Shop
          </button>
          <button
            type="button"
            onClick={() => setRole('VET')}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              role === 'VET' ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" /> Vet Clinic
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 font-medium">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g. Aarav Sharma"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="aarav@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="At least 6 chars"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (+977)</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="+977-9841234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="Kathmandu">Kathmandu</option>
                <option value="Lalitpur">Lalitpur</option>
                <option value="Bhaktapur">Bhaktapur</option>
                <option value="Pokhara">Pokhara</option>
              </select>
            </div>
          </div>

          {/* Conditional Role Inputs */}
          {role === 'SELLER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pet Shop Name</label>
              <input
                type="text"
                required
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g. Kathmandu Pet Bazaar"
              />
            </div>
          )}

          {role === 'VET' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinic / Hospital Name</label>
              <input
                type="text"
                required
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g. Bagmati Animal Hospital"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g. Baneshwor Height, Ward 10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition mt-4"
          >
            {loading ? 'Creating Account...' : `Register as ${role.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}`}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
