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
  ShieldAlert,
  Phone,
  QrCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DigitalGatePassModal from '../components/transport/DigitalGatePassModal';
import CorridorFreightCalculator from '../components/transport/CorridorFreightCalculator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

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
  const { user, token, updateLocalUser } = useAuth();
  const { showToast } = useToast();

  const isUserTransporter = user?.role === 'transporter';
  const [activeTab, setActiveTab] = useState(isUserTransporter ? 'transporter' : 'farmer');

  // Farmer form state
  const [farmerName, setFarmerName] = useState(user?.name || '');
  const [cropName, setCropName] = useState('Tomato');
  const [pickupLocation, setPickupLocation] = useState(
    user?.FarmerProfile?.district
      ? `${user.FarmerProfile.district}, Maharashtra`
      : 'Pune, Maharashtra'
  );
  const [destination, setDestination] = useState(
    user?.FarmerProfile?.district ? `${user.FarmerProfile.district} APMC` : 'Pune APMC'
  );
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState(user?.FarmerProfile?.currentHarvestKg ? Number(user.FarmerProfile.currentHarvestKg) : 500);
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
    vehicleNumber: 'MH-12-RN-4921',
    capacityKg: '2200',
    baseMandi: 'Pune APMC',
    ratePerKm: '25',
  });
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Modal for Digital Mandi Gate Pass
  const [selectedGatePass, setSelectedGatePass] = useState(null);

  // Active or latest farmer booking for live tracking card
  const activeFarmerBooking = useMemo(() => {
    return myRequests.find((r) => ['accepted', 'in_transit'].includes(r.status)) || (myRequests.length > 0 ? myRequests[0] : null);
  }, [myRequests]);

  // Apply selected highway corridor to booking form
  const handleApplyCorridor = (data) => {
    setActiveTab('farmer');
    if (data.origin) setPickupLocation(data.origin);
    if (data.destination) setDestination(data.destination);
    if (data.weightKg) setWeight(Number(data.weightKg));
    showToast({
      type: 'success',
      title: '🛣️ Corridor Applied!',
      message: `Applied ${data.corridor.name} (${data.corridor.distanceKm} km). Estimated shared freight: ₹${data.calculations.sharedCost} (saves ₹${data.calculations.savings}).`,
    });
    setTimeout(() => {
      const formElement = document.getElementById('booking-dispatch-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

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
    if (isUserTransporter) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/transporters`, {
        headers: { Authorization: `Bearer ${token || 'guest'}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.success && Array.isArray(payload.data) && payload.data.length > 0) {
        setTransportersList(payload.data);
      } else {
        setTransportersList([
          {
            id: 'mock-1',
            driverName: 'Kishor Jadhav',
            phone: '+91 98765 43210',
            vehicleType: 'Tata 407 (Medium Truck)',
            capacityKg: 2500,
            currentRoute: 'Nashik ➔ Vashi APMC (Navi Mumbai)',
            ratePerKm: 14,
            isAvailable: true,
            rating: 4.8
          },
          {
            id: 'mock-2',
            driverName: 'Sanjay Shinde',
            phone: '+91 91234 56789',
            vehicleType: 'Mahindra Bolero Maxi Truck',
            capacityKg: 1500,
            currentRoute: 'Pune ➔ Vashi APMC (Mumbai)',
            ratePerKm: 12,
            isAvailable: true,
            rating: 4.9
          }
        ]);
      }
    } catch (err) {
      setTransportersList([
        {
          id: 'mock-1',
          driverName: 'Kishor Jadhav',
          phone: '+91 98765 43210',
          vehicleType: 'Tata 407 (Medium Truck)',
          capacityKg: 2500,
          currentRoute: 'Nashik ➔ Vashi APMC (Navi Mumbai)',
          ratePerKm: 14,
          isAvailable: true,
          rating: 4.8
        },
        {
          id: 'mock-2',
          driverName: 'Sanjay Shinde',
          phone: '+91 91234 56789',
          vehicleType: 'Mahindra Bolero Maxi Truck',
          capacityKg: 1500,
          currentRoute: 'Pune ➔ Vashi APMC (Mumbai)',
          ratePerKm: 12,
          isAvailable: true,
          rating: 4.9
        }
      ]);
    }
  }

  async function loadOpenCargo() {
    if (!token || !isUserTransporter) return;
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
    if (!token || !isUserTransporter) return;
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

    if (!token) return;
    // Dynamic live auto-polling every 4 seconds so farmers and drivers see instant updates
    const interval = setInterval(() => {
      loadMyRequests();
      loadActiveTrip();
    }, 4000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle URL query parameter ?showpass=true from header navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('showpass') === 'true') {
      if (activeTrip) {
        setSelectedGatePass(activeTrip);
      } else if (activeFarmerBooking) {
        setSelectedGatePass(activeFarmerBooking);
      }
    }
  }, [activeTrip, activeFarmerBooking]);

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

  // Show only currently available registered transporters.
  const allPools = useMemo(() => {
    return transportersList.filter((tr) => Number(tr.userId) !== Number(user?.id)).map((tr) => ({
      id: `live-${tr.id}`,
      transporterId: tr.userId,
      driver: tr.driverName || 'Verified Driver',
      route: tr.baseMandi || tr.currentRoute || 'Pune APMC',
      date: date,
      vehicle: tr.vehicleType || 'Commercial Farm Truck',
      vehicleNumber: tr.vehicleNumber || 'MH-12-RN-4921',
      capacityKg: tr.capacityKg || 2000,
      usedKg: 0,
      cost: (tr.ratePerKm || 20) * 85, // estimated base route cost
      farmers: 0,
      isLiveRegistered: true,
    }));
  }, [transportersList, user?.id, date]);

  // Filter registered vehicles by destination and available capacity.
  const matches = useMemo(() => {
    const dest = (destination || '').trim().toLowerCase();
    const filtered = allPools.filter((pool) => {
      const routeStr = (pool.route || '').toLowerCase();
      const destinationMatch = !dest || routeStr.includes(dest);
      const capacityMatch = ((pool.capacityKg || 2000) - (pool.usedKg || 0)) >= Number(weight || 0);
      return destinationMatch && capacityMatch;
    });

    return filtered;
  }, [destination, weight, allPools]);

  // Book dedicated transport request
  async function saveTransportRequest(e) {
    if (e) e.preventDefault();
    setError('');
    setMessage('');

    if (!token || token === 'guest' || user?.isGuest) {
      if (!cropName.trim() || !pickupLocation.trim()) {
        const errMsg = 'Please fill in crop commodity and pickup location.';
        setError(errMsg);
        showToast({ type: 'error', title: 'Missing Information', message: errMsg });
        return;
      }
      setSubmitting(true);
      setTimeout(() => {
        const guestBooking = {
          id: `guest-${Date.now()}`,
          farmerName: farmerName.trim() || 'Guest Farmer (अतिथी शेतकरी)',
          cropName: cropName.trim(),
          weightKg: Number(weight || 500),
          pickupLocation: pickupLocation.trim(),
          destinationMarket: destination || 'Pune APMC',
          pickupDate: date || new Date().toISOString().slice(0, 10),
          status: 'assigned',
          gatePassCode: `HM-GP-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
          driverName: 'Sanjay Shinde (Verified Driver)',
          driverPhone: '9876543210',
          vehicleType: 'Mahindra Bolero Maxi Truck',
          vehicleNumber: 'GJ-05-AB-4921',
          estimatedDurationMinutes: 120,
          estimatedSharedCost: Math.round(Number(weight || 500) * 1.8),
          createdAt: new Date().toISOString()
        };
        setActiveFarmerBooking(guestBooking);
        setSelectedGatePass(guestBooking);
        setSubmitting(false);
        showToast({
          type: 'success',
          title: '🎟️ Demo Gate Pass Issued!',
          message: 'Your Digital Mandi Gate Pass is generated with QR verification code.'
        });
      }, 500);
      return;
    }

    if (isUserTransporter) {
      const errMsg = 'Transporters cannot post farmer transport requests.';
      setError(errMsg);
      showToast({ type: 'warning', title: 'Role Restriction', message: errMsg });
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
          farmerPhone: user?.phone,
          vehicleType: 'any',
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || 'Unable to save request');

      setMessage('Transport request posted and saved in MySQL.');
      showToast({
        type: 'celebrate',
        title: '🚚 Transport Request Posted!',
        message: `Posted ${weight} kg of ${cropName} heading to ${destination}. A transporter can accept it from their console.`,
        duration: 5000,
      });

      await loadMyRequests();
    } catch (err) {
      setError(err.message || 'Unable to save transport request');
      showToast({ type: 'error', title: 'Booking Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  // Join shared vehicle pool
  async function handleJoinPool(pool) {
    if (!token || isUserTransporter) {
      showToast({
        type: 'error',
        title: 'Login Required',
        message: 'Sign in as a farmer to book an available transporter.',
      });
      return;
    }

    const estimatedCost = Math.round(pool.cost * (Number(weight || 500) / Math.max(pool.capacityKg, 1)));

    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transporterId: pool.transporterId,
          farmerName: farmerName || user?.name || 'Farmer',
          farmerPhone: user?.phone,
          cropName: cropName || 'Produce',
          pickupLocation: pickupLocation || 'Pune, Maharashtra',
          destinationMarket: pool.route,
          pickupDate: pool.date,
          weightKg: Number(weight) || 500,
          vehicleType: pool.vehicle,
          vehicleNumber: pool.vehicleNumber || 'MH-12-RN-4921',
          estimatedSharedCost: estimatedCost,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.message || `Booking failed (${response.status}). Please check the backend database and try again.`);

      showToast({
        type: 'celebrate',
        title: '🎉 Shared Slot Booked & Confirmed!',
        message: `Reserved ${pool.vehicle} with ${pool.driver}. Estimated cost: ${formatINR(estimatedCost)}. Gate pass issued.`,
        duration: 5000,
      });

      // Auto open gate pass modal
      setSelectedGatePass(payload.data);
      await loadMyRequests();
      await loadTransporters();
    } catch (err) {
      showToast({ type: 'error', title: 'Booking Failed', message: err.message || 'Unable to create transport booking. Please try again.' });
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

      if (payload.data?.userId) updateLocalUser({ ...user, role: 'transporter', TransporterProfile: payload.data });
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
                <span>Farmer Booking</span>
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
          {/* Farmer Live Tracking Card with Driver Details, Phone, Plate, ETA & 4-Step Stepper */}
              {!isUserTransporter && activeFarmerBooking && (
            <section className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-6 sm:p-7 shadow-xl space-y-5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold">
                    <Truck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        🛰️ Farmer Live Tracking Card
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        Pass: {activeFarmerBooking.gatePassCode || `GJ-APMC-${activeFarmerBooking.id}`}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                      {activeFarmerBooking.cropName} ({activeFarmerBooking.weightKg} kg) → {activeFarmerBooking.destinationMarket}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                      activeFarmerBooking.status === 'delivered'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : activeFarmerBooking.status === 'in_transit'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                        : activeFarmerBooking.status === 'accepted'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    }`}
                  >
                    {activeFarmerBooking.status === 'delivered'
                      ? '🏁 Delivered at Mandi'
                      : activeFarmerBooking.status === 'in_transit'
                      ? '🛣️ In Transit to APMC'
                      : activeFarmerBooking.status === 'accepted'
                      ? '🚚 Driver Assigned & En Route'
                      : '⏳ Requested (Awaiting Transporter)'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedGatePass(activeFarmerBooking)}
                    className="px-3 py-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>View Gate Pass</span>
                  </button>
                </div>
              </div>

              {/* Driver, Vehicle, ETA Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Assigned Driver</span>
                  <p className="font-extrabold text-sm text-white">
                    {activeFarmerBooking.driverName || 'Driver Assignment in Progress'}
                  </p>
                  {activeFarmerBooking.driverPhone ? (
                    <a
                      href={`tel:${activeFarmerBooking.driverPhone}`}
                      className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold font-mono"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>+91 {activeFarmerBooking.driverPhone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Phone shared on dispatch</span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Vehicle Plate Number</span>
                  <p className="font-bold text-white">
                    {activeFarmerBooking.vehicleType || 'Commercial Farm Truck'}
                  </p>
                  <span className="font-mono text-[11px] font-bold text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded border border-white/15 inline-block mt-0.5">
                    {activeFarmerBooking.vehicleNumber || 'Plate Assigned on Pickup'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Estimated Arrival Time (ETA)</span>
                  <p className="font-mono font-extrabold text-sm text-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{activeFarmerBooking.estimatedDurationMinutes || 120} Minutes</span>
                  </p>
                  <span className="text-[11px] text-slate-400">Scheduled: {activeFarmerBooking.pickupDate}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Pickup & Mandi Route</span>
                  <p className="font-bold text-white truncate">{activeFarmerBooking.pickupLocation}</p>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 shrink-0" />
                    <span className="truncate">{activeFarmerBooking.destinationMarket}</span>
                  </p>
                </div>
              </div>

              {/* 4-Step Live Tracking Stepper */}
              <div className="pt-2">
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-800 z-0" />
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 z-0"
                    style={{
                      width:
                        activeFarmerBooking.status === 'delivered'
                          ? '100%'
                          : activeFarmerBooking.status === 'in_transit'
                          ? '66%'
                          : activeFarmerBooking.status === 'accepted'
                          ? '33%'
                          : '0%',
                    }}
                  />

                  {/* Step 1: Requested */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                      ✓
                    </div>
                    <span className="text-[11px] font-bold text-white mt-1.5">(1) Requested</span>
                    <span className="text-[10px] text-slate-400">{activeFarmerBooking.pickupDate}</span>
                  </div>

                  {/* Step 2: Driver Assigned */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                        ['accepted', 'in_transit', 'delivered'].includes(activeFarmerBooking.status)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {['accepted', 'in_transit', 'delivered'].includes(activeFarmerBooking.status) ? '✓' : '2'}
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-1.5 ${
                        ['accepted', 'in_transit', 'delivered'].includes(activeFarmerBooking.status)
                          ? 'text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      (2) Driver Assigned
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                      {activeFarmerBooking.driverName ? activeFarmerBooking.driverName.split(' ')[0] : 'Pending'}
                    </span>
                  </div>

                  {/* Step 3: In Transit */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                        ['in_transit', 'delivered'].includes(activeFarmerBooking.status)
                          ? 'bg-emerald-500 text-white animate-pulse'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {['in_transit', 'delivered'].includes(activeFarmerBooking.status) ? '✓' : '3'}
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-1.5 ${
                        ['in_transit', 'delivered'].includes(activeFarmerBooking.status) ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      (3) In Transit
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {activeFarmerBooking.status === 'in_transit' ? 'On Highway 🛣️' : 'Awaiting Dispatch'}
                    </span>
                  </div>

                  {/* Step 4: Delivered at Mandi */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                        activeFarmerBooking.status === 'delivered'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {activeFarmerBooking.status === 'delivered' ? '✓' : '4'}
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-1.5 ${
                        activeFarmerBooking.status === 'delivered' ? 'text-emerald-300 font-extrabold' : 'text-slate-400'
                      }`}
                    >
                      (4) Delivered at Mandi
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {(activeFarmerBooking.destinationMarket || 'APMC').split(' ')[0]} Mandi
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Cargo Route Checkpoint & Telemetry Radar */}
              <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      🛰️ Real-Time Cargo Location & Checkpoint Telemetry
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Dynamic 4s Driver Sync Active</span>
                  </span>
                </div>

                {/* 3-Column Checkpoint Telemetry */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Current Checkpoint</span>
                    <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      {activeFarmerBooking.status === 'delivered'
                        ? '🏁 Mandi Auction Bay'
                        : activeFarmerBooking.status === 'in_transit'
                        ? '🛣️ En Route on State Highway'
                        : '🚜 Farm Gate Loading Yard'}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      {activeFarmerBooking.status === 'delivered'
                        ? 'Produce unloaded at destination APMC'
                        : activeFarmerBooking.status === 'in_transit'
                        ? 'Truck moving at ~58 km/h • Tarp secured'
                        : 'Produce inspected & loaded into commercial vehicle'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Transit Distance & Coverage</span>
                    <p className="text-xs font-mono font-extrabold text-emerald-400">
                      {activeFarmerBooking.status === 'delivered'
                        ? '100% Completed (Reached APMC)'
                        : activeFarmerBooking.status === 'in_transit'
                        ? '38 km covered • ~18 km remaining'
                        : '0 km covered • Vehicle at Pickup Point'}
                    </p>
                    <p className="text-[11px] text-slate-300 truncate">
                      Pickup: {activeFarmerBooking.pickupLocation}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Next Mandi Milestone</span>
                    <p className="text-xs font-extrabold text-amber-300">
                      {activeFarmerBooking.status === 'delivered'
                        ? '✅ Weight Slip Verified & Auction Ready'
                        : activeFarmerBooking.status === 'in_transit'
                        ? '⚖️ APMC Gate & Weighbridge'
                        : '🛣️ State Highway Dispatch'}
                    </p>
                    <p className="text-[11px] text-slate-300 truncate">
                      Target Mandi: {activeFarmerBooking.destinationMarket}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Real-Time Freight Cost Calculator & Highway Distance Estimator Widget */}
          <CorridorFreightCalculator
            onApplyCorridor={handleApplyCorridor}
            defaultWeight={weight}
          />

          {/* Farmer booking and request form */}
          {!isUserTransporter && <form
            id="booking-dispatch-form"
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
                  placeholder="e.g. Pune, Maharashtra"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Destination APMC *</span>
                <input
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                  placeholder="e.g. Pune APMC, Mumbai Vashi APMC"
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
          </form>}

          {/* Available registered transporter inventory */}
          {!isUserTransporter && <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Available Registered Transporters ({matches.length} found)</span>
              </h2>
              <span className="text-xs text-muted">Live vehicle availability</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((pool) => {
                const available = pool.capacityKg - pool.usedKg;
                const sharedCost = Math.round(pool.cost * (Number(weight || 500) / Math.max(pool.capacityKg, 1)));

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
                        <span className="font-semibold">Capacity: {pool.capacityKg} kg</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-primary/20 bg-primary-50/70 p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-muted uppercase font-bold tracking-wider">Estimated Booking Cost</p>
                <p className="text-xl font-black text-primary font-mono">{formatINR(sharedCost)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-emerald-800 font-bold bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300">Estimated fare</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleJoinPool(pool)}
                        className="btn-primary flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Book Transport & Get Pass</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          speakAloud(
                            `Vehicle: ${pool.vehicle}. Driver: ${pool.driver}. Operating from ${pool.route}. Estimated fare: ${sharedCost} rupees.`
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
          </section>}

          {/* Farmer booking history. */}
          {!isUserTransporter && <section className="rounded-3xl border border-border bg-white shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-text">My Live Transport Bookings & Tracking</h2>
                <p className="text-[11px] text-muted">Stored in MySQL • Your requests, assigned transporter, and digital mandi gate passes</p>
              </div>
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                {myRequests.length} recorded
              </span>
            </div>

            {myRequests.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted">No transport bookings yet. Book a vehicle or post a request to see it here.</div>
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
                                {req.weightKg} kg
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

                      {/* Show the other party in this booking. */}
                      <div className="rounded-2xl border border-border/80 bg-slate-50/80 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] text-muted uppercase font-semibold">{req.driverName ? 'Assigned Transporter' : 'Booking Status'}</span>
                          <p className="font-bold text-sm text-text mt-0.5">
                            {req.driverName || 'Driver pending assignment'}
                          </p>
                          {req.driverPhone ? (
                            <a
                              href={`tel:${req.driverPhone}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline font-bold font-mono mt-0.5"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{req.driverPhone}</span>
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
                            <span className="text-[11px] font-bold text-text mt-1">(1) Requested</span>
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
                              (2) Driver Assigned
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
                              (3) In Transit
                            </span>
                            <span className="text-[10px] text-muted">
                              {isInTransit ? 'On Route' : 'Awaiting Dispatch'}
                            </span>
                          </div>

                          {/* Step 4: Delivered at Mandi */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                                isDelivered ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isDelivered ? '✓' : '4'}
                            </div>
                            <span className={`text-[11px] font-bold mt-1 ${isDelivered ? 'text-emerald-700 font-extrabold' : 'text-muted'}`}>
                              (4) Delivered at Mandi
                            </span>
                            <span className="text-[10px] text-muted">{(req.destinationMarket || 'APMC').split(' ')[0]} Mandi</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>}
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

                  <button
                    type="button"
                    onClick={() => setSelectedGatePass(activeTrip)}
                    className="px-3.5 py-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer animate-pulse"
                    title="Open Official APMC Gate Pass for Security Check"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>🎫 Show Digital Gate Pass</span>
                  </button>
                </div>
              </div>

              {/* Farmer and Route Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Farmer Contact</span>
                  <p className="font-extrabold text-sm text-white">{activeTrip.farmerName}</p>
                  <a
                    href={activeTrip.farmerPhone ? `tel:${activeTrip.farmerPhone}` : undefined}
                    className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold font-mono"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{activeTrip.farmerPhone || 'Phone shared after booking'}</span>
                  </a>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Pickup Location</span>
                  <p className="font-bold text-white flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">
                      {activeTrip.pickupLocation && activeTrip.pickupLocation.toLowerCase().includes('pune')
                        ? activeTrip.pickupLocation.replace(/gujarat/i, 'Maharashtra')
                        : activeTrip.pickupLocation}
                    </span>
                  </p>
                  <span className="text-[11px] text-slate-400">Scheduled: {activeTrip.pickupDate}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Destination APMC</span>
                  <p className="font-bold text-emerald-400 flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{activeTrip.destinationMarket}</span>
                  </p>
                  <span className="text-[11px] text-slate-400">
                    Pass: {activeTrip?.destinationMarket && String(activeTrip.destinationMarket).toLowerCase().includes('pune') && activeTrip.gatePassCode?.startsWith('GJ-')
                      ? activeTrip.gatePassCode.replace(/^GJ-/, 'MH-')
                      : activeTrip?.gatePassCode}
                  </span>
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

              {/* Official Mandi Gate Security Verification Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold shrink-0">
                    <QrCode className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                        Official APMC Security Inspection
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        Pass: {activeTrip?.destinationMarket && String(activeTrip.destinationMarket).toLowerCase().includes('pune') && activeTrip.gatePassCode?.startsWith('GJ-')
                          ? activeTrip.gatePassCode.replace(/^GJ-/, 'MH-')
                          : activeTrip?.gatePassCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1">
                      {activeTrip.status === 'in_transit'
                        ? '🚨 Approaching Mandi Gate? Present QR Gate Pass to the Mandi Security Guard and Weighbridge Officer.'
                        : 'Gate pass verified and ready. Present to Mandi Gate Security upon arrival.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedGatePass(activeTrip)}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all shrink-0"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Present Gate Pass (QR)</span>
                </button>
              </div>

              {/* Status Milestone Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Advance the shipment stage to inform the farmer in real time.
                  </span>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGatePass(activeTrip)}
                    className="py-2.5 px-4 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>View Gate Pass</span>
                  </button>
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
          {isUserTransporter && <form
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
                  <option value="Pune APMC">Pune APMC (Gultekdi)</option>
                  <option value="Nashik APMC">Nashik APMC</option>
                  <option value="Mumbai Vashi APMC">Mumbai Vashi Mega APMC</option>
                  <option value="Kolhapur APMC">Kolhapur APMC (Shahu Market Yard)</option>
                  <option value="Nagpur APMC">Nagpur APMC (Kalamna)</option>
                  <option value="Amravati APMC">Amravati APMC</option>
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
          </form>}

          {/* Transporter's own assigned bookings */}
          <section className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-border flex items-center justify-between">
              <div><h2 className="font-bold text-sm text-text">My Transport Bookings</h2><p className="text-[11px] text-muted">Farmers who booked you and cargo status</p></div>
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-white border border-slate-200">{myRequests.length} bookings</span>
            </div>
            {myRequests.length === 0 ? <div className="p-8 text-center text-sm text-muted">No bookings assigned to you yet.</div> : (
              <div className="divide-y divide-border/60">{myRequests.map((trip) => (
                <div key={trip.id} className="px-6 py-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center text-xs">
                  <div><p className="font-bold text-text">{trip.farmerName} · {trip.cropName}</p><p className="text-muted">{trip.weightKg} kg · {trip.farmerPhone || 'No phone'}</p></div>
                  <div><p className="font-semibold text-text">{trip.pickupLocation} → {trip.destinationMarket}</p><p className="text-muted">{trip.pickupDate}</p></div>
                  <div><p className="font-semibold text-text">{trip.vehicleType}</p><p className="text-muted">Gate pass: {trip.gatePassCode}</p></div>
                  <div className="sm:text-right flex items-center sm:justify-end gap-2"><span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold uppercase">{trip.status?.replace('_', ' ')}</span><button type="button" onClick={() => setSelectedGatePass(trip)} className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-white text-emerald-800 font-bold">Gate pass</button></div>
                </div>
              ))}</div>
            )}
          </section>

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
                      <p className="text-muted">Farmer request · contact shown after assignment</p>
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
