'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatNPR, formatDate } from '@/lib/utils';
import { Stethoscope, Calendar, Home, FileText, Check, X, Plus, AlertCircle, Search, User } from 'lucide-react';

export default function VetDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'homeVisits' | 'ehr'>('overview');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fee Estimate Modal State
  const [selectedApptForFee, setSelectedApptForFee] = useState<any>(null);
  const [feeEstimateInput, setFeeEstimateInput] = useState('2500');

  // EHR Record Modal State
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordForm, setRecordForm] = useState({
    petName: '',
    customerId: '',
    diagnosis: '',
    prescription: '',
    followUpNotes: '',
  });

  const [searchPetHistory, setSearchPetHistory] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user && session.user.role !== 'VET') {
      if (session.user.role === 'CUSTOMER') router.push('/customer/dashboard');
      if (session.user.role === 'SELLER') router.push('/seller/dashboard');
      if (session.user.role === 'ADMIN') router.push('/admin/dashboard');
      return;
    }

    fetchVetData();
  }, [session, status]);

  const fetchVetData = async () => {
    setLoading(true);
    try {
      const [apptsRes, recordsRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/patient-records'),
      ]);

      const apptsData = await apptsRes.json();
      const recordsData = await recordsRes.json();

      setAppointments(Array.isArray(apptsData) ? apptsData : []);
      setPatientRecords(Array.isArray(recordsData) ? recordsData : []);
    } catch (e) {
      console.error(e);
    } fontal: {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, feeEstimate?: number) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          feeEstimate: feeEstimate !== undefined ? feeEstimate : undefined,
        }),
      });
      setSelectedApptForFee(null);
      fetchVetData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/patient-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordForm),
      });

      if (res.ok) {
        setShowRecordModal(false);
        setRecordForm({ petName: '', customerId: '', diagnosis: '', prescription: '', followUpNotes: '' });
        fetchVetData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clinicVisits = appointments.filter((a) => a.type === 'CLINIC_VISIT');
  const homeVisits = appointments.filter((a) => a.type === 'HOME_VISIT');
  const pendingRequests = appointments.filter((a) => a.status === 'PENDING');
  const urgentCases = appointments.filter((a) => a.isUrgent);

  if (status === 'loading' || loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">Loading Clinic Portal...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Clinic Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-emerald-900 text-white p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold">{session?.user?.name || 'Dr. Bikram Maharjan'}</h1>
            <span className="text-[10px] bg-blue-500 text-white font-bold px-2 py-0.5 rounded uppercase">
              Verified Vet Clinic
            </span>
          </div>
          <p className="text-blue-100 text-xs mt-1">
            Bagmati Animal Hospital & Research Center • Lazimpat, Kathmandu
          </p>
        </div>

        <button
          onClick={() => setShowRecordModal(true)}
          className="px-5 py-3 bg-white text-blue-900 font-bold rounded-xl shadow hover:bg-blue-50 transition flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4 text-blue-600" /> Log New Patient Medical Record
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Stethoscope className="w-4 h-4" /> Today&apos;s Schedule
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" /> Clinic Visits ({clinicVisits.length})
        </button>

        <button
          onClick={() => setActiveTab('homeVisits')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'homeVisits'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Home className="w-4 h-4 text-emerald-600" /> Home Visit Requests ({homeVisits.length})
        </button>

        <button
          onClick={() => setActiveTab('ehr')}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'ehr'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Electronic Health Records ({patientRecords.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="text-xs text-gray-500 font-semibold uppercase">Pending Requests</div>
              <div className="text-3xl font-extrabold text-amber-600">{pendingRequests.length}</div>
              <div className="text-[11px] text-gray-400">Awaiting confirmation</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="text-xs text-gray-500 font-semibold uppercase">Urgent Flagged Cases</div>
              <div className="text-3xl font-extrabold text-red-600">{urgentCases.length}</div>
              <div className="text-[11px] text-red-600 font-medium">Priority medical attention</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="text-xs text-gray-500 font-semibold uppercase">Logged Patient Records</div>
              <div className="text-3xl font-extrabold text-blue-600">{patientRecords.length}</div>
              <div className="text-[11px] text-gray-400">Prescriptions & diagnoses</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Clinic Visits */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {clinicVisits.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
              <div className="text-4xl">🏥</div>
              <h3 className="text-base font-bold text-gray-900">No clinic visit bookings</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clinicVisits.map((a) => (
                <div key={a.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-extrabold text-gray-900 text-base">
                        🐾 {a.petName} ({a.petType})
                      </div>
                      <div className="text-xs text-gray-500">
                        Owner: {a.customer?.name} ({a.customer?.phone})
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                        a.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : a.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                    <div>📅 Date: {a.requestedDate} at {a.requestedTime}</div>
                    <div>💰 Fee Estimate: {formatNPR(a.feeEstimate || 1200)}</div>
                    {a.notes && <div className="italic text-gray-600 mt-1">&quot;{a.notes}&quot;</div>}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {a.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(a.id, 'CONFIRMED')}
                          className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                        >
                          Accept Booking
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(a.id, 'REJECTED')}
                          className="flex-1 py-2 bg-red-100 text-red-700 font-bold rounded-lg text-xs"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {a.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(a.id, 'COMPLETED')}
                        className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg text-xs"
                      >
                        Mark Completed & Log EHR
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Home Visits */}
      {activeTab === 'homeVisits' && (
        <div className="space-y-6">
          {homeVisits.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
              <div className="text-4xl">🏡</div>
              <h3 className="text-base font-bold text-gray-900">No home visit requests</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {homeVisits.map((a) => (
                <div key={a.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        Home Visit Request
                      </span>
                      <h3 className="font-extrabold text-gray-900 text-base mt-1">
                        🐾 {a.petName} ({a.petType})
                      </h3>
                      <p className="text-xs text-gray-500">
                        Owner: {a.customer?.name} ({a.customer?.phone})
                      </p>
                    </div>
                    {a.isUrgent && (
                      <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                        🚨 URGENT
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                    <div>📍 <strong>Location Address:</strong> {a.address}</div>
                    <div>📅 <strong>Preferred Date/Time:</strong> {a.requestedDate} at {a.requestedTime}</div>
                    <div>💰 <strong>Current Fee Estimate:</strong> {formatNPR(a.feeEstimate || 2500)}</div>
                    {a.notes && <div className="italic text-gray-600 mt-1">&quot;{a.notes}&quot;</div>}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {a.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedApptForFee(a);
                            setFeeEstimateInput(String(a.feeEstimate || 2500));
                          }}
                          className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                        >
                          Accept & Send Fee Estimate
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(a.id, 'REJECTED')}
                          className="flex-1 py-2 bg-red-100 text-red-700 font-bold rounded-lg text-xs"
                        >
                          Decline Request
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: EHR Patient Records */}
      {activeTab === 'ehr' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchPetHistory}
                onChange={(e) => setSearchPetHistory(e.target.value)}
                placeholder="Search patient record by pet name..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <button
              onClick={() => setShowRecordModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Add Medical Entry
            </button>
          </div>

          <div className="space-y-4">
            {patientRecords
              .filter((r) => !searchPetHistory || r.petName.toLowerCase().includes(searchPetHistory.toLowerCase()))
              .map((r) => (
                <div key={r.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div>
                      <span className="font-extrabold text-gray-900 text-base">🐾 {r.petName}</span>
                      <span className="text-xs text-gray-500 ml-2">Owner: {r.customer?.name} ({r.customer?.phone})</span>
                    </div>
                    <div className="text-xs text-gray-400">{formatDate(r.visitDate)}</div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-blue-900">Diagnosis:</strong>
                      <p className="text-gray-800 font-medium">{r.diagnosis}</p>
                    </div>
                    <div>
                      <strong className="text-emerald-900">Prescription & Dosage:</strong>
                      <p className="text-gray-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-mono">
                        {r.prescription}
                      </p>
                    </div>
                    {r.followUpNotes && (
                      <div>
                        <strong className="text-gray-600">Follow-up Notes:</strong>
                        <p className="text-gray-600 italic">{r.followUpNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Fee Estimate Modal for Home Visits */}
      {selectedApptForFee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-gray-900">Send Fee Estimate for Home Visit</h3>
            <p className="text-xs text-gray-500">
              Set consultation and travel fee estimate (NPR) for <strong>{selectedApptForFee.petName}</strong> at {selectedApptForFee.address}.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">Fee Estimate in NPR (₨)</label>
              <input
                type="number"
                value={feeEstimateInput}
                onChange={(e) => setFeeEstimateInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold text-emerald-800"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedApptForFee(null)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleUpdateStatus(selectedApptForFee.id, 'CONFIRMED', parseFloat(feeEstimateInput))
                }
                className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs"
              >
                Confirm & Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New EHR Record Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-gray-900">Log Patient Electronic Health Record</h3>

            <form onSubmit={handleCreateRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Pet Name</label>
                  <input
                    type="text"
                    required
                    value={recordForm.petName}
                    onChange={(e) => setRecordForm({ ...recordForm, petName: e.target.value })}
                    placeholder="e.g. Max"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Customer User ID</label>
                  <input
                    type="text"
                    required
                    value={recordForm.customerId}
                    onChange={(e) => setRecordForm({ ...recordForm, customerId: e.target.value })}
                    placeholder="e.g. customer@pawmart.test or User ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Diagnosis</label>
                <input
                  type="text"
                  required
                  value={recordForm.diagnosis}
                  onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                  placeholder="e.g. Seasonal Flea Allergy Dermatitis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Prescription & Medication</label>
                <textarea
                  rows={3}
                  required
                  value={recordForm.prescription}
                  onChange={(e) => setRecordForm({ ...recordForm, prescription: e.target.value })}
                  placeholder="Drug name, dosage, frequency, duration..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Follow-Up Notes</label>
                <textarea
                  rows={2}
                  value={recordForm.followUpNotes}
                  onChange={(e) => setRecordForm({ ...recordForm, followUpNotes: e.target.value })}
                  placeholder="Re-examination date or dietary instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
