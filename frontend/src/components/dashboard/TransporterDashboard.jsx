import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Phone,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Scale,
  Navigation,
  Car
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function TransporterDashboard() {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState({
    totalTripsCompleted: 0,
    activeTripsCount: 0,
    totalCargoDeliveredKg: 0,
    totalEarnings: 0,
    vehicleType: 'Mahindra Bolero Maxi Truck',
    vehicleNumber: 'GJ-05-BX-4921',
    capacityKg: 2200,
    isAvailable: true,
    activeTrip: null,
  });
  const [loading, setLoading] = useState(true);
  const [updatingTrip, setUpdatingTrip] = useState(false);

  async function loadTransporterStats() {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/transporter-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.warn('Could not load transporter stats:', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransporterStats();
  }, [token]);

  async function handleProgressTrip(tripId, nextStatus) {
    setUpdatingTrip(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/requests/${tripId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nextStatus })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update trip progress');
      }

      showToast(`Trip status updated: ${nextStatus.toUpperCase()}`, 'success');
      loadTransporterStats();
    } catch (err) {
      showToast(err.message || 'Error updating trip', 'error');
    } finally {
      setUpdatingTrip(false);
    }
  }

  const activeTrip = stats.activeTrip;
  const isBusy = Boolean(activeTrip);

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* 1. Transporter Header Banner */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-primary/20 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/transport-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-emerald-950/80 backdrop-blur-[1px]" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Transporter Fleet Operations</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              Logistics & Cargo Dashboard
            </h1>

            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm">
              Manage your agricultural freight trips, accept local farm cargo, and provide verified delivery tracking for farmers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Truck Status</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isBusy ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                <span className="font-extrabold text-sm text-white">
                  {isBusy ? '🚨 Trip in Progress (Busy)' : '🟢 Available for Cargo'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={loadTransporterStats}
              disabled={loading}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
              title="Refresh Logistics Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Key Logistics Metrics (4 Stat Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed Trips */}
        <div className="card-harvest p-5 bg-white border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Completed Trips</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-text font-mono mt-1">
            {stats.totalTripsCompleted}
          </p>
          <span className="text-xs text-emerald-700 font-semibold">Verified Mandi Deliveries</span>
        </div>

        {/* Card 2: Active Ongoing Trips */}
        <div className={`card-harvest p-5 bg-white border shadow-xs space-y-1 ${isBusy ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-border'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Active Trips Running</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-text font-mono mt-1">
            {stats.activeTripsCount}
          </p>
          <span className={`text-xs font-semibold ${isBusy ? 'text-amber-700' : 'text-muted'}`}>
            {isBusy ? 'Currently on highway' : 'No active load'}
          </span>
        </div>

        {/* Card 3: Total Cargo Delivered */}
        <div className="card-harvest p-5 bg-white border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Cargo Transported</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-text font-mono mt-1">
            {stats.totalCargoDeliveredKg.toLocaleString()} <span className="text-sm font-normal text-muted">kg</span>
          </p>
          <span className="text-xs text-blue-700 font-semibold">
            {(stats.totalCargoDeliveredKg / 100).toFixed(1)} Quintals Farm Produce
          </span>
        </div>

        {/* Card 4: Freight Earnings */}
        <div className="card-harvest p-5 bg-white border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Total Freight Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-primary font-mono mt-1">
            {formatINR(stats.totalEarnings)}
          </p>
          <span className="text-xs text-emerald-700 font-semibold">Direct Driver Payouts</span>
        </div>
      </section>

      {/* 3. ACTIVE ONGOING TRIP SPOTLIGHT CARD (Strict Lock Feature) */}
      {isBusy && activeTrip ? (
        <section className="rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-6 sm:p-8 shadow-lg space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
                <Navigation className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="badge-tag bg-amber-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5">
                  Trip In Progress • Truck Locked
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Trip #{activeTrip.id}: {activeTrip.cropName} ({activeTrip.weightKg} kg)
                </h2>
                <p className="text-xs text-slate-600">
                  Destination: <span className="font-bold text-slate-900">{activeTrip.destinationMarket}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-xl border border-amber-200 text-amber-900">
                Gate Pass: {activeTrip.gatePassCode}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="rounded-2xl bg-white p-4 border border-amber-100 shadow-2xs space-y-1">
              <span className="text-muted font-bold uppercase text-[10px]">Farmer Contact</span>
              <p className="font-extrabold text-text text-sm">{activeTrip.farmerName}</p>
              <a
                href={`tel:${activeTrip.farmerPhone || '9999999991'}`}
                className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
              >
                <Phone className="w-3 h-3" />
                <span>{activeTrip.farmerPhone || '9999999991'}</span>
              </a>
            </div>

            <div className="rounded-2xl bg-white p-4 border border-amber-100 shadow-2xs space-y-1">
              <span className="text-muted font-bold uppercase text-[10px]">Pickup Location</span>
              <p className="font-extrabold text-text text-sm">{activeTrip.pickupLocation}</p>
              <span className="text-muted">Origin Farm</span>
            </div>

            <div className="rounded-2xl bg-white p-4 border border-amber-100 shadow-2xs space-y-1">
              <span className="text-muted font-bold uppercase text-[10px]">Estimated Transit Time</span>
              <p className="font-extrabold text-amber-900 text-sm font-mono">
                ~{Math.round((activeTrip.estimatedDurationMinutes || 150) / 60)} hrs {(activeTrip.estimatedDurationMinutes || 150) % 60} mins
              </p>
              <span className="text-muted">Expected Mandi Arrival</span>
            </div>

            <div className="rounded-2xl bg-white p-4 border border-amber-100 shadow-2xs space-y-1">
              <span className="text-muted font-bold uppercase text-[10px]">Freight Fee</span>
              <p className="font-black text-emerald-700 text-base font-mono">
                {formatINR(activeTrip.estimatedSharedCost)}
              </p>
              <span className="text-emerald-700 font-semibold">Payment on Mandi Gate Arrival</span>
            </div>
          </div>

          {/* Trip Progression Step Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-amber-200/80">
            <p className="text-xs text-amber-900 font-medium">
              ⚠️ <strong>Single-Trip Lock Active</strong>: You cannot accept new farmer requests while this delivery is active. Update status as you reach milestones.
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {activeTrip.status === 'accepted' && (
                <button
                  type="button"
                  disabled={updatingTrip}
                  onClick={() => handleProgressTrip(activeTrip.id, 'in_transit')}
                  className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md w-full sm:w-auto"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Depart with Cargo (Start In-Transit)</span>
                </button>
              )}

              {activeTrip.status === 'in_transit' && (
                <button
                  type="button"
                  disabled={updatingTrip}
                  onClick={() => handleProgressTrip(activeTrip.id, 'delivered')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md w-full sm:w-auto transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Cargo Delivered at Mandi Gate</span>
                </button>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vehicle Empty & Ready for Cargo</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Your Truck is Available for Next Mandi Run
            </h3>
            <p className="text-xs text-slate-600 max-w-xl">
              Local farmers in your district have harvest produce ready for pooled transport. Accept a booking to lock your next trip.
            </p>
          </div>

          <Link
            to="/transport"
            className="btn-primary py-3 px-8 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shrink-0"
          >
            <Truck className="w-4 h-4" />
            <span>Browse Open Farmer Cargo Requests</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* 4. Registered Vehicle Specification Card */}
      <section className="card-harvest p-6 bg-white border border-border shadow-xs space-y-4">
        <div className="border-b border-border/80 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Car className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-base text-text">Registered Fleet Vehicle Details</h3>
          </div>
          <Link to="/profile" className="text-xs font-bold text-primary hover:underline">
            Edit Vehicle Profile
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
            <span className="text-muted block text-[10px] uppercase font-bold">Vehicle Model</span>
            <span className="font-extrabold text-text text-sm mt-0.5 block">{stats.vehicleType}</span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
            <span className="text-muted block text-[10px] uppercase font-bold">Number Plate</span>
            <span className="font-extrabold text-primary text-sm font-mono mt-0.5 block">{stats.vehicleNumber}</span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
            <span className="text-muted block text-[10px] uppercase font-bold">Payload Capacity</span>
            <span className="font-extrabold text-text text-sm font-mono mt-0.5 block">{stats.capacityKg} kg</span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
            <span className="text-muted block text-[10px] uppercase font-bold">Official Verification</span>
            <span className="font-extrabold text-emerald-700 text-sm mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>APMC Certified</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
