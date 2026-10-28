import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
  QrCode,
  Navigation,
  CheckCheck,
  Star,
  Lock,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import DigitalGatePassModal from '../components/transport/DigitalGatePassModal';
import EscrowPaymentModal from '../components/transport/EscrowPaymentModal';
import DriverRatingModal from '../components/transport/DriverRatingModal';
import CorridorFreightCalculator from '../components/transport/CorridorFreightCalculator';
import LiveDriverTrackingMap from '../components/transport/LiveDriverTrackingMap';
import SharedTransportFarmerWidget from '../components/dashboard/SharedTransportFarmerWidget';
import TransporterDashboard from '../components/dashboard/TransporterDashboard';
import apiClient from '../services/apiClient';

const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL)) || '';

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
  const location = useLocation();
  const { user, token, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

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
  const [vehiclesList, setVehiclesList] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
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
  const [showGpsMap, setShowGpsMap] = useState(true);
  const [showTransporterGpsMap, setShowTransporterGpsMap] = useState(true);

  // Live dynamic telemetry state synced from the interactive radar map
  const [liveTelemetry, setLiveTelemetry] = useState({
    speedKmh: 58,
    bearing: 236,
    distanceCoveredKm: 54.2,
    distanceRemainingKm: 89.8,
    etaMinutes: 98,
    checkpoint: '⛰️ Kasara Ghat Curves (NH-160)',
    nextCheckpoint: '🚧 Shahapur Agri Freight Bypass',
    progressPct: 38,
    isSimulatingRain: false
  });

  const handleTelemetryUpdate = useCallback((telemetry) => {
    setLiveTelemetry(telemetry);
  }, []);

  // Modal for UPI Freight Escrow Payment
  const [escrowPaymentBooking, setEscrowPaymentBooking] = useState(null);

  // Modal for Driver 5-Star Rating & Review
  const [ratingBooking, setRatingBooking] = useState(null);

  // Selected booking ID for farmer multi-booking tracking toggle
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  // Active or selected farmer booking for live tracking card (strictly from real database records)
  const activeFarmerBooking = useMemo(() => {
    if (!myRequests || myRequests.length === 0) return null;
    if (selectedBookingId) {
      const match = myRequests.find((r) => String(r.id) === String(selectedBookingId));
      if (match) return match;
    }
    return (
      myRequests.find((r) => ['in_transit', 'driver_assigned', 'accepted'].includes(r.status)) ||
      myRequests.find((r) => r.status === 'delivered') ||
      myRequests[0]
    );
  }, [myRequests, selectedBookingId]);

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
        if (user.FarmerProfile.mainCrop) setCropName(user.FarmerProfile.mainCrop.split(',')[0].trim());
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

  // Auto-fill booking form & parse activeTab from URL search params (PART 15 SPA Routing)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      if (['farmer', 'my-bookings', 'tracking'].includes(tabParam)) {
        setActiveTab('farmer');
      } else if (['transporter', 'requests', 'fleet', 'shared', 'active', 'gatepass', 'notifications', 'history'].includes(tabParam)) {
        setActiveTab('transporter');
      }
    }

    const targetDest = location.state?.destination || searchParams.get('destination');
    const targetWeight = location.state?.weightKg || location.state?.weight || searchParams.get('weight');
    const targetCrop = location.state?.crop || searchParams.get('crop');

    if (targetDest) {
      setDestination(targetDest);
    }
    if (targetWeight && Number(targetWeight) > 0) {
      setWeight(Number(targetWeight));
    }
    if (targetCrop) {
      setCropName(targetCrop);
    }
    if (targetDest || targetWeight) {
      setActiveTab('farmer');
      showToast({
        type: 'celebrate',
        title: '🚚 Auto-Filled from Harvest Simulator!',
        message: `Set destination to "${targetDest || 'Winning APMC'}" for ${targetWeight || '500'} kg load. Ready to dispatch.`,
        duration: 4000
      });
      setTimeout(() => {
        const formElement = document.getElementById('booking-dispatch-form');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  }, [location.state, location.search]);

  // Clear per-user transport state on logout
  useEffect(() => {
    const handleLogout = () => {
      setMyRequests([]);
      setOpenCargoList([]);
      setActiveTrip(null);
      setFarmerName('');
      setMessage('');
      setError('');
    };
    window.addEventListener('harvestmitra:logout', handleLogout);
    return () => window.removeEventListener('harvestmitra:logout', handleLogout);
  }, []);

  // Auto-refresh farmer bookings and switch tracking when new booking is created
  useEffect(() => {
    const handleBookingCreated = (e) => {
      loadMyRequests();
      if (e.detail?.id) {
        setSelectedBookingId(e.detail.id);
      }
    };
    window.addEventListener('harvestmitra:booking-created', handleBookingCreated);
    return () => window.removeEventListener('harvestmitra:booking-created', handleBookingCreated);
  }, []);

  async function loadMyRequests() {
    if (!token) return;
    try {
      const response = await apiClient('/api/transport/my-requests');
      const payload = await response.json();
      if (response.ok && payload.success) {
        setMyRequests(payload.data || []);
      }
    } catch (err) {
      console.warn('Unable to load requests:', err.message);
    }
  }

  async function loadVehicles() {
    if (isUserTransporter) return;
    setLoadingVehicles(true);
    try {
      const params = new URLSearchParams();
      if (cropName) params.append('crop', cropName);
      if (weight) params.append('weightKg', weight);
      if (destination) params.append('destination', destination);
      if (date) params.append('date', date);

      const response = await apiClient(`/api/transport/vehicles?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.success && Array.isArray(payload.data)) {
        setVehiclesList(payload.data);
      } else {
        setVehiclesList([]);
      }
    } catch (err) {
      console.warn('Unable to load vehicles:', err.message);
      setVehiclesList([]);
    } finally {
      setLoadingVehicles(false);
    }
  }

  async function loadOpenCargo() {
    if (!token || !isUserTransporter) return;
    try {
      const response = await apiClient('/api/transport/open-cargo');
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
      const response = await apiClient('/api/transport/active-trip');
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
    loadVehicles();
    loadOpenCargo();
    loadActiveTrip();

    if (!token) return;
    // Dynamic live auto-polling every 3 seconds so farmers and drivers see instant updates
    const interval = setInterval(() => {
      loadMyRequests();
      loadActiveTrip();
      loadVehicles();
    }, 3000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (token && !isUserTransporter) {
      loadVehicles();
    }
  }, [cropName, weight, destination, date]);

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

  // Show only currently available registered fleet vehicles (exclude assigned/busy drivers).
  const allPools = useMemo(() => {
    return vehiclesList
      .filter((v) => {
        if (Number(v.userId) === Number(user?.id)) return false;
        if (v.isAvailable === false || v.status === 'maintenance' || v.status === 'busy' || v.isCurrentlyInTransit) return false;
        const remaining = v.remainingCapacityKg !== undefined ? v.remainingCapacityKg : v.capacityKg;
        if (remaining <= 0) return false;

        // Check if this vehicle is already assigned to ANY active booking of this farmer
        const isAssignedToActiveTrip = (myRequests || []).some(
          (req) =>
            ['driver_assigned', 'in_transit', 'accepted', 'confirmed'].includes(req.status) &&
            ((req.vehicleId && Number(req.vehicleId) === Number(v.id)) ||
              (req.vehicleNumber && v.registrationNumber && req.vehicleNumber.toUpperCase().trim() === v.registrationNumber.toUpperCase().trim()))
        );
        if (isAssignedToActiveTrip) return false;

        return true;
      })
      .map((v) => ({
        id: `vehicle-${v.id}`,
        vehicleId: v.id,
        transporterId: v.userId,
        transporterName: v.User?.name || v.transporterName || v.driverName,
        driver: v.driverName || 'Verified Driver',
        driverPhone: v.driverPhone || '9876543210',
        route: v.supportedRoutes || v.baseLocation || 'Maharashtra APMC Corridor',
        baseLocation: v.baseLocation,
        date: date || new Date().toISOString().slice(0, 10),
        vehicle: v.vehicleType || 'Commercial Farm Truck',
        vehicleNumber: v.registrationNumber,
        capacityKg: v.capacityKg,
        remainingCapacityKg: v.remainingCapacityKg !== undefined ? v.remainingCapacityKg : v.capacityKg,
        usedKg: v.bookedWeightKg || 0,
        ratePerKm: v.ratePerKm || 22,
        cost: v.estimatedSoloFare || ((v.ratePerKm || 22) * 85),
        sharedCost: v.estimatedSharedFare || Math.round((v.ratePerKm || 22) * 45),
        specialHandling: v.specialHandling,
        cropMatchScore: v.cropMatchScore,
        isCropSuitable: v.isCropSuitable,
        cropSuitabilityReason: v.cropSuitabilityReason,
        isLiveRegistered: true,
      }));
  }, [vehiclesList, user?.id, date, myRequests]);

  // Filter registered vehicles by destination and available capacity.
  const matches = useMemo(() => {
    const dest = (destination || '').trim().toLowerCase();
    const reqWeight = Number(weight || 0);

    return allPools.filter((pool) => {
      // 1. Capacity check: must have enough remaining capacity for requested weight
      if (reqWeight > 0 && pool.remainingCapacityKg < reqWeight) return false;
      if (pool.remainingCapacityKg <= 0) return false;

      // 2. Route check: if destination is chosen, vehicle's supported routes or base location must match
      if (dest && dest !== 'all') {
        const routeStr = (pool.route || '').toLowerCase();
        const baseLoc = (pool.baseLocation || '').toLowerCase();
        const destKeywords = dest.split(/\s+/).filter(w => w.length > 2 && !['apmc', 'market', 'yard', 'wholesale'].includes(w));
        const matchesKeyword = destKeywords.some(kw => routeStr.includes(kw) || baseLoc.includes(kw));
        const directMatch = routeStr.includes(dest) || dest.includes(routeStr) || baseLoc.includes(dest);
        if (!matchesKeyword && !directMatch) return false;
      }

      return true;
    });
  }, [destination, weight, allPools]);

  // Book dedicated transport request
  async function saveTransportRequest(e) {
    if (e) e.preventDefault();
    setError('');
    setMessage('');

    if (Number(weight) > 5000) {
      const errMsg = 'Overload Warning: Single vehicle shared dispatch cannot exceed the 5,000 kg safety limit. Please reduce weight or split across multiple trucks.';
      setError(errMsg);
      showToast({
        type: 'warning',
        title: '⚠️ Overloaded Dispatch Prevented',
        message: errMsg,
        duration: 6000
      });
      return;
    }

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
          gatePassCode: `MH-APMC-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
          driverName: 'Sanjay Shinde (Verified Driver)',
          driverPhone: '9876543210',
          vehicleType: 'Mahindra Bolero Maxi Truck',
          vehicleNumber: 'MH-12-RN-4921',
          estimatedDurationMinutes: 120,
          estimatedSharedCost: Math.round(Number(weight || 500) * 1.8),
          createdAt: new Date().toISOString()
        };
        setMyRequests((prev) => [guestBooking, ...prev]);
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

      setSelectedGatePass(payload.data);
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
    if (isUserTransporter) {
      showToast({
        type: 'warning',
        title: 'Role Restriction',
        message: 'Transporters cannot book cargo slots.',
      });
      return;
    }

    const estimatedCost = pool.sharedCost || Math.round(pool.cost * (Number(weight || 500) / Math.max(pool.capacityKg, 1)));

    try {
      const response = await fetch(`${API_BASE_URL}/api/transport/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transporterId: pool.transporterId,
          vehicleId: pool.vehicleId,
          farmerName: farmerName.trim() || user?.name || 'Farmer',
          farmerPhone: user?.phone,
          cropName: cropName.trim() || 'Produce',
          pickupLocation: pickupLocation.trim() || 'Pune, Maharashtra',
          destinationMarket: destination.trim() || pool.route || 'Pune APMC',
          pickupDate: date || pool.date || new Date().toISOString().slice(0, 10),
          weightKg: Number(weight) || 500,
          vehicleType: pool.vehicle,
          vehicleNumber: pool.vehicleNumber,
          estimatedSharedCost: estimatedCost,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.message || `Booking failed (${response.status}). Please check the backend database and try again.`);

      showToast({
        type: 'celebrate',
        title: '🎉 Shared Slot Booked & Confirmed!',
        message: `Reserved ${pool.vehicle} (${pool.vehicleNumber}) with driver ${pool.driver}. Estimated fare: ${formatINR(estimatedCost)}. Gate pass issued.`,
        duration: 5000,
      });

      // Auto open gate pass modal
      setSelectedGatePass(payload.data);
      await loadMyRequests();
      await loadVehicles();
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

  // Farmer confirms delivery received
  async function handleConfirmReceived(requestId) {
    try {
      const response = await apiClient(`/api/transport/requests/${requestId}/confirm`, {
        method: 'PUT',
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || 'Failed to confirm delivery');

      showToast({
        type: 'celebrate',
        title: '✅ Delivery Confirmed!',
        message: 'Trip marked as completed. Thank you for using HarvestMitra transport!',
        duration: 4000,
      });

      await loadMyRequests();
      await loadActiveTrip();
    } catch (err) {
      showToast({ type: 'error', title: 'Confirm Failed', message: err.message });
    }
  }

  // Transporters strictly see their dedicated Fleet Console and Assigned Cargo Trips (Issue #176)
  if (user?.role === 'transporter') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 animate-in fade-in pb-12">
        <TransporterDashboard />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
      {/* Digital Mandi Gate Pass Modal */}
      <DigitalGatePassModal
        isOpen={!!selectedGatePass}
        booking={selectedGatePass}
        onClose={() => setSelectedGatePass(null)}
      />

      {/* UPI Freight Escrow Payment Modal */}
      <EscrowPaymentModal
        isOpen={!!escrowPaymentBooking}
        booking={escrowPaymentBooking}
        onClose={() => setEscrowPaymentBooking(null)}
        onPaymentSuccess={() => {
          loadMyRequests();
        }}
      />

      {/* Driver 5-Star Rating & Review Modal */}
      <DriverRatingModal
        isOpen={!!ratingBooking}
        booking={ratingBooking}
        onClose={() => setRatingBooking(null)}
        onReviewSuccess={() => {
          loadMyRequests();
        }}
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
              <span>{t('farmerTransport.badge', 'Smart Agritech Logistics & Pooling')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {t('farmerTransport.heroTitle', 'Shared Vehicle Pooling & Transporter Portal')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm">
              {t('farmerTransport.heroSubtitle', 'Split freight expenses by sharing trucks to APMC mandis. Includes automatic verifiable Digital Mandi Gate Passes with QR verification.')}
            </p>
          </div>

          {/* Mode Switcher Tabs - Locked to admin role (Issue #173) */}
          {user?.role === 'admin' && (
            <div className="p-1.5 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shrink-0 shadow-lg">
              <button type="button" onClick={() => setActiveTab('farmer')} className={`py-2 px-4 rounded-xl text-xs font-bold ${activeTab === 'farmer' ? 'bg-primary text-white shadow-md' : 'text-slate-300'}`}>{t('farmerTransport.farmerBookingBtn', 'Farmer Booking')}</button>
              <button type="button" onClick={() => setActiveTab('transporter')} className={`py-2 px-4 rounded-xl text-xs font-bold ${activeTab === 'transporter' ? 'bg-primary text-white shadow-md' : 'text-slate-300'}`}>{t('farmerTransport.transporterConsoleBtn', 'Transporter Console')}</button>
            </div>
          )}
        </div>
      </section>

          {/* FARMER TAB CONTENT */}
      {activeTab === 'farmer' && (
        <>
          {/* Complete Crop-Based Vehicle & Shared Transport Booking System */}
          <section id="crop-shared-transport-suite" className="animate-in fade-in">
            <SharedTransportFarmerWidget
              initialCrop={cropName}
              initialWeightKg={weight}
              initialDestination={destination}
            />
          </section>

          {/* Multi-Booking Selector (When Farmer has multiple bookings) */}
          {myRequests && myRequests.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-bold shrink-0 text-[11px]">Select Booking:</span>
              {myRequests.map((req) => (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => setSelectedBookingId(req.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs shrink-0 cursor-pointer ${
                    activeFarmerBooking?.id === req.id
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  #{req.id} • {req.cropName} ({req.weightKg}kg) - {req.status?.toUpperCase().replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          )}

          {/* Farmer Live Tracking Card with Driver Details, Phone, Plate, ETA & 4-Step Stepper */}
          {activeFarmerBooking ? (
            <section className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-6 sm:p-7 shadow-xl space-y-5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold">
                    <Truck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        {t('farmerTransport.liveTrackingCard', '🛰️ Farmer Live Tracking Card')}
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        Pass: {activeFarmerBooking.gatePassCode || `MH-APMC-${activeFarmerBooking.id}`}
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
                      ['delivered', 'completed'].includes(activeFarmerBooking.status)
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : activeFarmerBooking.status === 'in_transit'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                        : ['accepted', 'driver_assigned'].includes(activeFarmerBooking.status)
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    }`}
                  >
                    {['delivered', 'completed'].includes(activeFarmerBooking.status)
                      ? t('farmerTransport.statusDeliveredBadge', '🏁 Delivered at Mandi')
                      : activeFarmerBooking.status === 'in_transit'
                      ? t('farmerTransport.statusInTransitBadge', '🛣️ In Transit to APMC')
                      : ['accepted', 'driver_assigned'].includes(activeFarmerBooking.status)
                      ? t('farmerTransport.statusDriverAssignedBadge', '🚚 Driver Assigned & En Route')
                      : t('farmerTransport.statusAwaitingTransporterBadge', '⏳ Requested (Awaiting Transporter)')}
                  </span>

                  {activeFarmerBooking.status === 'delivered' && (
                    <button
                      type="button"
                      onClick={() => handleConfirmReceived(activeFarmerBooking.id)}
                      className="px-3 py-1.5 rounded-xl border border-emerald-400 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('farmerTransport.confirmReceivedBtn', 'Confirm Received')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowGpsMap((prev) => !prev)}
                    className="px-3 py-1.5 rounded-xl border border-blue-400/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{showGpsMap ? t('farmerTransport.hideGpsRadar', 'Hide GPS Radar') : t('farmerTransport.liveDriverGpsMap', '🛰️ Live Driver GPS Map')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGatePass(activeFarmerBooking)}
                    className="px-3 py-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t('farmerTransport.digitalGatePassBtn', 'Digital Mandi Gate Pass')}</span>
                  </button>
                </div>
              </div>

              {/* Driver, Vehicle, ETA Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t('farmerTransport.assignedDriver', 'Assigned Driver')}</span>
                  <p className="font-extrabold text-sm text-white">
                    {activeFarmerBooking.driverName || t('farmerTransport.driverNotAssignedYet', 'Driver not assigned yet')}
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
                    <span className="text-slate-400 text-[11px]">{t('farmerTransport.driverPhoneShared', 'Contact shared once driver assigned')}</span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t('farmerTransport.vehiclePlateNumber', 'Vehicle Plate Number')}</span>
                  <p className="font-bold text-white">
                    {activeFarmerBooking.vehicleType || (activeFarmerBooking.vehicleNumber ? 'Commercial Freight Carrier' : t('farmerTransport.vehicleNotAssignedYet', 'Vehicle not assigned yet'))}
                  </p>
                  <span className="font-mono text-[11px] font-bold text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded border border-white/15 inline-block mt-0.5">
                    {activeFarmerBooking.vehicleNumber || t('farmerTransport.vehicleNotAssignedYet', 'Vehicle not assigned yet')}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t('farmerTransport.estimatedArrivalEta', 'Estimated Arrival Time (ETA)')}</span>
                  <p className="font-mono font-extrabold text-sm text-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {['delivered', 'completed'].includes(activeFarmerBooking.status)
                        ? t('farmerTransport.statusDelivered', 'Delivered at Mandi')
                        : ['open', 'pending'].includes(activeFarmerBooking.status)
                        ? t('farmerTransport.awaitingTransporterAcceptance', 'Awaiting Transporter Acceptance')
                        : `~${liveTelemetry?.etaMinutes || activeFarmerBooking.estimatedDurationMinutes || 120} ${t('farmerTransport.minutes', 'Minutes')}`}
                    </span>
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {activeFarmerBooking.status === 'in_transit'
                      ? (liveTelemetry?.hasLiveGps ? '🟢 Real-time GPS' : '🛣️ Corridor est. @ 45 km/h')
                      : `${t('farmerTransport.scheduled', 'Scheduled:')} ${activeFarmerBooking.pickupDate}`}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t('farmerTransport.pickupMandiRoute', 'Pickup & Mandi Route')}</span>
                  <p className="font-bold text-white truncate">{activeFarmerBooking.pickupLocation}</p>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 shrink-0" />
                    <span className="truncate">{activeFarmerBooking.destinationMarket}</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t('farmerTransport.freightEscrow', 'Freight Escrow')}</span>
                  {activeFarmerBooking.paymentStatus === 'in_escrow' ? (
                    <div>
                      <p className="font-extrabold text-sm text-amber-300 font-mono">
                        ₹{Number(activeFarmerBooking.escrowAmount || activeFarmerBooking.finalCost || activeFarmerBooking.estimatedSharedCost || 0).toLocaleString('en-IN')}
                      </p>
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30 inline-block mt-0.5">
                        {t('farmerTransport.lockedInEscrow', '🛡️ Locked in Escrow')}
                      </span>
                    </div>
                  ) : activeFarmerBooking.paymentStatus === 'paid' ? (
                    <div>
                      <p className="font-extrabold text-sm text-emerald-400 font-mono">
                        ₹{Number(activeFarmerBooking.finalCost || activeFarmerBooking.escrowAmount || activeFarmerBooking.estimatedSharedCost || 0).toLocaleString('en-IN')}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30 inline-block mt-0.5">
                        {t('farmerTransport.payoutReleased', '✅ Payout Released')}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="font-extrabold text-sm text-slate-300 font-mono">
                        ₹{Number(activeFarmerBooking.estimatedSharedCost || activeFarmerBooking.finalCost || 0).toLocaleString('en-IN')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setEscrowPaymentBooking(activeFarmerBooking)}
                        className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 px-2 py-0.5 rounded border border-emerald-400/40 inline-flex items-center gap-1 mt-0.5 cursor-pointer transition-colors"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{t('farmerTransport.lockEscrowBtn', 'Lock Escrow')}</span>
                      </button>
                    </div>
                  )}
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
                        ['delivered', 'completed'].includes(activeFarmerBooking.status)
                          ? '100%'
                          : activeFarmerBooking.status === 'in_transit'
                          ? `${Math.max(35, Math.min(96, liveTelemetry?.progressPct || 66))}%`
                          : ['accepted', 'driver_assigned'].includes(activeFarmerBooking.status)
                          ? '33%'
                          : '0%',
                    }}
                  />

                  {/* Step 1: Requested */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                      ✓
                    </div>
                    <span className="text-[11px] font-bold text-white mt-1.5">{t('farmerTransport.stepRequested', '(1) Requested')}</span>
                    <span className="text-[10px] text-slate-400">{activeFarmerBooking.pickupDate}</span>
                  </div>

                  {/* Step 2: Driver Assigned */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                        ['accepted', 'driver_assigned', 'in_transit', 'delivered', 'completed'].includes(activeFarmerBooking.status)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {['accepted', 'driver_assigned', 'in_transit', 'delivered', 'completed'].includes(activeFarmerBooking.status) ? '✓' : '2'}
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-1.5 ${
                        ['accepted', 'driver_assigned', 'in_transit', 'delivered', 'completed'].includes(activeFarmerBooking.status)
                          ? 'text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      {t('farmerTransport.stepDriverAssigned', '(2) Driver Assigned')}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                      {activeFarmerBooking.driverName ? activeFarmerBooking.driverName.split(' ')[0] : t('farmerTransport.pending', 'Pending')}
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
                      {t('farmerTransport.stepInTransit', '(3) In Transit')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {activeFarmerBooking.status === 'in_transit' ? t('farmerTransport.onHighway', 'On Highway 🛣️') : t('farmerTransport.awaitingDispatch', 'Awaiting Dispatch')}
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
                      {t('farmerTransport.stepDeliveredMandi', '(4) Delivered at Mandi')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {(activeFarmerBooking.destinationMarket || 'APMC').split(' ')[0]} Mandi
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Real-Time Live GPS Driver Highway Radar Map */}
              {showGpsMap && (
                <div className="mt-4 pt-1 animate-in fade-in duration-300">
                  <LiveDriverTrackingMap
                    booking={activeFarmerBooking}
                    isExpandedDefault={false}
                    onTelemetryUpdate={handleTelemetryUpdate}
                  />
                </div>
              )}

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
                    <span>{liveTelemetry?.hasLiveGps ? 'Live GPS Stream Active' : 'Route Corridor Simulation Active'}</span>
                  </span>
                </div>

                {/* 3-Column Checkpoint Telemetry */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Current Checkpoint</span>
                    <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      {activeFarmerBooking.status === 'delivered'
                        ? '🏁 Mandi Auction Bay'
                        : liveTelemetry?.checkpoint || '🛣️ En Route on State Highway'}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      {activeFarmerBooking.status === 'delivered'
                        ? 'Produce unloaded at destination APMC'
                        : `Truck moving at ~${liveTelemetry?.speedKmh || (activeFarmerBooking.status === 'in_transit' ? 45 : 0)} km/h • ${liveTelemetry?.isSimulatingRain ? '🌧️ Rain Alert Active' : 'Tarp secured & verified'}`}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Transit Distance & Coverage</span>
                    <p className="text-xs font-mono font-extrabold text-emerald-400">
                      {activeFarmerBooking.status === 'delivered'
                        ? '100% Completed (Reached APMC)'
                        : `${liveTelemetry?.distanceCoveredKm || 0} km covered • ~${liveTelemetry?.distanceRemainingKm || 0} km remaining (${liveTelemetry?.progressPct || 0}%)`}
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
                        : liveTelemetry?.nextCheckpoint || '⚖️ APMC Gate & Weighbridge'}
                    </p>
                    <p className="text-[11px] text-slate-300 truncate">
                      Target Mandi: {activeFarmerBooking.destinationMarket}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border-2 border-dashed border-white/15 bg-slate-900/50 p-7 sm:p-8 text-center text-white space-y-3.5 animate-in fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Truck className="w-7 h-7 opacity-75" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white">No Active Transport Bookings</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You currently have no transport requests in transit. Create a transport request below or book shared transport to track your assigned driver and vehicle live.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('crop-shared-transport-suite') || document.getElementById('booking-dispatch-form');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Book Farm Transport Now</span>
              </button>
            </section>
          )}

          {/* Real-Time Freight Cost Calculator & Highway Distance Estimator Widget */}
          <CorridorFreightCalculator
            onApplyCorridor={handleApplyCorridor}
            defaultWeight={weight}
          />

          {/* Farmer booking and request form */}
          <form
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
                  className={`w-full rounded-xl border px-3.5 py-2 text-sm outline-none transition-colors ${
                    Number(weight) > 5000
                      ? 'border-amber-500 bg-amber-50/30 focus:border-amber-600'
                      : 'border-border focus:border-primary'
                  }`}
                  placeholder="500"
                />
                {Number(weight) > 5000 && (
                  <div className="mt-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-1.5 font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>⚠️ Weight limit guard: Weight exceeds 5,000 kg max capacity. Reduce weight to prevent overloaded dispatch.</span>
                  </div>
                )}
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
                  disabled={submitting || Number(weight) > 5000}
                  className={`btn-primary py-2.5 px-6 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm ${
                    Number(weight) > 5000 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{submitting ? 'Connecting...' : 'Request Shared Truck Pool'}</span>
                </button>
              </div>
            </div>
          </form>
          {/* Available registered transporter inventory */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Available Registered Fleet Vehicles ({matches.length} found)</span>
              </h2>
              <span className="text-xs text-muted">Live vehicle availability</span>
            </div>

            {matches.length === 0 ? (
              <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200 text-center space-y-1.5 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-emerald-950">
                  {['accepted', 'driver_assigned', 'in_transit'].includes(activeFarmerBooking?.status)
                    ? 'Active Driver Assigned & Dispatched'
                    : 'No eligible transporter vehicles are currently available.'}
                </p>
                <p className="text-[11px] text-emerald-800">
                  {['accepted', 'driver_assigned', 'in_transit'].includes(activeFarmerBooking?.status)
                    ? `Assigned vehicle (${activeFarmerBooking.vehicleNumber || 'Agri Carrier'}) with driver ${activeFarmerBooking.driverName || 'Verified Driver'}. Live tracking is active above.`
                    : 'No eligible transporter vehicles are currently available.'}
                </p>
              </div>
            ) : (
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
            )}
          </section>

          {/* Farmer booking history. */}
          <section className="rounded-3xl border border-border bg-white shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-text">My Transport Requests & Live Tracking</h2>
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
                  const isAccepted = ['accepted', 'driver_assigned', 'in_transit', 'delivered', 'completed'].includes(req.status);
                  const isInTransit = ['in_transit', 'delivered', 'completed'].includes(req.status);
                  const isDelivered = ['delivered', 'completed'].includes(req.status);

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
                              req.status === 'completed'
                                ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                : isDelivered
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isInTransit
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : isAccepted
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {req.status === 'completed'
                              ? '✅ Trip Completed'
                              : isDelivered
                              ? '🏁 Delivered at APMC'
                              : isInTransit
                              ? '🛣️ On The Road (In Transit)'
                              : isAccepted
                              ? '🚚 Driver Assigned & En Route'
                              : '⏳ Waiting for Driver Pickup'}
                          </span>

                          {/* Escrow Status / Payment Action */}
                          {req.paymentStatus === 'in_escrow' ? (
                            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <span>🛡️ ₹{Number(req.escrowAmount || req.estimatedSharedCost || 1200).toLocaleString('en-IN')} Escrow</span>
                            </span>
                          ) : req.paymentStatus === 'paid' ? (
                            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                              <span>✅ ₹{Number(req.escrowAmount || req.estimatedSharedCost || 1200).toLocaleString('en-IN')} Paid</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEscrowPaymentBooking(req)}
                              className="px-3 py-1.5 rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Pay Escrow (₹{Number(req.estimatedSharedCost || 1200).toLocaleString('en-IN')})</span>
                            </button>
                          )}

                          {/* Driver Rating Action */}
                          {req.driverRating ? (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span>{req.driverRating}★ Rated</span>
                            </span>
                          ) : (isDelivered || req.status === 'completed') ? (
                            <button
                              type="button"
                              onClick={() => setRatingBooking(req)}
                              className="px-3 py-1.5 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span>Rate Driver</span>
                            </button>
                          ) : null}

                          {isDelivered && (
                            <button
                              type="button"
                              onClick={() => handleConfirmReceived(req.id)}
                              className="px-3 py-1.5 rounded-xl border border-emerald-500 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm received</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedGatePass(req)}
                            className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Digital Mandi Gate Pass</span>
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
          </section>
        </>
      )}

      {/* TRANSPORTER CONSOLE TAB CONTENT */}
      {activeTab === 'transporter' && (
        <TransporterDashboard />
      )}
    </div>
  );
}
