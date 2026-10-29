import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Send,
  RefreshCw,
  Search,
  MapPin,
  Sprout,
  Calendar,
  Layers,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';

export default function FarmerFpoPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [fpos, setFpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allMemberships, setAllMemberships] = useState([]);
  const [applyingId, setApplyingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [selectedFpoForModal, setSelectedFpoForModal] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [fpoRes, memRes] = await Promise.all([
        apiClient('/api/fpo/all-organizations'),
        apiClient('/api/fpo/my-membership')
      ]);

      const [fpoJson, memJson] = await Promise.all([
        fpoRes.json(),
        memRes.json()
      ]);

      if (fpoJson.success && Array.isArray(fpoJson.data)) {
        setFpos(fpoJson.data);
      }
      if (memJson.success) {
        const memArray = Array.isArray(memJson.data) ? memJson.data : (memJson.data ? [memJson.data] : []);
        setAllMemberships(memArray);
      }
    } catch (err) {
      console.warn('Could not load FPO data:', err);
      showToast({ type: 'error', title: 'Network Error', message: 'Unable to retrieve FPO information.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApply(fpoId, notes = '') {
    setApplyingId(fpoId);
    try {
      const res = await apiClient('/api/fpo/membership-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fpoId, notes: notes || requestNotes })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Application failed');
      }

      showToast({
        type: 'success',
        title: 'Membership Request Dispatched! 🌾',
        message: 'Your application has been submitted to the FPO committee. Current status: PENDING.'
      });
      setSelectedFpoForModal(null);
      setRequestNotes('');
      await loadData();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Submission Error',
        message: err.message
      });
    } finally {
      setApplyingId(null);
    }
  }

  const filteredFpos = fpos.filter(f => {
    const q = searchQuery.toLowerCase();
    return !searchQuery ||
      (f.name || '').toLowerCase().includes(q) ||
      (f.district || '').toLowerCase().includes(q) ||
      (f.state || '').toLowerCase().includes(q) ||
      (f.mainCrops || '').toLowerCase().includes(q);
  });

  const activeMembership = allMemberships.find(m => m.status === 'active');
  const pendingRequests = allMemberships.filter(m => m.status === 'pending');
  const rejectedRequests = allMemberships.filter(m => m.status === 'rejected');

  return (
    <div className="space-y-6 w-full max-w-full 2xl:max-w-[1720px] mx-auto py-4 sm:py-6 px-2 sm:px-4 animate-in fade-in">
      {/* Header Banner */}
      <section className="rounded-3xl border border-emerald-700/40 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/harvest-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-teal-950/90 to-slate-950/85 backdrop-blur-[1px]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Users className="w-4 h-4" />
              <span>Farmer Producer Organizations (FPO Portal)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
              FPO Requests & Collective Membership
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed drop-shadow-sm">
              Apply to verified agricultural collectives in Maharashtra, gain direct bulk mandi bargaining power, and track the live approval status of your submitted membership requests.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh FPO Status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 1: PREVIOUSLY SUBMITTED REQUESTS & CURRENT STATUS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Previously Submitted Requests</h2>
          </div>
          <span className="text-xs text-muted font-semibold">
            {allMemberships.length} {allMemberships.length === 1 ? 'Record' : 'Records'} on file
          </span>
        </div>

        {allMemberships.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-border text-center space-y-2 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">No Membership Requests Submitted Yet</h3>
            <p className="text-xs text-muted max-w-md mx-auto">
              You have not submitted any FPO membership applications. Browse the verified FPO directory below and click <strong>Request to Join</strong> to apply.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allMemberships.map((mem) => {
              const isAccepted = mem.status === 'active';
              const isPending = mem.status === 'pending';
              const isRejected = mem.status === 'rejected';

              const submissionDate = mem.createdAt
                ? new Date(mem.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Recorded on file';

              return (
                <div 
                  key={mem.id || mem.fpoId}
                  className={`p-5 rounded-2xl border shadow-xs transition-all ${
                    isAccepted
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : isPending
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-rose-50/70 border-rose-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className={`p-3 rounded-2xl shrink-0 ${
                        isAccepted
                          ? 'bg-emerald-600 text-white shadow-md'
                          : isPending
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-rose-600 text-white shadow-md'
                      }`}>
                        {isAccepted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : isPending ? (
                          <Clock className="w-6 h-6" />
                        ) : (
                          <XCircle className="w-6 h-6" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900">
                            {mem.fpoName || 'Registered FPO'}
                          </h3>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            isAccepted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {isAccepted ? 'Accepted' : isPending ? 'Pending' : 'Rejected'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>{mem.district}, {mem.state}</span>
                          </span>
                          {mem.fpoPhone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{mem.fpoPhone}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Submitted: {submissionDate}</span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium pt-0.5">
                          {isAccepted
                            ? '✅ Your membership has been approved! You are an active, enrolled member of this FPO with collective bargaining privileges.'
                            : isPending
                            ? '⏳ Your membership application has been logged and is under formal review by the FPO executive committee.'
                            : '❌ Your membership application was declined by the FPO administration.'}
                        </p>

                        {mem.notes && (
                          <div className="p-2 rounded-xl bg-white/70 border border-slate-200/80 text-[11px] text-slate-700 mt-1 max-w-xl">
                            <span className="font-bold text-slate-900">Remarks: </span>
                            <span>{mem.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 self-start sm:self-auto">
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Active Member</span>
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs">
                          <Clock className="w-4 h-4" />
                          <span>Under Review</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedFpoForModal(fpos.find(f => Number(f.id) === Number(mem.fpoId)) || { id: mem.fpoId, name: mem.fpoName })}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          Re-apply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: AVAILABLE FPO ORGANIZATIONS DIRECTORY */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-bold text-slate-900">Available FPO Organizations</h2>
            </div>
            <p className="text-xs text-muted">
              Select an FPO to submit a membership request and link your produce to collective mandi pools.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search FPO name, district, crops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-border focus:outline-none focus:border-primary bg-white shadow-2xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Loading verified FPO directory...</span>
          </div>
        ) : filteredFpos.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-border text-center text-xs text-muted">
            No registered FPOs match your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFpos.map((fpo) => {
              const memberRecord = allMemberships.find(m => Number(m.fpoId) === Number(fpo.id));
              const isPending = memberRecord?.status === 'pending';
              const isActive = memberRecord?.status === 'active';
              const isRejected = memberRecord?.status === 'rejected';

              return (
                <div
                  key={fpo.id}
                  className="p-5 rounded-3xl bg-white border border-border shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">{fpo.name}</h3>
                          <span className="text-[10px] text-muted font-mono block">
                            Agristack Reg: {fpo.registrationNumber}
                          </span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      {isActive && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase shrink-0">
                          Accepted
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 uppercase shrink-0">
                          Pending
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 uppercase shrink-0">
                          Rejected
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Location</span>
                        <span className="font-semibold text-slate-800 truncate block">{fpo.district}, {fpo.state}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Landholding</span>
                        <span className="font-semibold text-slate-800 block">{fpo.totalAcres || fpo.collectiveAcres || 45} Acres</span>
                      </div>
                    </div>

                    <div className="text-xs pt-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Covered Commodities</span>
                      <span className="text-slate-700 font-medium text-[11px] line-clamp-1">
                        {fpo.mainCrops || 'Vegetables, Pulses, Grains'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-muted">
                      {isActive
                        ? 'Enrolled Member'
                        : isPending
                        ? 'Application Submitted'
                        : 'Committee Review Required'}
                    </span>

                    {isActive ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Enrolled in FPO
                      </span>
                    ) : isPending ? (
                      <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Request Pending
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedFpoForModal(fpo)}
                        disabled={applyingId === fpo.id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isRejected ? 'Re-apply to Join' : 'Request to Join'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Membership Request Modal */}
      {selectedFpoForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Join FPO Cooperative</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFpoForModal(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-muted hover:text-text cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <h4 className="font-extrabold text-sm text-emerald-950">{selectedFpoForModal.name}</h4>
                <p className="text-[11px] text-emerald-800">
                  {selectedFpoForModal.district}, {selectedFpoForModal.state} • Reg: {selectedFpoForModal.registrationNumber || 'MH-FPO'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-700 font-bold">Your Applicant Details (Authenticated):</span>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5 text-slate-600">
                  <p><span className="font-semibold text-slate-800">Farmer:</span> {user?.name || 'Verified Farmer'}</p>
                  <p><span className="font-semibold text-slate-800">Phone:</span> {user?.phone || '—'}</p>
                  <p><span className="font-semibold text-slate-800">District:</span> {user?.FarmerProfile?.district || 'Pune'}</p>
                </div>
              </div>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Application Notes / Message (Optional):</span>
                <textarea
                  rows={3}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="e.g. 5 acres Onion & Tomato grower from Junnar interested in collective Vashi APMC lots."
                  className="w-full rounded-xl border border-border p-3 text-xs outline-none focus:border-primary text-slate-800"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedFpoForModal(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApply(selectedFpoForModal.id)}
                disabled={applyingId === selectedFpoForModal.id}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{applyingId === selectedFpoForModal.id ? 'Submitting...' : 'Submit Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
