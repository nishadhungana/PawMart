'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/components/providers/CartProvider';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { ShoppingBag, Heart, User, LogOut, Shield, Stethoscope, Store, Menu, X, Bell, Check, Package } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const { cartCount, wishlist } = useCart();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const role = session?.user?.role;

  const getDashboardLink = () => {
    switch (role) {
      case 'SELLER':
        return '/seller/dashboard';
      case 'VET':
        return '/vet/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      case 'CUSTOMER':
      default:
        return '/customer/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Top Bar with Demo Role Switcher Bar */}
      <div className="bg-emerald-800 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-200">PawMart Nepal</span>
            <span className="hidden md:inline">| Nepal&apos;s Multi-Vendor Pet Marketplace & Vet Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-200 hidden sm:inline">Demo Logins:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <Link
                href="/login?role=customer"
                className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 transition"
              >
                Customer
              </Link>
              <Link
                href="/login?role=seller"
                className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 transition"
              >
                Seller (Pet Shop)
              </Link>
              <Link
                href="/login?role=vet"
                className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 transition"
              >
                Vet Clinic
              </Link>
              <Link
                href="/login?role=admin"
                className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 transition"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-emerald-700 font-extrabold text-2xl tracking-tight">
              <span className="bg-emerald-600 text-white p-1.5 rounded-lg">🐾</span>
              <span>Paw<span className="text-orange-500">Mart</span> <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">Nepal</span></span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
              <Link href="/marketplace" className="hover:text-emerald-600 transition">
                Pet Marketplace
              </Link>
              <Link href="/vets" className="hover:text-emerald-600 transition flex items-center gap-1">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                Find Vets & Clinics
              </Link>
              {role === 'SELLER' && (
                <Link href="/seller/dashboard" className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
                  <Store className="w-4 h-4" />
                  Seller Dashboard
                </Link>
              )}
              {role === 'VET' && (
                <Link href="/vet/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                  <Stethoscope className="w-4 h-4" />
                  Clinic Dashboard
                </Link>
              )}
              {role === 'ADMIN' && (
                <Link href="/admin/dashboard" className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>

          {/* Action Icons & User Account */}
          <div className="hidden md:flex items-center gap-5">
            {/* Notification Bell — only for logged-in users */}
            {session && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative p-2 text-gray-600 hover:text-emerald-600 transition"
                  title="Notifications"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <span className="font-bold text-sm text-gray-900">
                        Notifications {unreadCount > 0 && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unreadCount} new</span>}
                      </span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={async () => { await markAllRead(); }}
                            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 text-xs">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${!n.read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {n.type === 'ORDER_PLACED'    && <Package className="w-5 h-5 text-emerald-600" />}
                              {n.type === 'ORDER_CONFIRMED' && <Package className="w-5 h-5 text-purple-600" />}
                              {n.type === 'ORDER_SHIPPED'   && <Package className="w-5 h-5 text-blue-600" />}
                              {n.type === 'ORDER_DELIVERED' && <Check className="w-5 h-5 text-emerald-700" />}
                              {n.type === 'ORDER_CANCELLED' && <X className="w-5 h-5 text-red-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-xs font-bold text-gray-900 leading-tight ${!n.read ? 'text-blue-900' : ''}`}>
                                  {n.title}
                                </p>
                                {!n.read && <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />}
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(n.createdAt).toLocaleString('en-NP', { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="border-t border-gray-100 px-4 py-2.5 text-center">
                        <Link
                          href="/customer/dashboard?tab=orders"
                          onClick={() => setShowNotifications(false)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                        >
                          View all orders →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist */}
            <Link href="/wishlist" className="relative p-2 text-gray-600 hover:text-emerald-600 transition">
              <Heart className="w-6 h-6" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-emerald-600 transition">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-emerald-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Dropdown / Auth status */}
            {session ? (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <Link
                  href={getDashboardLink()}
                  className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 transition"
                >
                  <User className="w-4 h-4" />
                  <span>{session.user?.name || 'Dashboard'}</span>
                  <span className="text-[10px] uppercase tracking-wide bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                    {role}
                  </span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-emerald-600 px-3 py-1.5"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center gap-3">
            <Link href="/cart" className="relative p-1 text-gray-700">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-emerald-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-3">
          <Link
            href="/marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-800 hover:text-emerald-600"
          >
            Pet Marketplace
          </Link>
          <Link
            href="/vets"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-800 hover:text-emerald-600"
          >
            Find Vets & Clinics
          </Link>
          <Link
            href="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-800 hover:text-emerald-600"
          >
            Wishlist ({wishlist.length})
          </Link>

          {session ? (
            <div className="pt-2 border-t border-gray-200 space-y-2">
              <Link
                href={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 font-semibold text-emerald-700"
              >
                Go to {role} Dashboard ({session.user.name})
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="w-full text-left py-2 text-red-600 font-medium"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 border border-gray-300 rounded-lg font-semibold text-gray-700"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 bg-emerald-600 text-white rounded-lg font-semibold"
              >
                Register Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
