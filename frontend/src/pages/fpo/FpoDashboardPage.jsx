import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Layers, 
  Store, 
  Truck, 
  TrendingUp, 
  Sprout, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw,
  Building2,
  Calendar,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';

import { API_BASE_URL } from '../../config/apiConfig';

export default function FpoDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    fpo: {},
    stats: {
      totalMembers: 0,
      activeMembers: 0,
      pendingMembers: 0,
      totalAvailableCropKg: 0,
      lotsReadyForAggregation: 0,
      activeAggregationsCount: 0,
      pendingMandiQuotations: 0,
      confirmedBulkOrders: 0,
      transportRequestsCount: 0,
      activeDeliveriesCount: 0
    }
  });

  const [aggregations, setAggregations] = useState([]);
  const [offers, setOffers] = useState([]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [overviewRes, aggRes, offersRes] = await Promise.all([
        apiClient('/api/fpo/overview'),
        apiClient('/api/fpo/aggregations'),
        apiClient('/api/fpo/offers')
      ]);

      const [overviewJson, aggJson, offersJson] = await Promise.all([
        overviewRes.json(),
        aggRes.json(),
        offersRes.json()
      ]);

      if (overviewJson.success) {
        setData(overviewJson.data);
      }
      if (aggJson.success) {
        setAggregations(aggJson.data || []);
      }
      if (offersJson.success) {
        setOffers(offersJson.data || []);
      }
    } catch (err) {
      console.error('Failed to load FPO dashboard:', err);
      showToast({ type: 'error', title: 'Network Error', message: 'Unable to connect to FPO services.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = data.stats || {};
  const fpo = data.fpo || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
      {/* FPO Header Banner */}
      <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified Farmer Producer Organization</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {fpo.name || user?.name || 'Kisan Samruddhi FPO'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl leading-relaxed">
              Agristack Registration: <span className="font-mono font-bold text-white">{fpo.registrationNumber}</span> • Operational Jurisdiction: <span className="font-semibold text-white">{fpo.district}, {fpo.state}</span> • Member Landholdings: <span className="font-semibold text-white">{fpo.collectiveAcres} Acres</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={loadDashboard}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all cursor-pointer"
              title="Refresh FPO Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/fpo/aggregation"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Create Aggregation Lot</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Primary KPI Grid (All Persisted Live Counts) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Members */}
        <div className="p-4 rounded-2xl border border-border bg-white shadow-xs space-y-1 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-semibold">
            <span>Total Members</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-text">{stats.totalMembers}</p>
          <p className="text-[11px] text-emerald-700 font-medium">
            {stats.activeMembers} Active • {stats.pendingMembers} Pending
          </p>
        </div>

        {/* Available Quantity */}
        <div className="p-4 rounded-2xl border border-border bg-white shadow-xs space-y-1 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-semibold">
            <span>Available Produce</span>
            <Sprout className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-text">
            {stats.totalAvailableCropKg >= 1000 
              ? `${(stats.totalAvailableCropKg / 1000).toFixed(1)} MT`
              : `${stats.totalAvailableCropKg} kg`}
          </p>
          <p className="text-[11px] text-teal-700 font-medium">
            {stats.lotsReadyForAggregation} Crop Lots Uncommitted
          </p>
        </div>

        {/* Aggregations */}
        <div className="p-4 rounded-2xl border border-border bg-white shadow-xs space-y-1 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-semibold">
            <span>Active Aggregations</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-text">{stats.activeAggregationsCount}</p>
          <p className="text-[11px] text-purple-700 font-medium">Collective Lots Formed</p>
        </div>

        {/* Mandi Offers */}
        <div className="p-4 rounded-2xl border border-border bg-white shadow-xs space-y-1 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-semibold">
            <span>Mandi Bulk Deals</span>
            <Store className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-text">{stats.confirmedBulkOrders}</p>
          <p className="text-[11px] text-amber-700 font-medium">
            {stats.pendingMandiQuotations} Awaiting Quotes
          </p>
        </div>

        {/* Transport */}
        <div className="p-4 rounded-2xl border border-border bg-white shadow-xs space-y-1 hover:border-emerald-300 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-muted text-xs font-semibold">
            <span>Logistics Bookings</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-text">{stats.transportRequestsCount}</p>
          <p className="text-[11px] text-blue-700 font-medium">
            {stats.activeDeliveriesCount} Cargo In-Transit
          </p>
        </div>
      </section>

      {/* Quick Action Navigation Strip */}
      <section className="bg-white rounded-2xl border border-border p-4 shadow-xs">
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">FPO Workspaces</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <Link
            to="/fpo/members"
            className="p-3 rounded-xl border border-border hover:border-emerald-400 hover:bg-emerald-50/50 flex flex-col items-center text-center gap-1.5 transition-all group"
          >
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-text">Members</span>
            <span className="text-[10px] text-muted">Manage Roster</span>
          </Link>

          <Link
            to="/fpo/crops"
            className="p-3 rounded-xl border border-border hover:border-teal-400 hover:bg-teal-50/50 flex flex-col items-center text-center gap-1.5 transition-all group"
          >
            <div className="p-2 rounded-lg bg-teal-100 text-teal-800 group-hover:scale-105 transition-transform">
              <Sprout className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-text">Crops</span>
            <span className="text-[10px] text-muted">Availability</span>
          </Link>

          <Link
            to="/fpo/aggregation"
            className="p-3 rounded-xl border border-border hover:border-purple-400 hover:bg-purple-50/50 flex flex-col items-center text-center gap-1.5 transition-all group"
          >
            <div className="p-2 rounded-lg bg-purple-100 text-purple-800 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-text">Aggregation</span>
            <span className="text-[10px] text-muted">Pool Lots</span>
          </Link>

          <Link
            to="/fpo/procurement"
            className="p-3 rounded-xl border border-border hover:border-amber-400 hover:bg-amber-50/50 flex flex-col items-center text-center gap-1.5 transition-all group"
          >
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 group-hover:scale-105 transition-transform">
              <Store className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-text">Mandi Deals</span>
            <span className="text-[10px] text-muted">Bulk Offers</span>
          </Link>

          <Link
            to="/fpo/transport"
            className="p-3 rounded-xl border border-border hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center text-center gap-1.5 transition-all group"
          >
            <div className="p-2 rounded-lg bg-blue-100 text-blue-800 group-hover:scale-105 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-text">Transport</span>
            <span className="text-[10px] text-muted">Fleet Dispatch</span>
          </Link>

          <Link
            to="/fpo/orders"
            className="p-3 rounded-xl border border-border hover:border-slate-400 hover:bg-slate-50 flex flex-col items-center text-center gap-1.5 transition-all group"
          >
            <div className="p-2 rounded-lg bg-slate-100 text-slate-800 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-text">Settlement</span>
            <span className="text-[10px] text-muted">Audit & Orders</span>
          </Link>
        </div>
      </section>

      {/* Main Grid: Active Aggregations & Recent Mandi Quotations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Aggregations */}
        <section className="bg-white rounded-3xl border border-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-text">Active Collective Lots</h2>
            </div>
            <Link to="/fpo/aggregation" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {aggregations.length === 0 ? (
            <div className="text-center py-8 text-muted space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No collective aggregation lots created yet.</p>
              <Link to="/fpo/aggregation" className="inline-block text-xs font-bold text-emerald-700 hover:underline">
                + Create your first pooled lot
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {aggregations.slice(0, 4).map((agg) => (
                <div key={agg.id} className="p-3.5 rounded-2xl border border-border hover:border-purple-300 bg-slate-50/50 flex items-center justify-between transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text text-sm">{agg.cropName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold uppercase">
                        {agg.aggregationCode}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {agg.totalQuantityKg} kg total • {agg.Items?.length || 1} Member Farmers • Hub: {agg.pickupDistrict}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      agg.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                      agg.status === 'offered' ? 'bg-amber-100 text-amber-800' :
                      agg.status === 'ready' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {agg.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mandi Bulk Procurement Deals */}
        <section className="bg-white rounded-3xl border border-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-text">Bulk Mandi Procurement Deals</h2>
            </div>
            <Link to="/fpo/procurement" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>View Offers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {offers.length === 0 ? (
            <div className="text-center py-8 text-muted space-y-2">
              <Store className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No bulk procurement offers submitted yet.</p>
              <Link to="/fpo/procurement" className="inline-block text-xs font-bold text-emerald-700 hover:underline">
                + Offer pooled produce to APMC Mandis
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.slice(0, 4).map((off) => (
                <div key={off.id} className="p-3.5 rounded-2xl border border-border hover:border-amber-300 bg-slate-50/50 flex items-center justify-between transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text text-sm">{off.mandiName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold">
                        {off.cropName}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {off.totalQuantityKg} kg • Target: ₹{off.requestedRatePerKg}/kg {off.quotedRatePerKg ? `• Mandi Quote: ₹${off.quotedRatePerKg}/kg` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      off.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                      off.status === 'quotation_received' ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' :
                      off.status === 'awaiting_mandi_response' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {off.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
