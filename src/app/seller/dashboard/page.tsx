'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatNPR, formatDate } from '@/lib/utils';
import { Store, Package, AlertTriangle, DollarSign, Plus, Edit, Trash2, Printer, Check, RefreshCw } from 'lucide-react';

export default function SellerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'inventory' | 'orders'>('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: '',
    brand: '',
    description: '',
    price: 1000,
    stock: 20,
    lowStockThreshold: 5,
    images: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80',
    vetRecommended: false,
  });

  // Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user && session.user.role !== 'SELLER') {
      if (session.user.role === 'CUSTOMER') router.push('/customer/dashboard');
      if (session.user.role === 'VET') router.push('/vet/dashboard');
      if (session.user.role === 'ADMIN') router.push('/admin/dashboard');
      return;
    }

    fetchSellerData();
  }, [session, status]);

  const fetchSellerData = async () => {
    setLoading(true);
    try {
      const [prodRes, ordersRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/categories'),
      ]);

      const prodData = await prodRes.json();
      const ordersData = await ordersRes.json();
      const catData = await catRes.json();

      setProducts(Array.isArray(prodData) ? prodData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setCategories(Array.isArray(catData) ? catData : []);

      if (catData.length > 0 && !productForm.categoryId) {
        setProductForm((prev) => ({ ...prev, categoryId: catData[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        lowStockThreshold: Number(productForm.lowStockThreshold),
        images: [productForm.images],
      };

      let res;
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setShowProductModal(false);
        setEditingProduct(null);
        fetchSellerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchSellerData();
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
      fetchSellerData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBatchStockIncrease = async () => {
    // Quick action: Increase all low stock items by +10
    const lowStockItems = products.filter((p) => p.stock <= p.lowStockThreshold);
    for (const p of lowStockItems) {
      await fetch(`/api/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: p.stock + 10 }),
      });
    }
    fetchSellerData();
  };

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold).length;

  if (status === 'loading' || loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">Loading Seller Portal...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Seller Header */}
      <div className="bg-gradient-to-r from-orange-800 via-amber-800 to-emerald-900 text-white p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold">{session?.user?.name || 'Pet Shop Seller'}</h1>
            <span className="text-[10px] bg-orange-500 text-white font-bold px-2 py-0.5 rounded uppercase">
              Verified Shop
            </span>
          </div>
          <p className="text-orange-100 text-xs mt-1">Kathmandu Pet Bazaar • Managing Inventory & Orders</p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setShowProductModal(true);
          }}
          className="px-5 py-3 bg-white text-orange-900 font-bold rounded-xl shadow hover:bg-orange-50 transition flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4 text-orange-600" /> Add New Product Listing
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-orange-600 text-orange-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Overview & Sales
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-orange-600 text-orange-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" /> Product Catalog ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-orange-600 text-orange-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Inventory & Low Stock ({lowStockCount})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-orange-600 text-orange-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Store className="w-4 h-4" /> Incoming Orders ({orders.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="text-xs text-gray-500 font-semibold uppercase">Total GMV Revenue</div>
              <div className="text-3xl font-extrabold text-gray-900">{formatNPR(totalSales)}</div>
              <div className="text-[11px] text-emerald-600 font-medium">From {orders.length} orders</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="text-xs text-gray-500 font-semibold uppercase">Active Shop Products</div>
              <div className="text-3xl font-extrabold text-gray-900">{products.length}</div>
              <div className="text-[11px] text-gray-400">Listings published</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="text-xs text-gray-500 font-semibold uppercase">Low Stock Warnings</div>
              <div className="text-3xl font-extrabold text-orange-600">{lowStockCount}</div>
              <div className="text-[11px] text-orange-600 font-medium">Items near threshold</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Products Catalog */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {products.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
              <div className="text-4xl">📦</div>
              <h3 className="text-base font-bold text-gray-900">No products listed</h3>
              <p className="text-xs text-gray-500">Create your first product listing to start selling in Nepal.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Vet Rec.</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-900">{p.name}</td>
                      <td className="p-4 text-emerald-700 font-medium">{p.category?.name}</td>
                      <td className="p-4 font-extrabold text-gray-900">{formatNPR(p.price)}</td>
                      <td className="p-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            p.stock <= p.lowStockThreshold
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock} units
                        </span>
                      </td>
                      <td className="p-4">{p.vetRecommended ? '✅ Yes' : '❌ No'}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            const imgs = JSON.parse(p.images || '[]');
                            setProductForm({
                              name: p.name,
                              categoryId: p.categoryId,
                              brand: p.brand || '',
                              description: p.description,
                              price: p.price,
                              stock: p.stock,
                              lowStockThreshold: p.lowStockThreshold,
                              images: imgs[0] || '',
                              vetRecommended: p.vetRecommended,
                            });
                            setShowProductModal(true);
                          }}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Inventory & Low Stock */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-orange-50 p-4 rounded-2xl border border-orange-200">
            <div>
              <h3 className="font-bold text-orange-900 text-sm">Low-Stock Alert Center</h3>
              <p className="text-xs text-orange-700">Items below minimum stock threshold are listed here.</p>
            </div>
            {lowStockCount > 0 && (
              <button
                onClick={handleBatchStockIncrease}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <RefreshCw className="w-4 h-4" /> Restock All (+10 units)
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-200">
                <tr>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Low Stock Threshold</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const isLow = p.stock <= p.lowStockThreshold;
                  return (
                    <tr key={p.id} className={isLow ? 'bg-orange-50/50' : ''}>
                      <td className="p-4 font-bold text-gray-900">{p.name}</td>
                      <td className="p-4 font-extrabold text-base">{p.stock}</td>
                      <td className="p-4 text-gray-500">{p.lowStockThreshold}</td>
                      <td className="p-4">
                        {isLow ? (
                          <span className="text-[11px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                            ⚠️ Low Stock Alert
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Orders Management */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
              <div className="text-4xl">🧾</div>
              <h3 className="text-base font-bold text-gray-900">No incoming orders yet</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-gray-900">Order #{o.id.slice(-8).toUpperCase()}</span>
                      <div className="text-xs text-gray-500">Customer: {o.customer?.name} ({o.customer?.phone})</div>
                    </div>

                    <div className="flex items-center gap-2">
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
                      </select>

                      <button
                        onClick={() => setSelectedInvoice(o)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Invoice
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {o.items?.map((i: any) => (
                      <div key={i.id} className="flex justify-between">
                        <span>{i.qty}x {i.product?.name}</span>
                        <span className="font-bold">{formatNPR(i.priceAtPurchase * i.qty)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-500">Shipping: {o.shippingAddress}</span>
                    <span className="text-orange-700 text-base">{formatNPR(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-gray-900">
              {editingProduct ? 'Edit Product Listing' : 'Add New Product Listing'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Royal Canin Adult Dog Food 3kg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="e.g. Royal Canin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Price (NPR)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Low Stock Limit</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.lowStockThreshold}
                    onChange={(e) =>
                      setProductForm({ ...productForm, lowStockThreshold: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <input
                  type="checkbox"
                  id="vetRec"
                  checked={productForm.vetRecommended}
                  onChange={(e) => setProductForm({ ...productForm, vetRecommended: e.target.checked })}
                />
                <label htmlFor="vetRec" className="font-semibold text-emerald-900 cursor-pointer">
                  Tag as Vet-Recommended Formula
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="text-center border-b border-gray-200 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Kathmandu Pet Bazaar</h3>
              <p className="text-xs text-gray-500">Sales Invoice #{selectedInvoice.id.slice(-6)}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div>Customer: <strong>{selectedInvoice.customer?.name}</strong></div>
              <div>Address: {selectedInvoice.shippingAddress}</div>
              <div className="border-t border-b border-gray-200 py-2 space-y-1">
                {selectedInvoice.items?.map((i: any) => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.qty}x {i.product?.name}</span>
                    <span>{formatNPR(i.priceAtPurchase * i.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-extrabold text-sm pt-1">
                <span>Total:</span>
                <span>{formatNPR(selectedInvoice.total)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-orange-600 text-white font-bold rounded-lg text-xs"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
