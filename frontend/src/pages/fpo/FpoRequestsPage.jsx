import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  RefreshCw, 
  AlertCircle,
  X,
  Sprout,
  Filter,
  ArrowRight,
  Send,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';

export default function FpoRequestsPage() {
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // default to pending requests
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestForReject, setSelectedRequestForReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await apiClient('/api/fpo/membership-requests');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRequests(json.data);
      }
    } catch (err) {
      console.error('Failed to load membership requests:', err);
      showToast({ type: 'error', title: 'Network Error', message: 'Unable to retrieve membership requests.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  // Handle Accept
  async function handleAccept(id, farmerName) {
    setActionLoadingId(id);
    try {
      const res = await apiClient(`/api/fpo/members/${id}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'accept' })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to accept membership request');
      }

      showToast({
        type: 'success',
        title: 'Membership Approved! 🎉',
        message: `${farmerName || 'Farmer'} is now an active member of your FPO roster.`
      });
      await loadRequests();
    } catch (err) {
      showToast({ type: 'error', title: 'Action Failed', message: err.message });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Open Reject Modal
  function handleOpenRejectModal(reqItem) {
    setSelectedRequestForReject(reqItem);
    setRejectReason('');
    setRejectModalOpen(true);
  }

  // Submit Reject
  async function handleConfirmReject() {
    if (!selectedRequestForReject) return;
    const id = selectedRequestForReject.id;
    const farmerName = selectedRequestForReject.farmerName || selectedRequestForReject.name;

    setActionLoadingId(id);
    try {
      const res = await apiClient(`/api/fpo/members/${id}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'reject', reason: rejectReason })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to reject membership request');
      }

      showToast({
        type: 'info',
        title: 'Application Rejected',
        message: `Membership request for ${farmerName || 'Farmer'} has been declined.`
      });
      setRejectModalOpen(false);
      setSelectedRequestForReject(null);
      await loadRequests();
    } catch (err) {
      showToast({ type: 'error', title: 'Action Failed', message: err.message });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && r.status !== 'pending') return false;
        if (statusFilter === 'active' && r.status !== 'active') return false;
        if (statusFilter === 'rejected' && r.status !== 'rejected') return false;
      }

      // Search query filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (r.farmerName || '').toLowerCase().includes(q) ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.village || '').toLowerCase().includes(q) ||
        (r.district || '').toLowerCase().includes(q) ||
        (r.mainCrop || '').toLowerCase().includes(q) ||
        String(r.phone || '').includes(q)
      );
    });
  }, [requests, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    const pending = requests.filter(r => r.status === 'pending').length;
    const active = requests.filter(r => r.status === 'active').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    return { pending, active, rejected, total: requests.length };
  }, [requests]);

  return (
    <div className="space-y-6 w-full max-w-full 2xl:max-w-[1720px] mx-auto py-4 sm:py-6 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>FPO Membership Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text">Membership Requests</h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
            Review incoming applications submitted by farmers seeking to join your FPO cooperative. Accept requests to enroll farmers into your official collective bargaining roster.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadRequests}
            className="p-2.5 rounded-xl border border-border hover:bg-slate-50 text-muted hover:text-text transition-colors"
            title="Refresh Requests"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/fpo/members"
            className="py-2.5 px-4 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>View Member Roster ({counts.active})</span>
          </Link>
        </div>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30'
              : 'bg-white border-border hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{counts.pending}</p>
          <span className="text-[11px] text-amber-700 font-semibold">Requires your decision</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-400/30'
              : 'bg-white border-border hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Accepted Members</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{counts.active}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Enrolled in Roster</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-rose-500/10 border-rose-400 ring-2 ring-rose-400/30'
              : 'bg-white border-border hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{counts.rejected}</p>
          <span className="text-[11px] text-rose-700 font-semibold">Declined applications</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white border-border hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-600'}`}>
              All Applications
            </span>
            <Layers className={`w-4 h-4 ${statusFilter === 'all' ? 'text-white' : 'text-slate-600'}`} />
          </div>
          <p className={`text-2xl font-black mt-1 ${statusFilter === 'all' ? 'text-white' : 'text-slate-900'}`}>
            {counts.total}
          </p>
          <span className={`text-[11px] font-semibold ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
            Lifetime requests
          </span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-xs">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by farmer name, village, crops, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border pl-9 pr-3 py-2 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-muted font-bold text-[11px] uppercase tracking-wider shrink-0">Filter:</span>
          {['pending', 'active', 'rejected', 'all'].map((filterKey) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setStatusFilter(filterKey)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === filterKey
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filterKey === 'active' ? 'Accepted' : filterKey}
              <span className="ml-1.5 opacity-80">
                ({filterKey === 'pending' ? counts.pending : filterKey === 'active' ? counts.active : filterKey === 'rejected' ? counts.rejected : counts.total})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-muted flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span>Loading membership requests...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-slate-800">No membership requests found</p>
            <p className="text-slate-500">
              {statusFilter === 'pending'
                ? 'Great! There are no pending membership requests awaiting your decision.'
                : `No requests match the selected status filter (${statusFilter}).`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-border text-[11px] uppercase tracking-wider text-muted font-bold">
                <tr>
                  <th className="px-5 py-3.5">Farmer & Contact</th>
                  <th className="px-5 py-3.5">Location & Land</th>
                  <th className="px-5 py-3.5">Registered Crops</th>
                  <th className="px-5 py-3.5">Submission Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Decision Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRequests.map((reqItem) => {
                  const isPending = reqItem.status === 'pending';
                  const isActive = reqItem.status === 'active';
                  const isRejected = reqItem.status === 'rejected';
                  const isActionLoading = actionLoadingId === reqItem.id;

                  const formattedDate = reqItem.createdAt || reqItem.submittedAt
                    ? new Date(reqItem.createdAt || reqItem.submittedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Recently submitted';

                  return (
                    <tr key={reqItem.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Farmer & Contact */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-text text-sm flex items-center gap-1.5">
                          <span>{reqItem.farmerName || reqItem.name}</span>
                          {reqItem.isGovtVerified && (
                            <span title="Agristack / 7/12 Land Record Verified">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{reqItem.phone}</span>
                        </div>
                        {reqItem.email && reqItem.email !== '—' && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{reqItem.email}</div>
                        )}
                      </td>

                      {/* Location & Land */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-text flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{reqItem.village}, {reqItem.district}</span>
                        </div>
                        <div className="text-[11px] text-muted mt-0.5 font-medium">
                          {reqItem.farmSizeAcres > 0 ? `${reqItem.farmSizeAcres} Acres Farm` : 'Landholding details on file'}
                        </div>
                      </td>

                      {/* Registered Crops */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {reqItem.crops && reqItem.crops.length > 0 ? (
                            reqItem.crops.map((c) => (
                              <span key={c} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted text-[11px]">{reqItem.mainCrop || 'General produce'}</span>
                          )}
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td className="px-5 py-4">
                        <div className="text-slate-700 font-medium text-xs">{formattedDate}</div>
                        <div className="text-[10px] text-muted mt-0.5">Application #{reqItem.id}</div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Accepted Member</span>
                            </>
                          ) : isPending ? (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Review</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Rejected</span>
                            </>
                          )}
                        </span>
                        {reqItem.notes && (
                          <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] line-clamp-2 italic">
                            "{reqItem.notes}"
                          </p>
                        )}
                      </td>

                      {/* Decision Actions */}
                      <td className="px-5 py-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleAccept(reqItem.id, reqItem.farmerName || reqItem.name)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Accept membership request and add farmer to roster"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isActionLoading ? 'Saving...' : 'Accept'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(reqItem)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Reject membership request"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : isActive ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Enrolled in Roster</span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-rose-600 flex items-center justify-end gap-1">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <span>Declined</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectModalOpen && selectedRequestForReject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Reject Membership Application</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-muted hover:text-text cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-700">
                You are declining the membership request for <span className="font-extrabold text-slate-900">{selectedRequestForReject.farmerName || selectedRequestForReject.name}</span>.
              </p>
              <p className="text-muted">
                The farmer will see this status in their FPO Requests page. You may optionally provide a reason or instructions for re-applying:
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Jurisdiction outside operational block / crop profile mismatch / capacity limit reached"
                className="w-full rounded-xl border border-border p-3 text-xs outline-none focus:border-rose-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoadingId === selectedRequestForReject.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                {actionLoadingId === selectedRequestForReject.id ? 'Declining...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
