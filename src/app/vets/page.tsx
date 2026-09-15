'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Stethoscope, MapPin, Clock, Phone, Star, Calendar, Home, CheckCircle2 } from 'lucide-react';
import { formatNPR } from '@/lib/utils';

function VetDirectoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [vets, setVets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [search, setSearch] = useState('');

  // Booking Modal State
  const [selectedVet, setSelectedVet] = useState<any>(null);
  const [bookingType, setBookingType] = useState<'CLINIC_VISIT' | 'HOME_VISIT'>('CLINIC_VISIT');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Dog');
  const [requestedDate, setRequestedDate] = useState('2026-08-22');
  const [requestedTime, setRequestedTime] = useState('10:00 AM');
  const [address, setAddress] = useState('Baneshwor Height, Ward 10, Kathmandu');
  const [notes, setNotes] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    fetchVets();
  }, [city]);

  const fetchVets = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/vets', window.location.origin);
      if (city) url.searchParams.set('city', city);
      if (search) url.searchParams.set('search', search);

      const res = await fetch(url.toString());
      const data = await res.json();
      setVets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVets();
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push('/login?callbackUrl=/vets');
      return;
    }
    setBookingError('');
    setBookingLoading(true);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vetId: selectedVet.id,
          petName,
          petType,
          type: bookingType,
          requestedDate,
          requestedTime,
          address: bookingType === 'HOME_VISIT' ? address : undefined,
          notes,
          isUrgent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBookingError(data.error || 'Failed to book appointment');
        setBookingLoading(false);
      } else {
        setBookingSuccess(true);
        setBookingLoading(false);
        setTimeout(() => {
          setSelectedVet(null);
          setBookingSuccess(false);
          router.push('/customer/dashboard?tab=appointments');
        }, 2000);
      }
    } catch (err) {
      setBookingError('An error occurred during booking');
      setBookingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-emerald-900 text-white p-8 rounded-3xl shadow-lg">
        <div className="max-w-2xl space-y-3">
          <span className="bg-blue-600/60 backdrop-blur text-blue-200 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30">
            🩺 Veterinary Care Platform
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">Find & Book Top Vets in Nepal</h1>
          <p className="text-blue-100 text-sm">
            Book clinic appointments or request home visits with verified animal hospitals and specialists across Kathmandu, Lalitpur, and Pokhara.
          </p>
        </div>

        {/* Search & City Filter */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-3xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clinic name, emergency services, surgery..."
            className="flex-1 px-4 py-2.5 rounded-xl text-gray-900 bg-white placeholder-gray-400 text-sm"
          />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-gray-900 bg-white font-semibold text-sm"
          >
            <option value="">All Cities (Nepal)</option>
            <option value="Kathmandu">Kathmandu</option>
            <option value="Lalitpur">Lalitpur</option>
            <option value="Bhaktapur">Bhaktapur</option>
            <option value="Pokhara">Pokhara</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition"
          >
            Search Clinics
          </button>
        </form>
      </div>

      {/* Vet Clinics Directory Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading vet clinic directory...</div>
      ) : vets.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center space-y-3 border border-gray-200">
          <div className="text-4xl">🏥</div>
          <h3 className="text-lg font-bold text-gray-900">No veterinary clinics found</h3>
          <p className="text-xs text-gray-500">Try adjusting your city filter or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vets.map((vet) => {
            const services = JSON.parse(vet.servicesOffered || '[]');
            return (
              <div
                key={vet.id}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      📍 {vet.city}
                    </span>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {vet.rating.toFixed(1)}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-900 text-lg">{vet.clinicName}</h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {vet.address}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {vet.phone}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Services & Specialties:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {services.map((s: string, idx: number) => (
                        <span key={idx} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{vet.openingHours}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedVet(vet)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> Book Clinic or Home Visit
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Booking Modal */}
      {selectedVet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {bookingSuccess ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
                <h3 className="text-2xl font-extrabold text-gray-900">Appointment Requested!</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Your booking request has been sent to <strong>{selectedVet.clinicName}</strong>. You will track status updates in your dashboard.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Book Appointment
                    </span>
                    <h3 className="text-xl font-extrabold text-gray-900 mt-1">{selectedVet.clinicName}</h3>
                    <p className="text-xs text-gray-500">{selectedVet.address}</p>
                  </div>
                  <button
                    onClick={() => setSelectedVet(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                {bookingError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-semibold">{bookingError}</div>
                )}

                <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                  {/* Visit Type Toggle */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5">Select Visit Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingType('CLINIC_VISIT')}
                        className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                          bookingType === 'CLINIC_VISIT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        <Stethoscope className="w-4 h-4" /> Clinic Visit (Rs. 1,200)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingType('HOME_VISIT')}
                        className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                          bookingType === 'HOME_VISIT'
                            ? 'bg-blue-50 text-blue-800 border-blue-500 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        <Home className="w-4 h-4" /> Home Visit (Rs. 2,500)
                      </button>
                    </div>
                  </div>

                  {/* Pet Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Pet Name</label>
                      <input
                        type="text"
                        required
                        value={petName}
                        onChange={(e) => setPetName(e.target.value)}
                        placeholder="e.g. Max"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Pet Type / Breed</label>
                      <input
                        type="text"
                        required
                        value={petType}
                        onChange={(e) => setPetType(e.target.value)}
                        placeholder="e.g. Dog (Golden Retriever)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Date & Time Slot */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Requested Date</label>
                      <input
                        type="date"
                        required
                        value={requestedDate}
                        onChange={(e) => setRequestedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Time Slot</label>
                      <select
                        value={requestedTime}
                        onChange={(e) => setRequestedTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
                      >
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="10:30 AM">10:30 AM</option>
                        <option value="01:00 PM">01:00 PM</option>
                        <option value="03:30 PM">03:30 PM</option>
                        <option value="05:00 PM">05:00 PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Home Visit Address */}
                  {bookingType === 'HOME_VISIT' && (
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Home Location / Address in Nepal</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Baneshwor Height, Ward 10, Kathmandu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                  )}

                  {/* Notes & Urgent Flag */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Symptoms / Notes for Doctor</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe symptoms, vaccination requirement, or medical history..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                    ></textarea>
                  </div>

                  <div className="flex items-center gap-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <input
                      type="checkbox"
                      id="urgentCheck"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="urgentCheck" className="text-amber-900 font-semibold cursor-pointer">
                      Flag as Urgent Case (Priority Vet Review)
                    </label>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedVet(null)}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
                    >
                      {bookingLoading ? 'Sending Request...' : 'Confirm Booking'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VetDirectoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading vet directory...</div>}>
      <VetDirectoryContent />
    </Suspense>
  );
}
