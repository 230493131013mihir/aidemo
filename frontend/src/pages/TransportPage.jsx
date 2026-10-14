import React, { useEffect, useMemo, useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  Truck, 
  Users, 
  Sparkles, 
  PlusCircle, 
  ShieldCheck, 
  Volume2, 
  Share2, 
  Check, 
  Car, 
  Clock, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DigitalGatePassModal from '../components/transport/DigitalGatePassModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const DEFAULT_POOLS = [
  { id: 101, driver: 'Suresh Parmar', route: 'Surat APMC', date: '2026-10-14', vehicle: 'Mahindra Bolero Maxi Truck', vehicleNumber: 'GJ-05-BX-4921', capacityKg: 2200, usedKg: 950, cost: 2200, farmers: 2 },
  { id: 102, driver: 'Kiran Vaghela', route: 'Ahmedabad APMC', date: '2026-10-14', vehicle: 'Tata 407 LPT', vehicleNumber: 'GJ-01-ET-7814', capacityKg: 2800, usedKg: 1400, cost: 4600, farmers: 3 },
  { id: 103, driver: 'Mahesh Patil', route: 'Pune APMC', date: '2026-10-15', vehicle: 'Eicher Pro 2049', vehicleNumber: 'MH-12-AQ-3392', capacityKg: 3500, usedKg: 1900, cost: 6800, farmers: 3 },
  { id: 104, driver: 'Amit Solanki', route: 'Rajkot APMC', date: '2026-10-15', vehicle: 'Tata Ace Gold', vehicleNumber: 'GJ-03-MK-9912', capacityKg: 1600, usedKg: 800, cost: 3100, farmers: 2 },
  { id: 105, driver: 'Rajesh Patel', route: 'Mehsana APMC', date: '2026-10-14', vehicle: 'Ashok Leyland Dost', vehicleNumber: 'GJ-02-CD-5541', capacityKg: 2000, usedKg: 700, cost: 2600, farmers: 2 },
  { id: 106, driver: 'Nitin Deshmukh', route: 'Nashik APMC', date: '2026-10-15', vehicle: 'Tata 407 LPT', vehicleNumber: 'MH-15-GH-8821', capacityKg: 3000, usedKg: 1100, cost: 4900, farmers: 2 },
  { id: 107, driver: 'Devendra Yadav', route: 'Indore APMC', date: '2026-10-15', vehicle: 'Mahindra Bolero Maxi', vehicleNumber: 'MP-09-JK-1290', capacityKg: 2400, usedKg: 800, cost: 3800, farmers: 2 },
  { id: 108, driver: 'Harpreet Singh', route: 'Azadpur APMC (Delhi)', date: '2026-10-15', vehicle: 'Eicher Pro 2049', vehicleNumber: 'DL-01-AB-4412', capacityKg: 4000, usedKg: 1500, cost: 7200, farmers: 4 },
];

