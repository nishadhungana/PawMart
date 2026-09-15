import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8 border-t border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-extrabold text-2xl tracking-tight">
              <span className="bg-emerald-600 text-white p-1 rounded-lg">🐾</span>
              <span>Paw<span className="text-orange-400">Mart</span> Nepal</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nepal&apos;s first unified multi-vendor pet supply marketplace and online veterinary care scheduling platform.
            </p>
            <div className="text-xs text-gray-400">
              📍 Serving Kathmandu Valley, Pokhara & major hubs across Nepal.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Marketplace</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/marketplace?category=dog-food" className="hover:text-emerald-400 transition">Dog Food & Snacks</Link></li>
              <li><Link href="/marketplace?category=cat-food" className="hover:text-emerald-400 transition">Cat Treats & Litter</Link></li>
              <li><Link href="/marketplace?vetRecommended=true" className="hover:text-emerald-400 transition font-medium text-emerald-400">Vet-Recommended Products</Link></li>
              <li><Link href="/marketplace?category=toys" className="hover:text-emerald-400 transition">Pet Toys & Accessories</Link></li>
              <li><Link href="/marketplace?category=health-products" className="hover:text-emerald-400 transition">Shampoos & Tick Care</Link></li>
            </ul>
          </div>

          {/* Vet Services */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Vet Care Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/vets" className="hover:text-emerald-400 transition">Find Nearby Vet Clinics</Link></li>
              <li><Link href="/vets?type=HOME_VISIT" className="hover:text-emerald-400 transition">Request Vet Home Visit</Link></li>
              <li><Link href="/login?role=vet" className="hover:text-emerald-400 transition">Register as a Vet Clinic</Link></li>
              <li><Link href="/login?role=seller" className="hover:text-emerald-400 transition">Register as a Pet Shop</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Support & Helpline</h4>
            <div className="space-y-3 text-sm text-gray-400">
              <p>📞 Helpline: <span className="text-white font-medium">+977-9801234567</span></p>
              <p>✉️ Support: <span className="text-white font-medium">support@pawmart.com.np</span></p>
              <p>⏰ Hours: 8:00 AM - 8:00 PM (Sun-Fri)</p>
              <div className="pt-2 flex gap-2">
                <span className="bg-gray-800 text-xs px-2.5 py-1 rounded text-emerald-400 font-medium">eSewa Accepted</span>
                <span className="bg-gray-800 text-xs px-2.5 py-1 rounded text-purple-400 font-medium">Khalti Accepted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} PawMart Nepal Ltd. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Kathmandu</span>
            <span>Lalitpur</span>
            <span>Bhaktapur</span>
            <span>Pokhara</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
