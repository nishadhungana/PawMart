import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-4">🐾 404</div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-600 max-w-md mb-6">
        Sorry, the pet care page or resource you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition"
        >
          Return Home
        </Link>
        <Link
          href="/marketplace"
          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
        >
          Browse Marketplace
        </Link>
      </div>
    </div>
  );
}
