import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  RefreshCw, 
  AlertCircle,
  Eye,
  X,
  Sprout,
  Filter
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';

export default function FpoMembersPage() {
  const { showToast } = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [availableFarmers, setAvailableFarmers] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [invitingId, setInvitingId] = useState(null);

  // Load FPO Members
  async function loadMembers() {
    setLoading(true);
    try {
      const res = await apiClient(`/api/fpo/members?status=${statusFilter}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMembers(json.data);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
      showToast({ type: 'error', title: 'Network Error', message: 'Unable to load member roster.' });
    } finally {
      setLoading(false);
    }
  }

  // Load Available Farmers for Invitation Modal
  async function loadAvailableFarmers(q = '') {
    setLoadingAvailable(true);
    try {
      const res = await apiClient(`/api/fpo/available-farmers?search=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAvailableFarmers(json.data);
      }
    } catch (err) {
      console.error('Failed to load available farmers:', err);
    } finally {
      setLoadingAvailable(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, [statusFilter]);

  useEffect(() => {
    if (isInviteModalOpen) {
      loadAvailableFarmers(farmerSearch);
    }
  }, [isInviteModalOpen, farmerSearch]);

  // Handle Status Update (Approve / Reject / Deactivate)
  async function handleUpdateStatus(id, newStatus) {
    try {
      const res = await apiClient(`/api/fpo/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Action failed');
      }

      showToast({
        type: newStatus === 'active' ? 'success' : 'info',
        title: 'Status Updated',
        message: `Member status set to ${newStatus.toUpperCase()}. Farmer account preserved.`
      });
      await loadMembers();
    } catch (err) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message });
    }
  }

  // Handle Direct Enrollment
  async function handleEnrollFarmer(farmerId) {
    setInvitingId(farmerId);
    try {
      const res = await apiClient('/api/fpo/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmerId })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Enrollment failed');
      }

      showToast({
        type: 'success',
        title: 'Member Enrolled',
        message: json.message
      });
      setIsInviteModalOpen(false);
      await loadMembers();
    } catch (err) {
      showToast({ type: 'error', title: 'Enrollment Error', message: err.message });
    } finally {
      setInvitingId(null);
    }
  }

  // Filtered list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.village.toLowerCase().includes(q) ||
        m.district.toLowerCase().includes(q) ||
        m.mainCrop.toLowerCase().includes(q) ||
        String(m.phone).includes(q)
      );
    });
  }, [members, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>FPO Cooperative Roster</span>
          </div>
          <h1 className="text-2xl font-black text-text">Member Farmer Management</h1>
          <p className="text-xs text-muted mt-0.5">
            Manage enrolled farmers, verify crop consent permissions, and onboard new producers into your FPO bargaining pool.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadMembers}
            className="p-2.5 rounded-xl border border-border hover:bg-slate-50 text-muted hover:text-text transition-colors"
            title="Refresh Roster"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Enroll Farmer</span>
          </button>
        </div>
      </div>

      {/* Controls Strip: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-xs">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search member by name, village, crop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border pl-9 pr-3 py-2 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border px-3 py-2 text-xs bg-white text-text font-semibold outline-none focus:border-primary"
          >
            <option value="all">All Members ({members.length})</option>
            <option value="active">Active Only</option>
            <option value="pending">Pending Requests</option>
            <option value="inactive">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <section className="bg-white rounded-3xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-border text-[11px] uppercase tracking-wider text-muted font-bold">
              <tr>
                <th className="px-5 py-3.5">Farmer & Contact</th>
                <th className="px-5 py-3.5">Location & Land</th>
                <th className="px-5 py-3.5">Primary Crops</th>
                <th className="px-5 py-3.5">Consent & Verification</th>
                <th className="px-5 py-3.5">Membership Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-muted">
                    {loading ? 'Loading member records...' : 'No members found matching criteria.'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Farmer Name & Contact */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-text text-sm flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {m.isGovtVerified && (
                          <span title="Agristack / 7/12 Verified">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted font-mono">{m.phone}</div>
                    </td>

                    {/* Location & Land */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-text">{m.village}, {m.district}</div>
                      <div className="text-[11px] text-muted">{m.farmSizeAcres} Acres Farm</div>
                    </td>

                    {/* Crops */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {m.crops && m.crops.length > 0 ? (
                          m.crops.map((c) => (
                            <span key={c} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted text-[11px]">{m.mainCrop}</span>
                        )}
                      </div>
                    </td>

                    {/* Consent */}
                    <td className="px-5 py-3.5 space-y-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.consentShareCrops ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        <span>●</span> {m.consentShareCrops ? 'Crops Shared' : 'Consent Pending'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        m.membershipStatus === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        m.membershipStatus === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {m.membershipStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      {m.membershipStatus === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(m.id, 'active')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs hover:bg-emerald-100 cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(m.id, 'rejected')}
                            className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-300 font-bold text-xs hover:bg-red-100 cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      ) : m.membershipStatus === 'active' ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(m.id, 'inactive')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                          title="Deactivate membership without deleting user account"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(m.id, 'active')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs hover:bg-emerald-100 cursor-pointer"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ENROLL FARMER MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-text">Enroll Member Farmer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted">
              Search registered farmers in Maharashtra to enroll them into your FPO collective bargaining network.
            </p>

            <div className="relative">
              <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by farmer name, mobile number..."
                value={farmerSearch}
                onChange={(e) => setFarmerSearch(e.target.value)}
                className="w-full rounded-xl border border-border pl-9 pr-3 py-2 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-border/60 border border-border rounded-2xl">
              {loadingAvailable ? (
                <div className="p-4 text-center text-xs text-muted">Searching farmers...</div>
              ) : availableFarmers.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted">No non-member farmers found.</div>
              ) : (
                availableFarmers.map((f) => (
                  <div key={f.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-text text-xs flex items-center gap-1">
                        <span>{f.name}</span>
                        {f.isGovtVerified && <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />}
                      </p>
                      <p className="text-[11px] text-muted">
                        {f.village}, {f.district} • {f.farmSizeAcres} Acres • {f.mainCrop}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={invitingId === f.id}
                      onClick={() => handleEnrollFarmer(f.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                    >
                      {invitingId === f.id ? 'Enrolling...' : '+ Enroll'}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
