'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatNPR, formatDate } from '@/lib/utils';
import { ShoppingBag, Calendar, Heart, User, MapPin, Printer, Star, Plus, CheckCircle, Clock } from 'lucide-react';

function CustomerDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTabParam = searchParams.get('tab') || 'orders';
  const orderSuccessParam = searchParams.get('orderSuccess');

  const [activeTab, setActiveTab] = useState(activeTabParam);
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Printable Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Add Pet Modal State
  const [showPetModal, setShowPetModal] = useState(false);
  const [newPet, setNewPet] = useState({ name: '', species: 'Dog', breed: '', age: '', notes: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user && session.user.role !== 'CUSTOMER') {
      // Redirect to correct dashboard according to role
      if (session.user.role === 'SELLER') router.push('/seller/dashboard');
      if (session.user.role === 'VET') router.push('/vet/dashboard');
      if (session.user.role === 'ADMIN') router.push('/admin/dashboard');
      return;
    }

    fetchCustomerData();
  }, [session, status]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const [ordersRes, apptsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/appointments'),
      ]);
      const ordersData = await ordersRes.json();
      const apptsData = await apptsRes.json();

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setAppointments(Array.isArray(apptsData) ? apptsData : []);

      // Mock customer pets array
      setPets([
        { id: 'pet-1', name: 'Max', species: 'Dog', breed: 'Golden Retriever', age: '3 years', notes: 'Allergic to chicken proteins' },
        { id: 'pet-2', name: 'Luna', species: 'Cat', breed: 'Persian', age: '1.5 years', notes: 'Daily grooming required' },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPet = (e: React.FormEvent) => {
    e.preventDefault();
    setPets([...pets, { ...newPet, id: `pet-${Date.now()}` }]);
    setNewPet({ name: '', species: 'Dog', breed: '', age: '', notes: '' });
    setShowPetModal(false);
  };

  if (status === 'loading' || loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">Loading Customer Dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white text-emerald-800 rounded-full flex items-center justify-center text-2xl font-extrabold shadow">
            🐶
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold">{session?.user?.name || 'Customer Profile'}</h1>
              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Pet Owner
              </span>
            </div>
            <p className="text-emerald-100 text-xs mt-0.5">{session?.user?.email} • Kathmandu, Nepal</p>
          </div>
        </div>

        {orderSuccessParam && (
          <div className="bg-emerald-500/30 backdrop-blur border border-emerald-300 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-200" />
            <span>Order placed successfully! Thank you for your purchase.</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> My Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" /> My Appointments ({appointments.length})
        </button>

        <button
          onClick={() => setActiveTab('pets')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'pets'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Heart className="w-4 h-4" /> My Pets ({pets.length})
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-4 max-w-md mx-auto">
              <div className="text-5xl">📦</div>
              <h3 className="text-lg font-bold text-gray-900">No orders placed yet</h3>
              <p className="text-xs text-gray-500">You haven&apos;t ordered any pet supplies yet.</p>
              <Link
                href="/marketplace"
                className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
              >
                Browse Pet Marketplace
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-gray-500">ORDER #{order.id.slice(-8).toUpperCase()}</span>
                      <div className="text-xs text-gray-400">Placed on {formatDate(order.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'CONFIRMED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      <button
                        onClick={() => setSelectedReceipt(order)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> Receipt
                      </button>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">{item.qty}x</span>
                          <div>
                            <div className="font-bold text-gray-800">{item.product?.name}</div>
                            <div className="text-[10px] text-emerald-700">{item.seller?.shopName}</div>
                          </div>
                        </div>
                        <div className="font-extrabold text-gray-900">{formatNPR(item.priceAtPurchase * item.qty)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                    <div className="text-gray-500">
                      Payment Method: <strong className="text-gray-900">{order.paymentMethod}</strong> ({order.paymentStatus})
                    </div>
                    <div className="text-base font-extrabold text-emerald-800">
                      Total: {formatNPR(order.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Appointments */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {appointments.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-4 max-w-md mx-auto">
              <div className="text-5xl">🩺</div>
              <h3 className="text-lg font-bold text-gray-900">No appointments scheduled</h3>
              <p className="text-xs text-gray-500">Find experienced vet doctors and book a clinic visit or home consultation.</p>
              <Link
                href="/vets"
                className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
              >
                Find Vet Clinics
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appointments.map((appt) => (
                <div key={appt.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                        {appt.type.replace('_', ' ')}
                      </span>
                      <h3 className="font-extrabold text-gray-900 text-base mt-1.5">{appt.vet?.clinicName}</h3>
                      <p className="text-xs text-gray-500">{appt.vet?.address}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                        appt.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : appt.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : appt.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <div>🐾 <strong>Pet:</strong> {appt.petName} ({appt.petType})</div>
                    <div>📅 <strong>Date & Time:</strong> {appt.requestedDate} at {appt.requestedTime}</div>
                    {appt.feeEstimate && <div>💰 <strong>Fee Estimate:</strong> {formatNPR(appt.feeEstimate)}</div>}
                    {appt.notes && <div className="text-gray-500 italic mt-1">&quot;{appt.notes}&quot;</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Pets */}
      {activeTab === 'pets' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">My Registered Pets</h2>
            <button
              onClick={() => setShowPetModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Add New Pet
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div key={pet.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-2xl">
                    {pet.species === 'Dog' ? '🐶' : '🐱'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-lg">{pet.name}</h3>
                    <p className="text-xs text-gray-500">{pet.breed} • {pet.age}</p>
                  </div>
                </div>

                {pet.notes && (
                  <div className="text-xs bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900">
                    <strong>Medical / Diet Notes:</strong> {pet.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl border border-gray-100">
            <div className="border-b border-gray-200 pb-4 text-center">
              <div className="text-2xl font-extrabold text-emerald-800">🐾 PawMart Nepal</div>
              <div className="text-xs text-gray-500">Official Purchase Invoice / Receipt</div>
              <div className="text-[10px] font-mono mt-1 text-gray-400">Order ID: {selectedReceipt.id}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Customer Name:</span>
                <span className="font-bold text-gray-900">{session?.user?.name}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping Address:</span>
                <span className="font-bold text-gray-900 text-right">{selectedReceipt.shippingAddress}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Method:</span>
                <span className="font-bold text-gray-900">{selectedReceipt.paymentMethod}</span>
              </div>

              <div className="border-t border-b border-gray-200 py-3 space-y-2">
                <div className="font-bold text-gray-700">Order Items:</div>
                {selectedReceipt.items?.map((i: any) => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.qty}x {i.product?.name}</span>
                    <span className="font-mono">{formatNPR(i.priceAtPurchase * i.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-700">{formatNPR(selectedReceipt.total)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Pet Modal */}
      {showPetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-gray-900">Add New Pet</h3>
            <form onSubmit={handleAddPet} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Pet Name</label>
                <input
                  type="text"
                  required
                  value={newPet.name}
                  onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                  placeholder="e.g. Rocky"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Species</label>
                  <select
                    value={newPet.species}
                    onChange={(e) => setNewPet({ ...newPet, species: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Fish">Fish</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Breed</label>
                  <input
                    type="text"
                    required
                    value={newPet.breed}
                    onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                    placeholder="e.g. German Shepherd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Age</label>
                <input
                  type="text"
                  required
                  value={newPet.age}
                  onChange={(e) => setNewPet({ ...newPet, age: e.target.value })}
                  placeholder="e.g. 2 years"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Medical / Allergies Notes</label>
                <textarea
                  rows={2}
                  value={newPet.notes}
                  onChange={(e) => setNewPet({ ...newPet, notes: e.target.value })}
                  placeholder="Allergies, preferred diet, vaccination notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                ></textarea>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPetModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg"
                >
                  Save Pet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Dashboard...</div>}>
      <CustomerDashboardContent />
    </Suspense>
  );
}
