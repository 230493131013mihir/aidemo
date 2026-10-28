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
  Sprout
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';

export default function FarmerFpoPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [fpos, setFpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myMembership, setMyMembership] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        setMyMembership(memJson.data);
      }
    } catch (err) {
      console.warn('Could not load FPO data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApply(fpoId) {
    setApplyingId(fpoId);
    try {
      const res = await apiClient('/api/fpo/membership-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fpoId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Application failed');
      }

      showToast({
        type: 'success',
        title: 'Application Submitted',
        message: 'Your membership request is now PENDING review by the FPO committee.'
      });
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
      (f.state || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 w-full max-w-full 2xl:max-w-[1720px] mx-auto py-4 sm:py-6 px-2 sm:px-4">
      {/* Header */}
      <section className="rounded-3xl border border-emerald-700/40 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/harvest-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-teal-950/90 to-slate-950/85 backdrop-blur-[1px]" />

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Users className="w-4 h-4" />
            <span>Farmer Producer Organizations (FPOs)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
            FPO Membership & Collective Power
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed drop-shadow-sm">
            Join a registered agricultural collective in your district. Access bulk mandi procurement contracts, subsidized shared transport, and collective input purchasing.
          </p>
        </div>
      </section>

      {/* Current Membership Status Banner */}
      {myMembership && (
        <section className={`p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          myMembership.status === 'active'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : myMembership.status === 'pending'
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-slate-50 border-slate-300 text-slate-800'
        }`}>
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              myMembership.status === 'active'
                ? 'bg-emerald-600 text-white'
                : myMembership.status === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-600 text-white'
            }`}>
              {myMembership.status === 'active' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : myMembership.status === 'pending' ? (
                <Clock className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base">
                  {myMembership.fpo?.name || 'Registered FPO'}
                </h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  myMembership.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : myMembership.status === 'pending'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-200 text-slate-800 border-slate-400'
                }`}>
                  {myMembership.status}
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-85">
                {myMembership.status === 'active'
                  ? 'Your membership is active and verified. You are eligible for collective crop pooling and bulk mandi offers.'
                  : myMembership.status === 'pending'
                  ? 'Your membership request is currently awaiting approval from the FPO executive committee.'
                  : 'Your membership application was reviewed.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Status</span>
          </button>
        </section>
      )}

      {/* FPO Directory & Application Strip */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Registered FPO Directory</h2>
            <p className="text-xs text-slate-500">
              Browse approved Farmer Producer Companies operating in Maharashtra.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search FPO or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading verified FPO directory...</div>
        ) : filteredFpos.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
            No registered FPOs found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFpos.map((fpo) => {
              const isCurrentFpo = myMembership?.fpoId === fpo.id;
              const isPending = isCurrentFpo && myMembership.status === 'pending';
              const isActive = isCurrentFpo && myMembership.status === 'active';

              return (
                <div
                  key={fpo.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-slate-900">{fpo.name}</h3>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Reg: {fpo.registrationNumber}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Enrolled
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          Pending Approval
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Location</span>
                        <span className="font-semibold text-slate-800">{fpo.district}, {fpo.state}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Landholding</span>
                        <span className="font-semibold text-slate-800">{fpo.collectiveAcres} Acres</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Committee Review Required
                    </span>

                    {isActive ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Approved Member
                      </span>
                    ) : isPending ? (
                      <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Application Under Review
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApply(fpo.id)}
                        disabled={applyingId === fpo.id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{applyingId === fpo.id ? 'Submitting...' : 'Apply for Membership'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
