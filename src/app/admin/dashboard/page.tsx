'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatNPR, formatDate } from '@/lib/utils';
import { ShieldAlert, Users, Store, Stethoscope, ShoppingBag, CheckCircle, XCircle, Plus, Eye, Trash2, Lock } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moderation' | 'orders'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user && session.user.role !== 'ADMIN') {
      if (session.user.role === 'CUSTOMER') router.push('/customer/dashboard');
      if (session.user.role === 'SELLER') router.push('/seller/dashboard');
      if (session.user.role === 'VET') router.push('/vet/dashboard');
      return;
    }

    fetchAdminData();
  }, [session, status]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, ordersRes, catRes, prodRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/orders'),
        fetch('/api/categories'),
        fetch('/api/products'),
      ]);

      const usersData = await usersRes.json();
      const ordersData = await ordersRes.json();
      const catData = await catRes.json();
      const prodData = await prodRes.json();

      setUsers(Array.isArray(usersData) ? usersData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (sellerId?: string, vetId?: string, verified?: boolean) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, vetId, verified: !verified }),
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName }),
      });

      if (res.ok) {
        setNewCatName('');
        setShowCategoryModal(false);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Moderate and remove this listing from platform?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const totalGMV = orders.reduce((sum, o) => sum + o.total, 0);
  const sellerProfiles = users.filter((u) => u.sellerProfile).map((u) => u.sellerProfile);
  const vetProfiles = users.filter((u) => u.vetProfile).map((u) => u.vetProfile);

  if (status === 'loading' || loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">Loading Admin Control Panel...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold">PawMart Platform Control Center</h1>
            <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded uppercase">
              Super Admin
            </span>
          </div>
          <p className="text-purple-200 text-xs mt-1">Platform GMV, Oversight & Moderation across Nepal</p>
        </div>

        <button
          onClick={() => setShowCategoryModal(true)}
          className="px-5 py-3 bg-white text-purple-950 font-bold rounded-xl shadow hover:bg-purple-50 transition flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4 text-purple-700" /> Create Category
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Platform Metrics
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" /> User & Partner Verification ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'moderation'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Store className="w-4 h-4" /> Category & Listing Moderation ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Platform Orders ({orders.length})
        </button>

        <Link
          href="/admin/security"
          className="pb-3 px-4 flex items-center gap-2 transition border-b-2 border-transparent text-emerald-700 hover:text-emerald-900 whitespace-nowrap font-bold bg-emerald-50/70 rounded-t-xl"
        >
          <Lock className="w-4 h-4 text-emerald-600" /> Security &amp; Cryptography Demo
        </Link>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="text-xs text-gray-500 font-semibold uppercase">Platform GMV</div>
              <div className="text-3xl font-extrabold text-purple-900">{formatNPR(totalGMV)}</div>
              <div className="text-[11px] text-emerald-600 font-medium">Gross Merchandise Value</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="text-xs text-gray-500 font-semibold uppercase">Total Users</div>
              <div className="text-3xl font-extrabold text-gray-900">{users.length}</div>
              <div className="text-[11px] text-gray-400">Registered platform accounts</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="text-xs text-gray-500 font-semibold uppercase">Pet Shops</div>
              <div className="text-3xl font-extrabold text-orange-600">{sellerProfiles.length}</div>
              <div className="text-[11px] text-orange-600 font-medium">Verified local stores</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="text-xs text-gray-500 font-semibold uppercase">Partner Vet Clinics</div>
              <div className="text-3xl font-extrabold text-blue-600">{vetProfiles.length}</div>
              <div className="text-[11px] text-blue-600 font-medium">Verified animal hospitals</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User & Partner Verification */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-200">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Details / Shop / Clinic</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{u.name}</div>
                      <div className="text-gray-500">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 bg-gray-100 rounded">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.sellerProfile && (
                        <div>
                          <strong className="text-orange-700">{u.sellerProfile.shopName}</strong>
                          <div className="text-gray-500">{u.sellerProfile.city}</div>
                        </div>
                      )}
                      {u.vetProfile && (
                        <div>
                          <strong className="text-blue-700">{u.vetProfile.clinicName}</strong>
                          <div className="text-gray-500">{u.vetProfile.city}</div>
                        </div>
                      )}
                      {u.role === 'CUSTOMER' && <span className="text-gray-400">Pet Owner</span>}
                    </td>
                    <td className="p-4">
                      {u.sellerProfile ? (
                        u.sellerProfile.verified ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            Pending Review
                          </span>
                        )
                      ) : u.vetProfile ? (
                        u.vetProfile.verified ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            Pending Review
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400">Active</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {u.sellerProfile && (
                        <button
                          onClick={() =>
                            handleToggleVerification(u.sellerProfile.id, undefined, u.sellerProfile.verified)
                          }
                          className={`px-3 py-1 font-bold rounded-lg text-xs transition ${
                            u.sellerProfile.verified
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {u.sellerProfile.verified ? 'Revoke Verification' : 'Approve & Verify'}
                        </button>
                      )}
                      {u.vetProfile && (
                        <button
                          onClick={() =>
                            handleToggleVerification(undefined, u.vetProfile.id, u.vetProfile.verified)
                          }
                          className={`px-3 py-1 font-bold rounded-lg text-xs transition ${
                            u.vetProfile.verified
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {u.vetProfile.verified ? 'Revoke Verification' : 'Approve & Verify'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Moderation */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-gray-900 text-base">Categories ({categories.length})</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c.id} className="bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold px-3 py-1 rounded-lg">
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-200">
                <tr>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Seller Shop</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Moderate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-4 font-bold text-gray-900">{p.name}</td>
                    <td className="p-4 text-emerald-700 font-medium">{p.seller?.shopName}</td>
                    <td className="p-4 font-extrabold">{formatNPR(p.price)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg"
                      >
                        Remove Listing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Platform Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className="font-bold">Order #{o.id.slice(-8).toUpperCase()}</span>
                <span className="text-purple-700 font-extrabold">{formatNPR(o.total)}</span>
              </div>
              <div>Customer: {o.customer?.name} ({o.customer?.phone || 'no phone'})</div>
              <div>Payment Method: {o.paymentMethod} ({o.paymentStatus})</div>
              <div className="flex flex-wrap items-center gap-2">
                <span>Status:</span>
                <select
                  value={o.status}
                  onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-xs font-bold bg-white"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REFUND_INITIATED">REFUND INITIATED</option>
                  <option value="REFUND_COMPLETED">REFUND COMPLETED</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-gray-900">Create Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Reptile Supplies"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
