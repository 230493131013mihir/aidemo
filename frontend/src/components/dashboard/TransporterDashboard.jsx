import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  Car,
  PlusCircle,
  Filter,
  Users,
  Layers,
  X,
  Check,
  CheckCheck,
  Calendar,
  Sparkles,
  HelpCircle,
  Tag,
  Bell
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

// Synthesizes a clean mobile SMS / chime alert tone using Web Audio API
function playBookingNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1: High crisp ping (880 Hz / A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Harmonious confirmation chime (1760 Hz / A6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.28);
    gain2.gain.setValueAtTime(0.32, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.warn('AudioContext alert tone:', err.message);
  }
}

const VEHICLE_TYPES = [
  'Mini Pickup',
  'Tata Ace / Mini Truck',
  'Small Goods Carrier',
  'Medium Goods Truck',
  'Large Goods Truck',
  'Refrigerated Vehicle'
];

const SPECIAL_HANDLINGS = [
  'Ventilated Mesh Bed',
  'Covered High-Side Body',
  'Active Cold Chain (0-4°C)',
  'Weather-Proof Dry Bulk Carrier',
  'Standard Agri Transport'
];

export default function TransporterDashboard() {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'shared-pools' | 'fleet'
  const prevRequestIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // Stats
  const [stats, setStats] = useState({
    totalTripsCompleted: 0,
    activeTripsCount: 0,
    totalCargoDeliveredKg: 0,
    totalEarnings: 0,
    vehicleType: 'Mahindra Bolero Maxi Truck',
    vehicleNumber: 'MH-12-RN-4921',
    capacityKg: 2200,
    isAvailable: true,
    activeTrip: null,
  });

  // Fleet & Vehicles
  const [myFleet, setMyFleet] = useState([]);
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: '',
    vehicleType: 'Mahindra Bolero Maxi Truck',
    capacityKg: '2000',
    capacityUnit: 'kg',
    supportedCrops: 'Tomato, Onion, Potato, Vegetables',
    specialHandling: 'Ventilated Mesh Bed',
    baseLocation: 'Pune, Maharashtra',
    supportedRoutes: 'Pune to Mumbai Vashi APMC, Nashik APMC',
    ratePerKm: '25',
    driverName: user?.name || 'Driver',
    driverPhone: user?.phone || '9876543210'
  });
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Incoming Requests & Filters
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [filterCrop, setFilterCrop] = useState('');
  const [filterVehicleType, setFilterVehicleType] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' | 'confirmed' | 'all'
  const [filterBookingType, setFilterBookingType] = useState('all'); // 'all' | 'individual' | 'shared'

  // Accept / Reject Modal State
  const [selectedRequestForAction, setSelectedRequestForAction] = useState(null);
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Shared Trips Pooling
  const [sharedTrips, setSharedTrips] = useState([]);
  const [loadingSharedTrips, setLoadingSharedTrips] = useState(false);
  const [selectedForGrouping, setSelectedForGrouping] = useState([]);
  const [groupVehicleId, setGroupVehicleId] = useState('');
  const [groupingTrip, setGroupingTrip] = useState(false);

  // Load Transporter Stats
  async function loadTransporterStats() {
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
    }
  }

  // Load My Registered Fleet
  async function loadMyFleet() {
    setLoadingFleet(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/vehicles/my-fleet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMyFleet(json.data);
        if (json.data.length > 0 && !assignedVehicleId) {
          setAssignedVehicleId(json.data[0].id);
          setGroupVehicleId(json.data[0].id);
        }
      }
    } catch (err) {
      console.warn('Could not load fleet:', err.message);
    } finally {
      setLoadingFleet(false);
    }
  }

  // Load Incoming Booking Requests
  async function loadIncomingRequests(isSilent = false) {
    if (!isSilent) setLoadingRequests(true);
    try {
      const params = new URLSearchParams();
      if (filterCrop) params.append('crop', filterCrop);
      if (filterVehicleType) params.append('vehicleType', filterVehicleType);
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      if (filterBookingType && filterBookingType !== 'all') params.append('bookingType', filterBookingType);

      const res = await fetch(`${API_BASE_URL}/api/transport/incoming-requests?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Detect newly arrived booking requests during live presentation
        if (!isInitialLoadRef.current && prevRequestIdsRef.current.size > 0) {
          const brandNewBookings = json.data.filter(
            (r) => !prevRequestIdsRef.current.has(r.id) && (r.status === 'pending' || r.status === 'open' || r.status === 'confirmed')
          );

          if (brandNewBookings.length > 0) {
            // 1. Play realistic audible SMS / chime tone
            playBookingNotificationChime();

            const latest = brandNewBookings[0];
            // 2. Pop up high-impact celebration toast alert
            showToast({
              type: 'celebrate',
              title: '🔔 New Produce Booking Alert!',
              message: `Farmer ${latest.farmerName} just booked ${latest.weightKg} kg ${latest.cropName} → ${latest.destinationMarket}! Fare: ${formatINR(latest.estimatedSharedCost || 425)}`,
              duration: 7000
            });

            // 3. Spoken voice announcement
            if ('speechSynthesis' in window) {
              try {
                window.speechSynthesis.cancel();
                const speech = new SpeechSynthesisUtterance(`New booking alert from ${latest.farmerName} for ${latest.cropName}.`);
                speech.rate = 1.0;
                window.speechSynthesis.speak(speech);
              } catch (_) {}
            }
          }
        }

        // Keep set of seen IDs synced
        json.data.forEach((r) => prevRequestIdsRef.current.add(r.id));
        isInitialLoadRef.current = false;

        setIncomingRequests(json.data);
      }
    } catch (err) {
      console.warn('Could not load incoming requests:', err.message);
    } finally {
      if (!isSilent) setLoadingRequests(false);
    }
  }

  // Load Shared Trips
  async function loadSharedTrips() {
    setLoadingSharedTrips(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/shared-trips`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSharedTrips(json.data);
      }
    } catch (err) {
      console.warn('Could not load shared trips:', err.message);
    } finally {
      setLoadingSharedTrips(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadTransporterStats();
      loadMyFleet();
      loadIncomingRequests(false);
      loadSharedTrips();

      // Dynamic auto-polling every 3 seconds to catch live bookings from other browser windows
      const pollInterval = setInterval(() => {
        loadIncomingRequests(true);
        loadTransporterStats();
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [token, filterCrop, filterVehicleType, filterStatus, filterBookingType]);

  // Handle Add Vehicle Submission
  async function handleAddVehicle(e) {
    e.preventDefault();
    setSavingVehicle(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(vehicleForm)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to add vehicle');

      showToast({
        type: 'celebrate',
        title: '🚚 Fleet Vehicle Registered!',
        message: `Registered ${json.data?.vehicleType} (${json.data?.registrationNumber}) with capacity ${json.data?.capacityKg} kg.`,
        duration: 5000
      });

      setShowAddVehicleModal(false);
      loadMyFleet();
      loadTransporterStats();
    } catch (err) {
      showToast({ type: 'error', title: 'Registration Failed', message: err.message });
    } finally {
      setSavingVehicle(false);
    }
  }

  // Handle Accept Booking
  async function handleAcceptBooking(bookingId) {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/bookings/${bookingId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId: assignedVehicleId || null
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to accept booking');

      showToast({
        type: 'celebrate',
        title: '✅ Booking Accepted!',
        message: json.message || 'Assigned vehicle and notified farmer.',
        duration: 4000
      });

      setSelectedRequestForAction(null);
      loadIncomingRequests();
      loadTransporterStats();
    } catch (err) {
      showToast({ type: 'error', title: 'Accept Failed', message: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  // Handle Reject Booking
  async function handleRejectBooking(bookingId) {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/bookings/${bookingId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectionReason || 'Capacity full / route unavailable' })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to reject booking');

      showToast({
        type: 'info',
        title: 'Booking Request Rejected',
        message: json.message || 'Farmer notified.'
      });

      setSelectedRequestForAction(null);
      setRejectionReason('');
      loadIncomingRequests();
    } catch (err) {
      showToast({ type: 'error', title: 'Action Failed', message: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  // Handle Progress Status (confirmed -> driver_assigned -> in_transit -> delivered)
  async function handleUpdateStatus(bookingId, status) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update status');

      showToast({
        type: 'success',
        title: status === 'delivered' ? '🏁 Cargo Delivered at APMC Mandi!' : '🛣️ Dispatched On The Road!',
        message: `Trip milestone progressed to ${status.toUpperCase()}.`
      });

      loadIncomingRequests();
      loadTransporterStats();
    } catch (err) {
      showToast({ type: 'error', title: 'Status Update Error', message: err.message });
    }
  }

  // Handle Grouping Farmers into a Shared Trip
  async function handleGroupSharedTrip() {
    if (selectedForGrouping.length < 2) {
      showToast({ type: 'error', title: 'Selection Needed', message: 'Select at least 2 compatible requests to group.' });
      return;
    }
    if (!groupVehicleId) {
      showToast({ type: 'error', title: 'Vehicle Required', message: 'Select a vehicle for the shared trip.' });
      return;
    }

    setGroupingTrip(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/shared-trips/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingIds: selectedForGrouping,
          vehicleId: Number(groupVehicleId)
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to group shared trip');

      showToast({
        type: 'celebrate',
        title: '🎉 Shared Trip Confirmed!',
        message: json.message,
        duration: 5000
      });

      setSelectedForGrouping([]);
      loadSharedTrips();
      loadIncomingRequests();
      loadTransporterStats();
    } catch (err) {
      showToast({ type: 'error', title: 'Grouping Error', message: err.message });
    } finally {
      setGroupingTrip(false);
    }
  }

  // Toggle selection for shared pooling
  const handleToggleSelectForGrouping = (id) => {
    setSelectedForGrouping((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Calculate combined cargo for selected pooling requests
  const selectedGroupingCargoKg = useMemo(() => {
    return incomingRequests
      .filter((r) => selectedForGrouping.includes(r.id))
      .reduce((sum, r) => sum + (r.weightKg || 0), 0);
  }, [incomingRequests, selectedForGrouping]);

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
              <span>Transporter Fleet Operations & Booking Hub</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              Logistics & Cargo Dashboard
            </h1>

            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm">
              Manage multiple fleet vehicles, filter incoming crop booking requests, accept individual loads, and group compatible farmers into shared trips.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddVehicleModal(true)}
              className="py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Vehicle to Fleet</span>
            </button>

            <button
              type="button"
              onClick={() => {
                loadTransporterStats();
                loadMyFleet();
                loadIncomingRequests();
              }}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors cursor-pointer"
              title="Refresh Logistics Stats"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Key Logistics Metrics (4 Stat Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Completed Trips</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">
            {stats.totalTripsCompleted}
          </p>
          <span className="text-xs text-emerald-700 font-semibold">Verified Mandi Deliveries</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Registered Fleet</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">
            {myFleet.length}
          </p>
          <span className="text-xs text-blue-700 font-semibold">Active Goods Carriers</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Cargo Transported</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">
            {stats.totalCargoDeliveredKg.toLocaleString('en-IN')} <span className="text-sm font-normal text-muted">kg</span>
          </p>
          <span className="text-xs text-emerald-700 font-semibold">Agricultural Produce</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Freight Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-primary font-mono mt-1">
            {formatINR(stats.totalEarnings)}
          </p>
          <span className="text-xs text-emerald-700 font-semibold">Direct Mandi Payouts</span>
        </div>
      </section>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-400" />
          <span>Incoming Requests ({incomingRequests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shared-pools')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'shared-pools'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>Shared Transport Pooling & Groups</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fleet')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'fleet'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Car className="w-4 h-4 text-blue-400" />
          <span>Fleet & Vehicle Management ({myFleet.length})</span>
        </button>
      </div>

      {/* 4. TAB CONTENT 1: INCOMING REQUESTS WITH FILTERS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-primary" />
                <span>Crop & Booking Filters</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setFilterCrop('');
                  setFilterVehicleType('');
                  setFilterStatus('pending');
                  setFilterBookingType('all');
                }}
                className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-muted font-bold block mb-1">Crop Type</label>
                <input
                  type="text"
                  placeholder="e.g. Tomato, Onion, Wheat"
                  value={filterCrop}
                  onChange={(e) => setFilterCrop(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted font-bold block mb-1">Vehicle Type</label>
                <select
                  value={filterVehicleType}
                  onChange={(e) => setFilterVehicleType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-2 py-1.5 text-xs font-semibold outline-none focus:border-primary bg-white"
                >
                  <option value="">All Vehicle Types</option>
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted font-bold block mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-2 py-1.5 text-xs font-semibold outline-none focus:border-primary bg-white"
                >
                  <option value="pending">Pending Requests</option>
                  <option value="confirmed">Confirmed Bookings</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered / Completed</option>
                  <option value="all">All Statuses</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted font-bold block mb-1">Booking Type</label>
                <select
                  value={filterBookingType}
                  onChange={(e) => setFilterBookingType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-2 py-1.5 text-xs font-semibold outline-none focus:border-primary bg-white"
                >
                  <option value="all">Individual & Shared</option>
                  <option value="shared">Shared Transport Only</option>
                  <option value="individual">Individual Dedicated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Incoming Requests Cards List */}
          {loadingRequests ? (
            <div className="p-8 text-center text-xs text-muted">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
              <span>Loading incoming requests...</span>
            </div>
          ) : incomingRequests.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <Truck className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Booking Requests Found</h4>
              <p className="text-xs text-muted">
                Try adjusting the filters above. New farmer requests will appear here dynamically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        #{req.bookingId || `REQ-${req.id}`}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {req.cropName} ({req.weightKg?.toLocaleString('en-IN')} kg)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {req.bookingType === 'shared' ? 'Shared Transport Pool' : 'Individual Dedicated'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        Fare: {formatINR(req.estimatedSharedCost || 1200)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted block text-[10px]">Farmer & Contact</span>
                      <span className="font-bold text-slate-900 block truncate">{req.farmerName}</span>
                      <span className="text-[11px] text-primary font-mono">{req.farmerPhone || 'Phone shared on accept'}</span>
                    </div>

                    <div>
                      <span className="text-muted block text-[10px]">Route (Origin ➔ Mandi)</span>
                      <span className="font-bold text-slate-800 block truncate">
                        {req.pickupLocation} ➔ {req.destinationMarket}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted block text-[10px]">Pickup Date</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {req.pickupDate}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted block text-[10px]">Vehicle Requirement</span>
                      <span className="font-bold text-slate-800 block truncate">
                        {req.vehicleType || 'Any suitable'}
                      </span>
                    </div>
                  </div>

                  {/* Actions for Pending Requests */}
                  {req.status === 'pending' || req.status === 'open' ? (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRequestForAction({ type: 'reject', booking: req })}
                        className="py-1.5 px-3 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRequestForAction({ type: 'accept', booking: req })}
                        className="btn-primary py-1.5 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Assign Vehicle</span>
                      </button>
                    </div>
                  ) : req.status === 'confirmed' || req.status === 'driver_assigned' ? (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCheck className="w-4 h-4" />
                        <span>Accepted • Driver {req.driverName || 'Assigned'} ({req.vehicleNumber})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(req.id, 'in_transit')}
                        className="btn-primary py-1 px-3 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Start Transit (Depart)
                      </button>
                    </div>
                  ) : req.status === 'in_transit' ? (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-purple-700 font-semibold flex items-center gap-1 animate-pulse">
                        <Navigation className="w-4 h-4" />
                        <span>In Transit to {req.destinationMarket}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(req.id, 'delivered')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-1 px-3 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Mark Delivered at Mandi
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT 2: SHARED TRANSPORT POOLING & TRIP GROUPING */}
      {activeTab === 'shared-pools' && (
        <div className="space-y-4">
          {/* Trip Grouping Tool Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white shadow-xl border border-emerald-800/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Shared Trip Builder</span>
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Group Compatible Farmer Bookings into a Single Vehicle Trip
                </h3>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-300 block">Selected Combined Cargo</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {selectedGroupingCargoKg} kg ({selectedForGrouping.length} Farmers)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-300 block mb-1">Assign Fleet Vehicle *</label>
                <select
                  value={groupVehicleId}
                  onChange={(e) => setGroupVehicleId(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white font-semibold outline-none focus:border-primary"
                >
                  <option value="">Select Vehicle...</option>
                  {myFleet.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleType} ({v.registrationNumber}) • {v.capacityKg} kg
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  disabled={groupingTrip || selectedForGrouping.length < 2 || !groupVehicleId}
                  onClick={handleGroupSharedTrip}
                  className={`btn-primary py-2.5 px-6 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md w-full justify-center ${
                    groupingTrip || selectedForGrouping.length < 2 || !groupVehicleId
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  {groupingTrip ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validating Cargo & Grouping...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Confirm Shared Trip Group ({selectedForGrouping.length} Farmers)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* List of Shared Trip Candidate Bookings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Farmers Requesting Shared Transport to Group Together
            </h4>

            {incomingRequests.filter((r) => r.bookingType === 'shared').length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-muted">
                No active shared transport requests awaiting pooling.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incomingRequests
                  .filter((r) => r.bookingType === 'shared')
                  .map((req) => {
                    const isChecked = selectedForGrouping.includes(req.id);
                    return (
                      <div
                        key={req.id}
                        onClick={() => handleToggleSelectForGrouping(req.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? 'border-primary bg-emerald-50/60 shadow-xs ring-1 ring-primary'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 accent-primary rounded cursor-pointer"
                        />
                        <div className="flex-1 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900">
                              {req.farmerName} • {req.cropName}
                            </span>
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              {req.weightKg} kg
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px]">
                            Route: {req.pickupLocation} ➔ {req.destinationMarket}
                          </p>
                          <span className="text-[10px] text-muted font-mono block">
                            Pickup Date: {req.pickupDate} • Fare: {formatINR(req.estimatedSharedCost || 1200)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: FLEET & VEHICLE MANAGEMENT */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Registered Fleet Vehicles ({myFleet.length})
              </h3>
              <p className="text-xs text-muted">
                Vehicles registered here are verified in the database and visible to local farmers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddVehicleModal(true)}
              className="btn-primary py-2 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register New Vehicle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myFleet.map((vehicle) => (
              <div
                key={vehicle.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-black text-slate-900 text-sm">
                      {vehicle.vehicleType}
                    </h4>
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {vehicle.registrationNumber}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                    {vehicle.specialHandling}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted text-[11px]">Payload Capacity:</span>
                    <strong className="text-slate-900 font-mono">{vehicle.capacityKg} kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted text-[11px]">Freight Rate:</span>
                    <strong className="text-slate-900 font-mono">₹{vehicle.ratePerKm}/km</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted text-[11px]">Driver:</span>
                    <span className="text-slate-800 font-semibold">{vehicle.driverName} ({vehicle.driverPhone})</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>APMC Verified</span>
                  </span>
                  <span className="text-slate-500 font-medium text-[11px]">
                    {vehicle.isAvailable ? '🟢 Available' : '🔴 In Service'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD VEHICLE TO FLEET */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-slate-900">
                  Register New Vehicle in Fleet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVehicleModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Registration Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-12-AB-1234"
                    value={vehicleForm.registrationNumber}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold uppercase outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Vehicle Type *</label>
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-2 py-2 font-semibold outline-none focus:border-primary bg-white"
                  >
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payload Capacity (kg) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="50"
                    value={vehicleForm.capacityKg}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, capacityKg: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Rate per km (₹) *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={vehicleForm.ratePerKm}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, ratePerKm: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Special Handling / Body Type</label>
                <select
                  value={vehicleForm.specialHandling}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, specialHandling: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-2 py-2 font-semibold outline-none focus:border-primary bg-white"
                >
                  {SPECIAL_HANDLINGS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Supported Crops / Cargo Types</label>
                <input
                  type="text"
                  value={vehicleForm.supportedCrops}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, supportedCrops: e.target.value })}
                  placeholder="e.g. Tomato, Onion, Potato, Vegetables"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Driver Name *</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.driverName}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Driver Phone *</label>
                  <input
                    type="tel"
                    required
                    value={vehicleForm.driverPhone}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVehicle}
                  className="btn-primary py-2 px-5 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {savingVehicle ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Register Vehicle</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACCEPT OR REJECT REQUEST */}
      {selectedRequestForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {selectedRequestForAction.type === 'accept' ? 'Accept Booking Request' : 'Reject Booking Request'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRequestForAction(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Farmer:</span>
                <span className="font-bold text-slate-900">{selectedRequestForAction.booking.farmerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Cargo:</span>
                <span className="font-bold text-slate-900">
                  {selectedRequestForAction.booking.weightKg} kg {selectedRequestForAction.booking.cropName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Route:</span>
                <span className="font-semibold text-slate-800">
                  {selectedRequestForAction.booking.pickupLocation} ➔ {selectedRequestForAction.booking.destinationMarket}
                </span>
              </div>
            </div>

            {selectedRequestForAction.type === 'accept' ? (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Assign Vehicle from Fleet *</label>
                  <select
                    value={assignedVehicleId}
                    onChange={(e) => setAssignedVehicleId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold outline-none focus:border-primary bg-white"
                  >
                    {myFleet.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleType} ({v.registrationNumber}) • Capacity {v.capacityKg} kg
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRequestForAction(null)}
                    className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAcceptBooking(selectedRequestForAction.booking.id)}
                    className="btn-primary py-2 px-5 rounded-xl font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {actionLoading ? 'Assigning...' : 'Confirm Acceptance'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Reason for Rejection</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. All trucks fully booked on this date, or destination route out of coverage."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-medium outline-none focus:border-primary"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRequestForAction(null)}
                    className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRejectBooking(selectedRequestForAction.booking.id)}
                    className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {actionLoading ? 'Rejecting...' : 'Reject Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