function formatINR(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

// Speak aloud helper
function speakAloud(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

export default function TransportPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const isUserTransporter = user?.role === 'transporter';
  const [activeTab, setActiveTab] = useState(isUserTransporter ? 'transporter' : 'farmer');

  // Farmer form state
  const [farmerName, setFarmerName] = useState(user?.name || '');
  const [cropName, setCropName] = useState('Tomato');
  const [pickupLocation, setPickupLocation] = useState(
    user?.FarmerProfile?.district ? `${user.FarmerProfile.district}, Gujarat` : 'Surat, Gujarat'
  );
  const [destination, setDestination] = useState('Surat APMC');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState(500);
  const [myRequests, setMyRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Transporter state
  const [transportersList, setTransportersList] = useState([]);
  const [openCargoList, setOpenCargoList] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loadingActiveTrip, setLoadingActiveTrip] = useState(false);
  const [updatingTripMilestone, setUpdatingTripMilestone] = useState(false);

  const [vehicleForm, setVehicleForm] = useState({
    driverName: user?.name || '',
    phone: user?.phone || '',
    vehicleType: 'Mahindra Bolero Maxi Truck',
    vehicleNumber: 'GJ-05-BX-4921',
    capacityKg: '2200',
    baseMandi: 'Surat APMC',
    ratePerKm: '25',
  });
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Modal for Digital Mandi Gate Pass
  const [selectedGatePass, setSelectedGatePass] = useState(null);

  // Sync inputs when user profile loads
  useEffect(() => {
    if (user) {
      if (user.name) {
        setFarmerName(user.name);
        setVehicleForm((prev) => ({ ...prev, driverName: user.name, phone: user.phone || '' }));
      }
      if (user.FarmerProfile) {
        if (user.FarmerProfile.mainCrop) setCropName(user.FarmerProfile.mainCrop);
        if (user.FarmerProfile.currentHarvestKg) setWeight(Number(user.FarmerProfile.currentHarvestKg));
        if (user.FarmerProfile.district) {
          const loc = `${user.FarmerProfile.district}${user.FarmerProfile.state ? `, ${user.FarmerProfile.state}` : ''}`;
          setPickupLocation(loc);
          setDestination(`${user.FarmerProfile.district} APMC`);
        }
      }
      if (user.role === 'transporter') {
        setActiveTab('transporter');
      }
    }
  }, [user]);

  async function loadMyRequests() {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/my-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (response.ok && payload.success) {
        setMyRequests(payload.data || []);
      }
    } catch (err) {
      console.warn('Unable to load requests:', err.message);
    }
  }

  async function loadTransporters() {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/transporters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (response.ok && payload.success) {
        setTransportersList(payload.data || []);
      }
    } catch (err) {
      console.warn('Unable to load transporters:', err.message);
    }
  }

  async function loadOpenCargo() {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/open-cargo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (response.ok && payload.success) {
        setOpenCargoList(payload.data || []);
      }
    } catch (err) {
      console.warn('Unable to load open cargo:', err.message);
    }
  }

  async function loadActiveTrip() {
    if (!token) return;
    setLoadingActiveTrip(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/active-trip`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (response.ok && payload.success) {
        setActiveTrip(payload.hasActiveTrip ? payload.activeTrip : null);
      }
    } catch (err) {
      console.warn('Unable to load active trip:', err.message);
    } finally {
      setLoadingActiveTrip(false);
    }
  }

  useEffect(() => {
    loadMyRequests();
    loadTransporters();
    loadOpenCargo();
    loadActiveTrip();
  }, [token]);

  // Handle milestone progression by transporter: accepted -> in_transit -> delivered
  async function handleProgressTrip(tripId, nextStatus) {
    if (!token) return;
    setUpdatingTripMilestone(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/requests/${tripId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nextStatus }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || 'Milestone update failed');

      showToast({
        type: 'success',
        title: nextStatus === 'delivered' ? '🏁 Cargo Delivered at APMC Mandi!' : '🛣️ Dispatched On The Road!',
        message: payload.message || `Delivery status advanced to ${nextStatus}. Farmer notified!`,
      });

      await loadActiveTrip();
      await loadOpenCargo();
      await loadMyRequests();
    } catch (err) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setUpdatingTripMilestone(false);
    }
  }

  // Combined pools: static pools + live transporters registered in MySQL
  const allPools = useMemo(() => {
    const livePools = transportersList.map((tr) => ({
      id: `live-${tr.id}`,
      driver: tr.driverName,
      route: tr.baseMandi,
      date: new Date().toISOString().slice(0, 10),
      vehicle: tr.vehicleType,
      vehicleNumber: tr.vehicleNumber,
      capacityKg: tr.capacityKg,
      usedKg: Math.round(tr.capacityKg * 0.4),
      cost: tr.ratePerKm * 85, // estimated base route cost
      farmers: 1,
      isLiveRegistered: true,
    }));

    return [...DEFAULT_POOLS, ...livePools];
  }, [transportersList]);

  // Filtered pool matches with robust fallback
  const matches = useMemo(() => {
    const dest = destination.trim().toLowerCase();
    const filtered = allPools.filter((pool) => {
      const destinationMatch = !dest || pool.route.toLowerCase().includes(dest);
      const capacityMatch = pool.capacityKg - pool.usedKg >= Number(weight || 0);
      return destinationMatch && capacityMatch;
    });

    if (filtered.length > 0) return filtered;
    // If exact destination didn't match, return all available trucks in region
    return allPools.filter((pool) => pool.capacityKg - pool.usedKg >= Number(weight || 0));
  }, [destination, weight, allPools]);

  // Book dedicated transport request
  async function saveTransportRequest(e) {
    if (e) e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      const errMsg = 'Please login to your farmer account first to book transport.';
      setError(errMsg);
      showToast({ type: 'error', title: 'Login Required', message: errMsg });
      return;
    }

    if (!farmerName.trim() || !cropName.trim() || !pickupLocation.trim()) {
      const errMsg = 'Please fill in farmer name, crop, and pickup location.';
      setError(errMsg);
      showToast({ type: 'error', title: 'Missing Information', message: errMsg });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          farmerName: farmerName.trim(),
          cropName: cropName.trim(),
          pickupLocation: pickupLocation.trim(),
          destinationMarket: destination.trim(),
          pickupDate: date,
          weightKg: Number(weight),
          vehicleType: 'any',
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || 'Unable to save request');

      setMessage('Transport request booked and saved in MySQL.');
      showToast({
        type: 'celebrate',
        title: '🚚 Transport Request Confirmed!',
        message: `Saved ${weight} kg of ${cropName} heading to ${destination}. Digital Mandi Gate Pass Generated!`,
        duration: 5000,
      });

      // Auto-open gate pass modal
      setSelectedGatePass(payload.data);
      await loadMyRequests();
      await loadOpenCargo();
    } catch (err) {
      setError(err.message || 'Unable to save transport request');
      showToast({ type: 'error', title: 'Booking Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  // Join shared vehicle pool
  async function handleJoinPool(pool) {
    if (!token) {
      showToast({
        type: 'error',
        title: 'Login Required',
        message: 'Please login first to join shared vehicle pools.',
      });
      return;
    }

    const totalFarmers = pool.farmers + 1;
    const sharedCost = Math.round(pool.cost / totalFarmers);
    const saving = pool.cost - sharedCost;

    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          farmerName: farmerName || user?.name || 'Farmer',
          driverName: pool.driver,
          cropName: cropName || 'Produce',
          pickupLocation: pickupLocation || 'Surat, Gujarat',
          destinationMarket: pool.route,
          pickupDate: pool.date,
          weightKg: Number(weight) || 500,
          vehicleType: pool.vehicle,
          vehicleNumber: pool.vehicleNumber || 'GJ-05-BX-4921',
          estimatedSharedCost: sharedCost,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || 'Pool join failed');

      showToast({
        type: 'celebrate',
        title: '🎉 Shared Slot Booked & Confirmed!',
        message: `Reserved space on ${pool.vehicle} with driver ${pool.driver}. Estimated cost: ${formatINR(sharedCost)} (Saved ~${formatINR(saving)}!). Gate pass issued.`,
        duration: 5000,
      });

      // Auto open gate pass modal
      setSelectedGatePass(payload.data);
      await loadMyRequests();
      await loadOpenCargo();
    } catch (err) {
      showToast({ type: 'error', title: 'Booking Failed', message: err.message });
    }
  }

  // Register vehicle for transporter
  async function handleRegisterVehicle(e) {
    e.preventDefault();
    if (!token) return;
    setSavingVehicle(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/register-vehicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(vehicleForm),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || 'Failed to register vehicle');

      showToast({
        type: 'celebrate',
        title: '🚚 Fleet Vehicle Registered!',
        message: `Your ${vehicleForm.vehicleType} (${vehicleForm.vehicleNumber}) is now active in MySQL. Farmers can now see and book your truck.`,
        duration: 5000,
      });

      await loadTransporters();
    } catch (err) {
      showToast({ type: 'error', title: 'Registration Failed', message: err.message });
    } finally {
      setSavingVehicle(false);
    }
  }

  // Transporter accepts a cargo request (Strict Single-Trip Lock)
  async function handleAcceptCargo(request) {
    if (!token) return;

    if (activeTrip) {
      showToast({
        type: 'error',
        title: '🔒 Single-Trip Lock Active',
        message: `You currently have an active delivery to ${activeTrip.destinationMarket}. Under transport safety rules, complete this delivery before accepting another load.`,
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/requests/${request.id}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          driverName: user?.name || vehicleForm.driverName || 'Assigned Driver',
          driverPhone: user?.phone || vehicleForm.phone || '9876543210',
          vehicleType: vehicleForm.vehicleType || 'Mahindra Bolero Maxi Truck',
          vehicleNumber: vehicleForm.vehicleNumber || 'GJ-05-BX-4921',
          estimatedDurationMinutes: request.estimatedDurationMinutes || 120,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || 'Failed to accept trip');

      showToast({
        type: 'celebrate',
        title: '🚚 Trip Accepted & Assigned!',
        message: `Accepted cargo for ${request.farmerName} (${request.weightKg} kg ${request.cropName} to ${request.destinationMarket}). Single-trip lock engaged!`,
        duration: 5000,
      });

      await loadActiveTrip();
      await loadOpenCargo();
      await loadMyRequests();
    } catch (err) {
      showToast({ type: 'error', title: 'Accept Failed', message: err.message });
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
      {/* Digital Mandi Gate Pass Modal */}
      <DigitalGatePassModal
        isOpen={!!selectedGatePass}
        booking={selectedGatePass}
        onClose={() => setSelectedGatePass(null)}
      />

      {/* Top Banner with Photographic Background */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-900/30 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/transport-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-emerald-950/70 backdrop-blur-[1px]" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Smart Agritech Logistics & Pooling</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              Shared Vehicle Pooling & Transporter Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm">
              Split freight expenses by sharing trucks to APMC mandis. Includes automatic verifiable Digital Mandi Gate Passes with QR verification.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="p-1.5 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shrink-0 shadow-lg">
            <button
              type="button"
              onClick={() => setActiveTab('farmer')}
              className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'farmer'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Farmer Pool Booking</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transporter')}
              className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'transporter'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Transporter Console</span>
            </button>
          </div>
        </div>
      </section>

      {/* FARMER TAB CONTENT */}
      {activeTab === 'farmer' && (
        <>
          {/* Booking / Posting Form */}
          <form
            onSubmit={saveTransportRequest}
            className="rounded-3xl border border-border bg-white p-6 shadow-sm space-y-4"
          >
            <div className="border-b border-border/80 pb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-primary" />
                <span>Book Transport / Dispatch Produce</span>
              </h2>
              <span className="text-xs text-muted font-mono">Persists in MySQL Database</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Farmer Name *</span>
                <input
                  required
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                  placeholder="e.g. Mihir Jadav"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Crop Commodity *</span>
                <input
                  required
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                  placeholder="e.g. Tomato, Onion, Potato"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Pickup Location *</span>
                <input
                  required
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                  placeholder="e.g. Surat, Gujarat"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Destination APMC *</span>
                <input
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                  placeholder="e.g. Surat APMC, Ahmedabad APMC"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Dispatch Date *</span>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Load Weight (kg) *</span>
                <input
                  type="number"
                  min="10"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                  placeholder="500"
                />
              </label>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/80">
              <div className="text-xs text-muted">
                Estimated Shared Logistics Rate:{' '}
                <span className="font-bold text-text font-mono text-sm">
                  {formatINR(Math.max(500, Math.round((Number(weight) / 1000) * 1800)))}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {message && (
                  <span className="text-xs text-success font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {message}
                  </span>
                )}
                {error && (
                  <span className="text-xs text-error font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2.5 px-6 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{submitting ? 'Connecting...' : 'Book & Issue Gate Pass'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Available Shared Pooling Matches */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Live Available Truck Pools ({matches.length} routes found)</span>
              </h2>
              <span className="text-xs text-muted">Instant Slot Reservation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((pool) => {
                const available = pool.capacityKg - pool.usedKg;
                const totalFarmers = pool.farmers + 1;
                const sharedCost = Math.round(pool.cost / totalFarmers);
                const soloCost = pool.cost;
                const saving = soloCost - sharedCost;

                return (
                  <article
                    key={pool.id}
                    className="rounded-3xl border border-border bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 hover:shadow-md transition-all relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-text">{pool.vehicle}</h3>
                          {pool.isLiveRegistered && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Verified Transporter
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          Driver: <span className="font-bold text-text">{pool.driver}</span> • Reg:{' '}
                          <span className="font-mono">{pool.vehicleNumber || 'GJ-05-TR-2026'}</span>
                        </p>
                      </div>

                      <span className="badge-tag bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
                        {available} kg available
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 p-2.5 flex items-center gap-2 border border-slate-200">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-semibold truncate">{pool.route}</span>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2.5 flex items-center gap-2 border border-slate-200">
                        <Users className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-semibold">{pool.farmers} Farmers Joined</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-primary/20 bg-primary-50/70 p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-muted uppercase font-bold tracking-wider">Your Shared Cost</p>
                        <p className="text-xl font-black text-primary font-mono">{formatINR(sharedCost)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-emerald-800 font-bold bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300">
                          Save {formatINR(saving)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleJoinPool(pool)}
                        className="btn-primary flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Reserve Shared Slot & Get Pass</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          speakAloud(
                            `Vehicle: ${pool.vehicle}. Driver: ${pool.driver}. Heading to ${pool.route}. Shared rate: ${sharedCost} rupees. You save ${saving} rupees.`
                          )
                        }
                        title="Listen to Trip Details"
                        className="p-2.5 rounded-xl border border-border bg-slate-50 hover:bg-slate-100 text-muted hover:text-text transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* My Saved Transport Bookings (MySQL) */}
          <section className="rounded-3xl border border-border bg-white shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-text">My Live Transport Bookings & Tracking</h2>
                <p className="text-[11px] text-muted">Stored in MySQL • Real-time driver updates and digital mandi gate passes</p>
              </div>
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                {myRequests.length} recorded
              </span>
            </div>

            {myRequests.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted">
                No transport bookings yet. Book a shared slot above to see your real confirmation and digital gate pass.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {myRequests.map((req) => {
                  const isAccepted = req.status === 'accepted' || req.status === 'in_transit' || req.status === 'delivered';
                  const isInTransit = req.status === 'in_transit' || req.status === 'delivered';
                  const isDelivered = req.status === 'delivered';

                  return (
                    <div
                      key={req.id}
                      className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Top Bar: Cargo & Status Pill */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary/20 text-primary flex items-center justify-center font-bold">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-text">{req.cropName}</h3>
                              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                {req.weightKg} kg ({(req.weightKg / 100).toFixed(1)} Qtl)
                              </span>
                            </div>
                            <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{req.pickupLocation}</span>
                              <ArrowRight className="w-3 h-3 text-muted shrink-0" />
                              <span className="font-semibold text-text">{req.destinationMarket}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              isDelivered
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isInTransit
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : isAccepted
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {isDelivered
                              ? '🏁 Delivered at APMC'
                              : isInTransit
                              ? '🛣️ On The Road (In Transit)'
                              : isAccepted
                              ? '🚚 Driver Assigned & En Route'
                              : '⏳ Waiting for Driver Pickup'}
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedGatePass(req)}
                            className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mandi Gate Pass</span>
                          </button>
                        </div>
                      </div>

                      {/* Transporter Details Card (Who booked/accepted the transport) */}
                      <div className="rounded-2xl border border-border/80 bg-slate-50/80 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] text-muted uppercase font-semibold">Assigned Transporter</span>
                          <p className="font-bold text-sm text-text mt-0.5">
                            {req.driverName ? req.driverName : 'Driver pending assignment'}
                          </p>
                          {req.driverPhone ? (
                            <a
                              href={`tel:${req.driverPhone}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline font-bold font-mono mt-0.5"
                            >
                              <Phone className="w-3 h-3" />
                              <span>+91 {req.driverPhone}</span>
                            </a>
                          ) : (
                            <span className="text-muted text-[11px]">Phone shared upon assignment</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[11px] text-muted uppercase font-semibold">Vehicle & Registration</span>
                          <p className="font-bold text-text mt-0.5">
                            {req.vehicleType || 'Commercial Farm Truck'}
                          </p>
                          <span className="font-mono text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                            {req.vehicleNumber || 'Plate Assigned on Pickup'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] text-muted uppercase font-semibold">Est. Arrival Time</span>
                          <p className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>~{req.estimatedDurationMinutes || 120} Mins transit time</span>
                          </p>
                          <p className="text-[11px] text-muted mt-0.5">
                            Gate Pass: <span className="font-mono font-bold text-primary">{req.gatePassCode}</span>
                          </p>
                        </div>
                      </div>

                      {/* 4-Step Live Tracking Stepper */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between relative">
                          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 z-0"
                            style={{
                              width: isDelivered ? '100%' : isInTransit ? '66%' : isAccepted ? '33%' : '0%',
                            }}
                          />

                          {/* Step 1: Requested */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                              ✓
                            </div>
                            <span className="text-[11px] font-bold text-text mt-1">1. Requested</span>
                            <span className="text-[10px] text-muted">{req.pickupDate}</span>
                          </div>

                          {/* Step 2: Driver Assigned */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                                isAccepted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isAccepted ? '✓' : '2'}
                            </div>
                            <span className={`text-[11px] font-bold mt-1 ${isAccepted ? 'text-text' : 'text-muted'}`}>
                              2. Driver Assigned
                            </span>
                            <span className="text-[10px] text-muted truncate max-w-[100px]">
                              {req.driverName ? req.driverName.split(' ')[0] : 'Pending'}
                            </span>
                          </div>

                          {/* Step 3: In Transit */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                                isInTransit ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isInTransit ? '✓' : '3'}
                            </div>
                            <span className={`text-[11px] font-bold mt-1 ${isInTransit ? 'text-text' : 'text-muted'}`}>
                              3. In Transit
                            </span>
                            <span className="text-[10px] text-muted">
                              {isInTransit ? 'On Route' : 'Awaiting Dispatch'}
                            </span>
                          </div>

                          {/* Step 4: Delivered */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                                isDelivered ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isDelivered ? '✓' : '4'}
                            </div>
                            <span className={`text-[11px] font-bold mt-1 ${isDelivered ? 'text-emerald-700 font-extrabold' : 'text-muted'}`}>
                              4. Delivered
                            </span>
                            <span className="text-[10px] text-muted">{req.destinationMarket.split(' ')[0]} Mandi</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* TRANSPORTER CONSOLE TAB CONTENT */}
      {activeTab === 'transporter' && (
        <div className="space-y-6">
          {/* Active Delivery Card with Single-Trip Lock */}
          {activeTrip && (
            <section className="rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-6 sm:p-7 shadow-xl space-y-5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold">
                    <Truck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        🔒 Single-Trip Lock Active
                      </span>
                      <span className="text-xs text-slate-300 font-mono">Trip #{activeTrip.id}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                      Ongoing Delivery: {activeTrip.cropName} ({activeTrip.weightKg} kg)
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                      activeTrip.status === 'in_transit'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    }`}
                  >
                    {activeTrip.status === 'in_transit' ? '🛣️ Currently In Transit' : '🚚 Driver Assigned & Loading'}
                  </span>
                </div>
              </div>

              {/* Farmer and Route Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Farmer Contact</span>
                  <p className="font-extrabold text-sm text-white">{activeTrip.farmerName}</p>
                  <a
                    href={`tel:${activeTrip.farmerPhone || '9876543210'}`}
                    className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold font-mono"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+91 {activeTrip.farmerPhone || '9876543210'}</span>
                  </a>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Pickup Location</span>
                  <p className="font-bold text-white flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{activeTrip.pickupLocation}</span>
                  </p>
                  <span className="text-[11px] text-slate-400">Scheduled: {activeTrip.pickupDate}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Destination APMC</span>
                  <p className="font-bold text-emerald-400 flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{activeTrip.destinationMarket}</span>
                  </p>
                  <span className="text-[11px] text-slate-400">Pass: {activeTrip.gatePassCode}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Est. Travel Time</span>
                  <p className="font-mono font-extrabold text-sm text-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{activeTrip.estimatedDurationMinutes || 120} Minutes</span>
                  </p>
                  <span className="text-[11px] text-slate-400">
                    Shared Fare: ~{formatINR(activeTrip.estimatedSharedCost || 1800)}
                  </span>
                </div>
              </div>

              {/* Status Milestone Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Advance the shipment stage to inform the farmer in real time.
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  {activeTrip.status === 'accepted' && (
                    <button
                      type="button"
                      disabled={updatingTripMilestone}
                      onClick={() => handleProgressTrip(activeTrip.id, 'in_transit')}
                      className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>{updatingTripMilestone ? 'Updating...' : 'Mark Dispatched & In Transit 🛣️'}</span>
                    </button>
                  )}

                  {activeTrip.status === 'in_transit' && (
                    <button
                      type="button"
                      disabled={updatingTripMilestone}
                      onClick={() => handleProgressTrip(activeTrip.id, 'delivered')}
                      className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{updatingTripMilestone ? 'Completing...' : 'Confirm Delivery at Mandi 🏁'}</span>
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Vehicle Registration Card */}
          <form
            onSubmit={handleRegisterVehicle}
            className="rounded-3xl border border-border bg-white p-6 shadow-sm space-y-4"
          >
            <div className="border-b border-border/80 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  <span>Register or Update Vehicle Fleet</span>
                </h2>
                <p className="text-xs text-muted">
                  Make your vehicle available to hundreds of local farmers seeking APMC mandi freight.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                MySQL Fleet Synced
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Driver / Owner Name *</span>
                <input
                  required
                  value={vehicleForm.driverName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                  placeholder="e.g. Suresh Parmar"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Mobile Number *</span>
                <input
                  required
                  value={vehicleForm.phone}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                  placeholder="9825012345"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Vehicle Model *</span>
                <select
                  value={vehicleForm.vehicleType}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary bg-white"
                >
                  <option value="Mahindra Bolero Maxi Truck">Mahindra Bolero Maxi Truck</option>
                  <option value="Tata 407 LPT">Tata 407 LPT</option>
                  <option value="Eicher Pro 2049">Eicher Pro 2049</option>
                  <option value="Tata Ace Gold">Tata Ace Gold (Chota Hathi)</option>
                  <option value="Tractor Trolley">Tractor Trolley</option>
                  <option value="Ashok Leyland Dost">Ashok Leyland Dost</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Vehicle Reg Number *</span>
                <input
                  required
                  value={vehicleForm.vehicleNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary font-mono uppercase"
                  placeholder="GJ-05-BX-4921"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Payload Capacity (kg) *</span>
                <input
                  type="number"
                  required
                  min="500"
                  step="100"
                  value={vehicleForm.capacityKg}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, capacityKg: e.target.value })}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Operating Base Mandi *</span>
                <select
                  value={vehicleForm.baseMandi}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, baseMandi: e.target.value })}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary bg-white"
                >
                  <option value="Surat APMC">Surat APMC</option>
                  <option value="Ahmedabad APMC">Ahmedabad APMC</option>
                  <option value="Rajkot APMC">Rajkot APMC</option>
                  <option value="Vadodara APMC">Vadodara APMC</option>
                  <option value="Mehsana APMC">Mehsana APMC</option>
                </select>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingVehicle}
                className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Truck className="w-4 h-4" />
                <span>{savingVehicle ? 'Saving to MySQL...' : 'Save & Publish Vehicle to Pool'}</span>
              </button>
            </div>
          </form>

          {/* Incoming Open Farmer Cargo Requests to Accept */}
          <section className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-sm text-text">Live Farmer Cargo Demands (Open for Pickup)</h2>
                <p className="text-[11px] text-muted">
                  Accept loads from farmers heading towards your APMC routes to fill empty capacity.
                </p>
              </div>

              {activeTrip ? (
                <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  🔒 Single-Trip Locked (1 Active Delivery)
                </span>
              ) : (
                <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                  {openCargoList.length} loads available
                </span>
              )}
            </div>

            {openCargoList.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted">
                No open cargo requests pending right now. Farmers who post requests will appear here instantly.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {openCargoList.map((cargo) => (
                  <div
                    key={cargo.id}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-3 px-6 py-4 text-xs items-center hover:bg-slate-50/60 transition-colors"
                  >
                    <div>
                      <p className="font-extrabold text-sm text-text">{cargo.cropName}</p>
                      <p className="text-muted">
                        Farmer: <span className="font-bold text-text">{cargo.farmerName}</span>
                      </p>
                      {cargo.farmerPhone && (
                        <p className="text-[11px] text-primary font-mono font-semibold">
                          📞 +91 {cargo.farmerPhone}
                        </p>
                      )}
                      <p className="text-[10px] text-muted truncate">{cargo.pickupLocation}</p>
                    </div>

                    <div>
                      <span className="text-muted">Destination Mandi:</span>
                      <p className="font-bold text-primary">{cargo.destinationMarket}</p>
                      <p className="text-muted font-mono">{cargo.pickupDate}</p>
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>~{cargo.estimatedDurationMinutes || 120} mins trip</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-muted">Cargo Load:</span>
                      <p className="font-bold text-text font-mono text-sm">{cargo.weightKg} kg</p>
                      <p className="text-emerald-700 font-bold">
                        Shared Fare: ~{formatINR(cargo.estimatedSharedCost || 1200)}
                      </p>
                    </div>

                    <div className="flex sm:justify-end gap-2">
                      <button
                        type="button"
                        disabled={Boolean(activeTrip)}
                        onClick={() => handleAcceptCargo(cargo)}
                        className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all ${
                          activeTrip
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                            : 'btn-primary cursor-pointer'
                        }`}
                        title={activeTrip ? 'Finish ongoing delivery before accepting another load' : 'Accept this load'}
                      >
                        {activeTrip ? (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>🔒 Active Trip in Progress</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept & Assign Truck</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
