import Link from 'next/link';
import PlaceholderImage from '@/components/ui/PlaceholderImage';
import { formatNPR } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { Stethoscope, ShieldCheck, Truck, CreditCard, ChevronRight, Star, Heart } from 'lucide-react';

export const revalidate = 0;

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    take: 8,
    where: { status: 'PUBLISHED' },
    include: { category: true, seller: true, reviews: true },
    orderBy: { createdAt: 'desc' },
  });

  const vetRecommended = await prisma.product.findMany({
    take: 4,
    where: { vetRecommended: true, status: 'PUBLISHED' },
    include: { category: true, seller: true },
  });

  const vetClinics = await prisma.vetProfile.findMany({
    take: 3,
    where: { verified: true },
  });

  const categories = await prisma.category.findMany();

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-b-3xl shadow-xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 backdrop-blur text-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Nepal&apos;s #1 Unified Pet Marketplace & Vet Care Platform
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Everything Your Pets Need, <span className="text-orange-400">Delivered Across Nepal</span>
            </h1>
            <p className="text-base sm:text-lg text-emerald-100 max-w-xl font-light">
              Shop authentic pet supplies from local sellers in Kathmandu, Lalitpur, and Pokhara. Book experienced vet clinic visits or request home consultations with one click.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/marketplace"
                className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/30 transition flex items-center justify-center gap-2"
              >
                Shop Pet Supplies <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/vets"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 backdrop-blur transition flex items-center justify-center gap-2"
              >
                <Stethoscope className="w-5 h-5 text-emerald-300" /> Book Vet Appointment
              </Link>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="relative w-full max-w-md bg-emerald-800/40 backdrop-blur border border-white/10 p-6 rounded-2xl shadow-2xl">
              <div className="aspect-[4/3]  overflow-hidden mb-4">
                <PlaceholderImage
                  src="/hero.jpeg"
                  alt="PawMart Nepal Happy Dogs and Cats"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-200">
                <span>📍 Kathmandu, Lalitpur, Pokhara</span>
                <span className="font-bold text-orange-300">eSewa & Khalti Accepted</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Fast Nepal Delivery</h4>
              <p className="text-xs text-gray-500 mt-0.5">Same-day inside Kathmandu Valley, 2-3 days nationwide.</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-orange-100 text-orange-700 rounded-xl">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Verified Vet Doctors</h4>
              <p className="text-xs text-gray-500 mt-0.5">Book clinic visits or home consultations seamlessly.</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">100% Genuine Supplies</h4>
              <p className="text-xs text-gray-500 mt-0.5">Directly from verified local pet shop sellers.</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">eSewa / Khalti / COD</h4>
              <p className="text-xs text-gray-500 mt-0.5">Instant Digital Payment or Cash on Delivery.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Explore Pet Categories</h2>
            <p className="text-sm text-gray-500">Find food, treats, toys, and care essentials by pet type</p>
          </div>
          <Link href="/marketplace" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/marketplace?category=${cat.slug}`}
              className="bg-white p-4 rounded-xl border border-gray-200 hover:border-emerald-500 hover:shadow-md transition text-center group"
            >
              <div className="w-12 h-12 mx-auto bg-emerald-50 rounded-full flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition">
                {cat.slug.includes('dog') ? '🐶' : cat.slug.includes('cat') ? '🐱' : cat.slug.includes('bird') ? '🦜' : cat.slug.includes('fish') ? '🐠' : '🦴'}
              </div>
              <h3 className="font-semibold text-gray-800 text-sm group-hover:text-emerald-600 transition">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Vet Recommended Products Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-50 to-teal-50 p-8 rounded-3xl border border-emerald-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <span className="inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full mb-2">
              🩺 Doctor Approved
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900">Vet-Recommended Products</h2>
            <p className="text-sm text-gray-600">Prescription diets, anti-tick formulas, and grooming products verified by Nepali vets.</p>
          </div>
          <Link
            href="/marketplace?vetRecommended=true"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition"
          >
            Browse Vet Collection
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vetRecommended.map((product) => {
            const images = JSON.parse(product.images || '[]');
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                    <PlaceholderImage src={images[0]} alt={product.name} />
                    <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Vet Approved
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-400 mb-1">{product.category.name}</div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 hover:text-emerald-600 transition mb-2">
                    <Link href={`/marketplace/${product.id}`}>{product.name}</Link>
                  </h3>
                </div>
                <div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="font-extrabold text-emerald-700 text-base">{formatNPR(product.price)}</span>
                    <Link
                      href={`/marketplace/${product.id}`}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition"
                    >
                      View Detail
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Vet Clinics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Partner Veterinary Clinics</h2>
            <p className="text-sm text-gray-500">Trusted animal hospitals in Kathmandu, Lalitpur, and Pokhara</p>
          </div>
          <Link href="/vets" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Find All Clinics <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vetClinics.map((clinic) => {
            const services = JSON.parse(clinic.servicesOffered || '[]');
            return (
              <div key={clinic.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      📍 {clinic.city}
                    </span>
                    <h3 className="font-extrabold text-gray-900 text-lg mt-2">{clinic.clinicName}</h3>
                    <p className="text-xs text-gray-500 mt-1">{clinic.address}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {clinic.rating.toFixed(1)}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500">Services Offered:</span>
                  <div className="flex flex-wrap gap-1">
                    {services.slice(0, 3).map((s: string, idx: number) => (
                      <span key={idx} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">⏰ {clinic.openingHours.split('|')[0]}</span>
                  <Link
                    href={`/vets?clinic=${clinic.id}`}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                  >
                    Book Visit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Marketplace Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Featured Pet Products</h2>
            <p className="text-sm text-gray-500">Trending dry food, toys, collars & grooming kits</p>
          </div>
          <Link href="/marketplace" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            See Marketplace <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => {
            const images = JSON.parse(product.images || '[]');
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-lg transition flex flex-col justify-between group">
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-100">
                    <PlaceholderImage src={images[0]} alt={product.name} />
                    {product.vetRecommended && (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Vet Recommended
                      </span>
                    )}
                    {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                      <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Only {product.stock} left!
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                    <span>{product.category.name}</span>
                    <span className="text-emerald-700 font-medium">{product.seller.shopName}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-emerald-600 transition mb-2">
                    <Link href={`/marketplace/${product.id}`}>{product.name}</Link>
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-extrabold text-gray-900 text-lg">{formatNPR(product.price)}</span>
                  <Link
                    href={`/marketplace/${product.id}`}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
