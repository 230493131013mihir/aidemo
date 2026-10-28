import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Users,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Scale,
  Sparkles,
  Check,
  X,
  Phone,
  QrCode,
  Tag,
  Building2,
  Package,
  Layers,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import DigitalGatePassModal from '../transport/DigitalGatePassModal';

import { API_BASE_URL } from '../../config/apiConfig';

function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

// Unit conversion helpers
function convertToKg(quantity, unit = 'kg') {
  const q = Number(quantity) || 0;
  if (unit === 'quintal') return Math.round(q * 100);
  if (unit === 'tonne') return Math.round(q * 1000);
  return Math.round(q);
}

const SUPPORTED_CROPS = [
  { name: 'Tomato', category: 'Vegetable', icon: '🍅', vehicleHint: 'Ventilated / Crate Carrier' },
  { name: 'Onion', category: 'Vegetable', icon: '🧅', vehicleHint: 'Ventilated Mesh Truck' },
  { name: 'Potato', category: 'Vegetable', icon: '🥔', vehicleHint: 'Dry Jute Sacks Carrier' },
  { name: 'Wheat', category: 'Grain', icon: '🌾', vehicleHint: 'Covered High-Side Truck' },
  { name: 'Rice', category: 'Grain', icon: '🍚', vehicleHint: 'Dry Weather-Proof Carrier' },
  { name: 'Cotton', category: 'Cash Crop', icon: '🌿', vehicleHint: 'High-Volume Bale Carrier' },
  { name: 'Soybean', category: 'Oilseed', icon: '🌱', vehicleHint: 'Dry Bulk Carrier' },
  { name: 'Grapes', category: 'Fruit', icon: '🍇', vehicleHint: 'Refrigerated Cold Chain' },
  { name: 'Banana', category: 'Fruit', icon: '🍌', vehicleHint: 'Cushioned Padded Bed' },
  { name: 'Other', category: 'Produce', icon: '📦', vehicleHint: 'Standard Agri Transport' }
];

const MAHARASHTRA_DESTINATIONS = [
  'Mumbai Vashi APMC Terminal',
  'Pune APMC Market Yard',
  'Nashik APMC Bajar Samiti',
  'Solapur APMC Main Mandi',
  'Kolhapur Shahu Market Yard',
  'Nagpur Cotton & Orange Mandi',
  'Surat APMC Mandi',
  'Ahmedabad APMC Mandi'
];

function getCropMeta(name) {
  const found = SUPPORTED_CROPS.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (found) return { ...found, name };
  const lower = name.toLowerCase();
  let icon = '🌾';
  let category = 'Produce';
  let vehicleHint = 'Standard Agri Transport';
  if (lower.includes('tomato')) { icon = '🍅'; category = 'Vegetable'; vehicleHint = 'Ventilated / Crate Carrier'; }
  else if (lower.includes('onion')) { icon = '🧅'; category = 'Vegetable'; vehicleHint = 'Ventilated Mesh Truck'; }
  else if (lower.includes('wheat')) { icon = '🌾'; category = 'Grain'; vehicleHint = 'Covered High-Side Truck'; }
  else if (lower.includes('cotton')) { icon = '🌿'; category = 'Cash Crop'; vehicleHint = 'High-Volume Bale Carrier'; }
  else if (lower.includes('soybean')) { icon = '🌱'; category = 'Oilseed'; vehicleHint = 'Dry Bulk Carrier'; }
  else if (lower.includes('sugarcane')) { icon = '🎋'; category = 'Cash Crop'; vehicleHint = 'Open Flatbed High-Capacity Truck'; }
  else if (lower.includes('potato')) { icon = '🥔'; category = 'Vegetable'; vehicleHint = 'Dry Jute Sacks Carrier'; }
  else if (lower.includes('grape')) { icon = '🍇'; category = 'Fruit'; vehicleHint = 'Refrigerated Cold Chain'; }
  else if (lower.includes('banana')) { icon = '🍌'; category = 'Fruit'; vehicleHint = 'Cushioned Padded Bed'; }
  else if (lower.includes('pomegranate') || lower.includes('anar')) { icon = '🍎'; category = 'Fruit'; vehicleHint = 'Cushioned Crates Transport'; }
  else if (lower.includes('rice') || lower.includes('paddy')) { icon = '🍚'; category = 'Grain'; vehicleHint = 'Dry Weather-Proof Carrier'; }
  return { name, category, icon, vehicleHint };
}

export default function SharedTransportFarmerWidget({ 
  registeredCrops = [],
  initialCrop = '',
  initialWeightKg = null,
  initialDestination = ''
}) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const farmerProfile = user?.FarmerProfile;
  const defaultDistrict = farmerProfile?.district || 'Pune';

  const [farmerCropsList, setFarmerCropsList] = useState(() => (Array.isArray(registeredCrops) ? registeredCrops : []));

  useEffect(() => {
    if (Array.isArray(registeredCrops) && registeredCrops.length > 0) {
      setFarmerCropsList(registeredCrops);
    }
  }, [registeredCrops]);

  // Auto-fetch farmer's registered crops with their individual harvest weights from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchCropsWithWeights = async () => {
      try {
        const authToken = token || 
          (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('harvestmitra_token')) || 
          (typeof localStorage !== 'undefined' && localStorage.getItem('harvestmitra_token')) || 'guest';
        
        const headers = { 'Content-Type': 'application/json' };
        if (authToken && authToken !== 'guest') {
          headers.Authorization = `Bearer ${authToken}`;
        } else {
          headers['x-guest-mode'] = 'true';
        }

        const res = await fetch(`${API_BASE_URL}/api/farmer/crops`, { headers });
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.crops) && json.crops.length > 0) {
          setFarmerCropsList(json.crops);
        }
      } catch (err) {
        console.warn('Could not auto-fetch farmer crop weights:', err.message);
      }
    };

    fetchCropsWithWeights();
    return () => { isMounted = false; };
  }, [token]);

  // Extract farmer's registered crops from props, context, or fetched list
  const userRegisteredCropNames = useMemo(() => {
    const list = [];
    const sourceList = farmerCropsList.length > 0 ? farmerCropsList : (Array.isArray(registeredCrops) ? registeredCrops : []);
    if (sourceList.length > 0) {
      sourceList.forEach((c) => {
        const name = typeof c === 'string' ? c : (c.cropName || c.name);
        if (name && typeof name === 'string' && !list.some((item) => item.toLowerCase() === name.trim().toLowerCase())) {
          list.push(name.trim());
        }
      });
    }
    const contextMainCrop = user?.FarmerProfile?.mainCrop || user?.farmerProfile?.mainCrop;
    if (contextMainCrop && typeof contextMainCrop === 'string' && contextMainCrop !== 'Not set') {
      contextMainCrop.split(',').forEach((c) => {
        const trimmed = c.trim();
        if (trimmed && !list.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
          list.push(trimmed);
        }
      });
    }
    return list;
  }, [farmerCropsList, registeredCrops, user]);

  const [showAllCommodities, setShowAllCommodities] = useState(false);
  const [isOtherCropSelected, setIsOtherCropSelected] = useState(false);
  const [customCropName, setCustomCropName] = useState('');

  // Clean initial crop string to single commodity if passed with commas
  const cleanInitialCrop = useMemo(() => {
    if (!initialCrop || typeof initialCrop !== 'string') return '';
    return initialCrop.split(',')[0].trim();
  }, [initialCrop]);

  // Form State - default to primary crop
  const [selectedCrop, setSelectedCrop] = useState(() => {
    if (cleanInitialCrop) return cleanInitialCrop;
    if (Array.isArray(registeredCrops) && registeredCrops.length > 0) {
      const first = registeredCrops[0];
      const name = typeof first === 'string' ? first : (first.cropName || first.name);
      if (name) return name.split(',')[0].trim();
    }
    const mainCropStr = user?.FarmerProfile?.mainCrop || user?.farmerProfile?.mainCrop;
    if (mainCropStr && typeof mainCropStr === 'string' && mainCropStr !== 'Not set') {
      const first = mainCropStr.split(',')[0].trim();
      if (first) return first;
    }
    return 'Tomato';
  });

  const [quantity, setQuantity] = useState(() => {
    if (initialWeightKg && Number(initialWeightKg) > 0) return Number(initialWeightKg);
    return 500;
  });
  const [quantityUnit, setQuantityUnit] = useState('kg'); // 'kg', 'quintal', 'tonne'
  const [pickupLocation, setPickupLocation] = useState(`${defaultDistrict}, Maharashtra`);
  const [destination, setDestination] = useState(() => {
    if (initialDestination) return initialDestination;
    return defaultDistrict.toLowerCase().includes('pune') ? 'Mumbai Vashi APMC Terminal' : `${defaultDistrict} APMC`;
  });
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('');
  const [isSharedPooling, setIsSharedPooling] = useState(true);
  const [sharingFarmersCount, setSharingFarmersCount] = useState(2);

  // Available vehicles from backend (Database source of truth)
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleFetchError, setVehicleFetchError] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // My Bookings
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'my-bookings'

  // Booking Confirmation Modal
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isGatePassModalOpen, setIsGatePassModalOpen] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Smart Shared Transport Match Suggestions (Feature 4)
  const [poolMatches, setPoolMatches] = useState([]);
  const [loadingPoolMatches, setLoadingPoolMatches] = useState(false);
  const [poolToConfirm, setPoolToConfirm] = useState(null);
  const [joiningPool, setJoiningPool] = useState(false);

  // Real-time converted weight in kg
  const totalWeightKg = useMemo(() => {
    return convertToKg(quantity, quantityUnit);
  }, [quantity, quantityUnit]);

  // Sync initial props if changed externally
  useEffect(() => {
    if (cleanInitialCrop) setSelectedCrop(cleanInitialCrop);
  }, [cleanInitialCrop]);

  useEffect(() => {
    if (initialWeightKg && Number(initialWeightKg) > 0) setQuantity(Number(initialWeightKg));
  }, [initialWeightKg]);

  useEffect(() => {
    if (initialDestination) setDestination(initialDestination);
  }, [initialDestination]);

  // Auto-fetch farmer's harvest weight for the selected crop when crops load
  useEffect(() => {
    if (farmerCropsList.length > 0 && selectedCrop && !isOtherCropSelected) {
      const match = farmerCropsList.find(
        (c) => (c.cropName || c.name || '').toLowerCase() === selectedCrop.toLowerCase()
      );
      if (match) {
        const cropWeight = Number(match.harvestQuantityKg || match.quantity || match.enteredQuantity || 0);
        if (cropWeight > 0) {
          setQuantity(cropWeight);
          if (match.unit) setQuantityUnit(match.unit);
        }
      }
    }
  }, [farmerCropsList]);

  // Update selected crop if registeredCrops changes and ensure primary crop default
  useEffect(() => {
    if (cleanInitialCrop) {
      setSelectedCrop(cleanInitialCrop);
    } else if (userRegisteredCropNames.length > 0 && !isOtherCropSelected) {
      const match = userRegisteredCropNames.find((c) => c.toLowerCase() === selectedCrop.toLowerCase());
      if (!match) {
        setSelectedCrop(userRegisteredCropNames[0]);
      }
    }
  }, [userRegisteredCropNames, cleanInitialCrop, isOtherCropSelected]);

  // Handler to select crop and automatically fetch & set user's weight for that specific crop
  const handleSelectCrop = (cropName) => {
    setSelectedCrop(cropName);
    setIsOtherCropSelected(false);

    // Auto-fetch and sync the farmer's registered harvest weight for this specific crop
    const match = farmerCropsList.find(
      (c) => (c.cropName || c.name || '').toLowerCase() === cropName.toLowerCase()
    );
    if (match) {
      const cropWeight = Number(match.harvestQuantityKg || match.quantity || match.enteredQuantity || 0);
      if (cropWeight > 0) {
        setQuantity(cropWeight);
        if (match.unit) setQuantityUnit(match.unit);
      }
    }
  };

  // Fetch verified vehicles matching crop & route from backend API
  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    setVehicleFetchError(null);
    try {
      const params = new URLSearchParams({
        crop: selectedCrop,
        weightKg: String(totalWeightKg),
        pickupLocation: pickupLocation,
        destination: destination,
        date: pickupDate,
        sharedOnly: isSharedPooling ? 'true' : 'false'
      });

      const res = await fetch(`${API_BASE_URL}/api/transport/vehicles?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token || 'guest'}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && Array.isArray(data.data)) {
        setAvailableVehicles(data.data);
        if (data.data.length > 0) {
          const matchingVehicle =
            data.data.find((v) => v.isRecommended && v.canAccommodateCargo) ||
            data.data.find((v) => v.isCropSuitable && v.canAccommodateCargo) ||
            data.data.find((v) => v.canAccommodateCargo) ||
            data.data[0];
          setSelectedVehicle(matchingVehicle);
        } else {
          setSelectedVehicle(null);
        }
      } else {
        setVehicleFetchError(data.message || 'Unable to connect to vehicle availability database');
        setAvailableVehicles([]);
        setSelectedVehicle(null);
      }
    } catch (err) {
      console.warn('Could not fetch vehicles:', err.message);
      setVehicleFetchError(err.message || 'Network error fetching verified transport vehicles');
      setAvailableVehicles([]);
      setSelectedVehicle(null);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Fetch farmer's own booking history
  const fetchMyBookings = async () => {
    if (!token || token === 'guest') return;
    setLoadingBookings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMyBookings(data.data);
      }
    } catch (err) {
      console.warn('Could not fetch my bookings:', err.message);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Smart Shared Transport Pooling Matches (Feature 4)
  const fetchPoolMatches = async () => {
    if (!isSharedPooling) return;
    try {
      setLoadingPoolMatches(true);
      const res = await fetch(`${API_BASE_URL}/api/transport/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerName: user?.name || 'Farmer',
          location: pickupLocation,
          destination,
          quantity: totalWeightKg,
          requiredDate: pickupDate,
          crop: selectedCrop
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        setPoolMatches(data.matches);
      }
    } catch (err) {
      console.warn('Could not fetch pool matches:', err.message);
    } finally {
      setLoadingPoolMatches(false);
    }
  };

  // Confirm and join an existing shared pool
  const handleConfirmJoinPool = async () => {
    if (!poolToConfirm) return;
    if (!token || !user || user.isGuest) {
      showToast({
        type: 'warning',
        title: 'Login Required',
        message: 'Please login or create an account to confirm pooled transport.'
      });
      setTimeout(() => { window.location.href = '/login'; }, 1500);
      return;
    }

    try {
      setJoiningPool(true);
      const res = await fetch(`${API_BASE_URL}/api/transport/pool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'guest'}`
        },
        body: JSON.stringify({
          vehicleId: poolToConfirm.id,
          farmerName: user?.name || 'Farmer',
          farmerPhone: user?.phone || '+91 98765 43210',
          quantity: totalWeightKg,
          crop: selectedCrop,
          pickupLocation,
          destinationMarket: destination,
          pickupDate,
          estimatedSharedCost: poolToConfirm.sharedCost
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to join pool');
      }

      setConfirmedBooking(json.data);
      setIsGatePassModalOpen(true);
      setPoolToConfirm(null);
      setSelectedVehicle(null);
      setActiveTab('my-bookings');

      showToast({
        type: 'celebrate',
        title: '🎉 Joined Shared Pool Successfully!',
        message: `Booking #${json.bookingId} confirmed! You saved ₹${poolToConfirm.savings.toLocaleString('en-IN')}!`,
        duration: 5000
      });

      fetchMyBookings();
      fetchVehicles();
      fetchPoolMatches();
    } catch (err) {
      showToast({ type: 'error', title: 'Pooling Failed', message: err.message });
    } finally {
      setJoiningPool(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [selectedCrop, totalWeightKg, destination, pickupDate, isSharedPooling, token]);

  useEffect(() => {
    if (isSharedPooling) {
      fetchPoolMatches();
    }
  }, [selectedCrop, totalWeightKg, destination, pickupDate, isSharedPooling]);

  useEffect(() => {
    fetchMyBookings();
  }, [token]);

  // Handle Booking Creation
  const handleCreateBooking = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Authentication guard: Unauthenticated visitors can view but cannot book
    if (!token || !user || user.isGuest) {
      showToast({ 
        type: 'warning', 
        title: 'Login Required', 
        message: 'Please login or create an account to book transport dispatch. Guests can explore routes and prices in read-only mode.' 
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }

    if (!selectedCrop || !pickupLocation.trim() || !destination.trim()) {
      showToast({ type: 'error', title: 'Missing Information', message: 'Please select crop, pickup and destination.' });
      return;
    }

    if (totalWeightKg <= 0) {
      showToast({ type: 'error', title: 'Invalid Quantity', message: 'Quantity must be greater than 0.' });
      return;
    }

    if (!selectedVehicle || !selectedVehicle.id) {
      showToast({ type: 'warning', title: 'Vehicle Required', message: 'Please select an available vehicle from the verified database list.' });
      return;
    }

    setSubmittingBooking(true);

    try {
      const payload = {
        farmerName: user.name,
        farmerPhone: user.phone || '',
        cropName: selectedCrop,
        quantity: Number(quantity),
        quantityUnit: quantityUnit,
        weightKg: totalWeightKg,
        pickupLocation: pickupLocation.trim(),
        destinationMarket: destination.trim(),
        pickupDate: pickupDate,
        preferredDeliveryDate: preferredDeliveryDate || null,
        bookingType: isSharedPooling ? 'shared' : 'individual',
        sharingFarmersCount: isSharedPooling ? sharingFarmersCount : 1,
        vehicleId: selectedVehicle?.id || null,
        vehicleType: selectedVehicle?.vehicleType || 'Tata Ace / Mini Truck',
        estimatedSharedCost: isSharedPooling
          ? (selectedVehicle?.estimatedSharedFare || 1200)
          : (selectedVehicle?.estimatedSoloFare || 2400)
      };

      const res = await fetch(`${API_BASE_URL}/api/transport/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'guest'}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Booking submission failed');
      }

      setConfirmedBooking(json.data);
      setIsGatePassModalOpen(true);
      setSelectedVehicle(null);
      setActiveTab('my-bookings');

      showToast({
        type: 'celebrate',
        title: '🎉 Transport Booked Successfully!',
        message: `Booking #${json.bookingId} confirmed! Assigned: ${json.data?.driverName || 'Driver'}. Digital Gate Pass issued.`,
        duration: 5000
      });

      fetchMyBookings();
      fetchVehicles();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('harvestmitra:booking-created', { detail: json.data }));
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Booking Failed', message: err.message });
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Handle Cancellation
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this transport booking?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'Cancelled by farmer' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to cancel');
      }
      showToast({ type: 'info', title: 'Booking Cancelled', message: 'Your booking has been cancelled and vehicle capacity freed.' });
      fetchMyBookings();
      fetchVehicles();
    } catch (err) {
      showToast({ type: 'error', title: 'Cancellation Error', message: err.message });
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'driver_assigned':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">{t('farmerTransport.statusDriverAssignedBadge', 'Confirmed • Driver Assigned')}</span>;
      case 'in_transit':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">{t('farmerTransport.statusInTransitBadge', '🛣️ In Transit')}</span>;
      case 'delivered':
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{t('farmerTransport.statusDeliveredMandi', '✓ Delivered at Mandi')}</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">{t('farmerTransport.statusCancelled', 'Cancelled')}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">{t('farmerTransport.statusPendingReview', 'Pending Review')}</span>;
    }
  };

  return (
    <div id="shared-transport-section" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Digital Mandi Gate Pass Modal */}
      {confirmedBooking && (
        <DigitalGatePassModal
          isOpen={isGatePassModalOpen}
          booking={confirmedBooking}
          onClose={() => setIsGatePassModalOpen(false)}
        />
      )}

      {/* Pool Join Confirmation Modal (Feature 4 Requirement F4.5) */}
      {poolToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Users className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Confirm Shared Transport Pooling
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPoolToConfirm(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Trip & Route Verification
                </span>
                <p className="font-bold text-slate-900">
                  {poolToConfirm.vehicleType} ({poolToConfirm.vehicleNumber})
                </p>
                <p className="text-slate-600">
                  Driver: <strong>{poolToConfirm.driverName}</strong> ({poolToConfirm.driverPhone})
                </p>
                <p className="text-slate-600">
                  Route: <strong>{pickupLocation}</strong> ➔ <strong>{destination}</strong>
                </p>
                <p className="text-slate-600">
                  Scheduled Date: <strong>{pickupDate}</strong> (Est. Departure {poolToConfirm.departureTime})
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span>Your Cargo:</span>
                  <span className="font-bold">{totalWeightKg} kg ({selectedCrop})</span>
                </div>
                <div className="flex justify-between">
                  <span>Solo Booking Fare:</span>
                  <span className="line-through text-slate-400">{formatINR(poolToConfirm.soloCost)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-extrabold text-sm border-t border-slate-200 pt-1">
                  <span>Your Pooled Fare:</span>
                  <span>{formatINR(poolToConfirm.sharedCost)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold text-[11px]">
                  <span>Total Savings:</span>
                  <span>+{formatINR(poolToConfirm.savings)} ({poolToConfirm.savingsPercent}%)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero-conflict guarantee: Capacity, route, and cargo compatibility verified against active bookings.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPoolToConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={joiningPool}
                onClick={handleConfirmJoinPool}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {joiningPool ? 'Booking Pool...' : 'Confirm & Issue Gate Pass'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Dual Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {t('farmerTransport.widgetTitle', 'Shared Transport & Crop Vehicle Booking')}
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {t('farmerTransport.savingsBadge', '50% Freight Savings')}
              </span>
            </div>
            <p className="text-xs text-muted">
              {t('farmerTransport.widgetSubtitle', 'Select your crop, choose a verified vehicle suited for your harvest, and book solo or pooled transport.')}
            </p>
          </div>
        </div>

        {/* View Switcher: Book vs My Bookings */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={`py-1.5 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'book'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-primary" />
            <span>{t('farmerTransport.bookTransportTab', 'Book Transport')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-bookings')}
            className={`py-1.5 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my-bookings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('farmerTransport.myBookingsTab', 'My Bookings')} ({myBookings.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'book' ? (
        <form onSubmit={handleCreateBooking} className="space-y-6">
          {/* SECTION A: DYNAMIC CROP SELECTOR */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span>{t('farmerTransport.step1Crop', 'Step 1: Select Crop to Transport *')}</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted hidden sm:inline">
                  {userRegisteredCropNames.length > 0 ? t('farmerTransport.loadedFromRegistered', 'Loaded from your Registered Crops') : t('farmerTransport.selectCommodity', 'Select commodity')}
                </span>
                <button
                  type="button"
                  id="all-commodities-toggle"
                  onClick={() => setShowAllCommodities((prev) => !prev)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    showAllCommodities
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{showAllCommodities ? t('farmerTransport.showOnlyMyCrops', 'Show Only My Crops') : t('farmerTransport.allCommodities', 'All Commodities')}</span>
                </button>
              </div>
            </div>

            {/* Display farmer's registered crops first with green '🌾 Registered Crop' badge */}
            {userRegisteredCropNames.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {userRegisteredCropNames.map((cropName) => {
                    const cropMeta = getCropMeta(cropName);
                    const foundCrop = farmerCropsList.find(
                      (c) => (c.cropName || c.name || '').toLowerCase() === cropName.toLowerCase()
                    );
                    const registeredWeight = Number(foundCrop?.harvestQuantityKg || foundCrop?.quantity || foundCrop?.enteredQuantity || 0);
                    const isSelected = !isOtherCropSelected && selectedCrop?.toLowerCase() === cropName.toLowerCase();
                    return (
                      <button
                        key={cropName}
                        type="button"
                        onClick={() => handleSelectCrop(cropName)}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-emerald-50/80 ring-2 ring-primary/20 shadow-xs'
                            : 'border-emerald-200/90 bg-emerald-50/30 hover:bg-emerald-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{cropMeta.icon}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="mt-1.5 space-y-1">
                          <span className="text-xs font-black text-slate-900 block truncate">
                            {cropName}
                          </span>
                          <span className="text-[9.5px] text-muted font-medium block truncate">
                            {cropMeta.vehicleHint}
                          </span>
                          <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-300/80 px-1.5 py-0.5 rounded-full">
                            {t('farmerTransport.registeredCropBadge', '🌾 Registered Crop')}{registeredWeight > 0 ? ` • ${registeredWeight} kg` : ''}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* NEW 'Other' Crop Option Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtherCropSelected(true);
                      setSelectedCrop(customCropName.trim() || 'Other');
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isOtherCropSelected
                        ? 'border-primary bg-emerald-50/90 ring-2 ring-primary/20 shadow-xs'
                        : 'border-dashed border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">📦</span>
                      {isOtherCropSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="mt-1.5 space-y-1">
                      <span className="text-xs font-black text-slate-900 block truncate">
                        {customCropName.trim() ? customCropName : t('farmerTransport.otherCrop', 'Other Crop')}
                      </span>
                      <span className="text-[9.5px] text-muted font-medium block truncate">
                        {t('farmerTransport.customAgriTransport', 'Custom Agri Transport')}
                      </span>
                      <span className="inline-flex items-center text-[9px] font-bold text-teal-800 bg-teal-100/90 border border-teal-300 px-1.5 py-0.5 rounded-full">
                        {t('farmerTransport.otherOption', '➕ Other Option')}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Custom Crop Input Box when 'Other Crop' is selected */}
                {isOtherCropSelected && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-300/80 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                        <span>{t('farmerTransport.specifyOtherCrop', 'Specify Your Other Crop / Harvest Produce:')}</span>
                      </label>
                      <span className="text-[10px] text-muted font-medium">{t('farmerTransport.specifyOtherCropDesc', 'Type any crop name to assign specialized transport')}</span>
                    </div>
                    <input
                      type="text"
                      value={customCropName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomCropName(val);
                        setSelectedCrop(val.trim() || 'Other');
                      }}
                      placeholder="e.g. Maize, Sugarcane, Chana / Gram, Ginger, Turmeric, Garlic..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary shadow-2xs"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] font-semibold text-slate-500">{t('farmerTransport.quickSuggestions', 'Quick suggestions:')}</span>
                      {['Maize', 'Sugarcane', 'Chana / Gram', 'Pomegranate', 'Ginger', 'Turmeric', 'Garlic'].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setCustomCropName(sug);
                            setSelectedCrop(sug);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all border cursor-pointer ${
                            selectedCrop === sug
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-primary hover:text-primary'
                          }`}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* All Commodities (visible either if toggled ON or if farmer has no registered crops) */}
            {(showAllCommodities || userRegisteredCropNames.length === 0) && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                {userRegisteredCropNames.length > 0 && (
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {t('farmerTransport.allMarketCommodities', 'All Market Commodities:')}
                  </span>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SUPPORTED_CROPS.filter(
                    (c) => !userRegisteredCropNames.some((rc) => rc.toLowerCase() === c.name.toLowerCase())
                  ).map((crop) => {
                    const isSelected = !isOtherCropSelected && selectedCrop?.toLowerCase() === crop.name.toLowerCase();
                    return (
                      <button
                        key={crop.name}
                        type="button"
                        onClick={() => {
                          if (crop.name.toLowerCase() === 'other') {
                            setIsOtherCropSelected(true);
                            setSelectedCrop(customCropName.trim() || 'Other');
                          } else {
                            handleSelectCrop(crop.name);
                          }
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-emerald-50/70 ring-2 ring-primary/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{crop.icon}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="mt-1">
                          <span className="text-xs font-black text-slate-900 block truncate">
                            {crop.name}
                          </span>
                          <span className="text-[9.5px] text-muted font-medium block truncate">
                            {crop.vehicleHint}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION B: HARVEST DETAILS & UNIT CONVERTER */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-primary" />
                <span>{t('farmerTransport.step2Harvest', 'Step 2: Harvest Details & Quantities *')}</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                {t('farmerTransport.calculatedCargo', 'Calculated Cargo: {weight} kg', { weight: totalWeightKg.toLocaleString('en-IN') })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Quantity + Unit */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t('farmerTransport.harvestQtyUnit', 'Harvest Quantity & Unit *')}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold outline-none focus:border-primary"
                  />
                  {/* Unit buttons: kg, quintal, tonne */}
                  <div className="inline-flex rounded-xl border border-slate-300 bg-slate-100 p-0.5 text-xs font-bold">
                    {['kg', 'quintal', 'tonne'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setQuantityUnit(u)}
                        className={`px-2 py-1 rounded-lg transition-all ${
                          quantityUnit === u
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-slate-600 hover:text-black'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-muted block font-mono">
                  {quantityUnit === 'quintal' && `(= ${quantity} × 100 kg = ${totalWeightKg} kg)`}
                  {quantityUnit === 'tonne' && `(= ${quantity} × 1,000 kg = ${totalWeightKg} kg)`}
                  {quantityUnit === 'kg' && t('farmerTransport.standardKg', 'Standard metric kilograms')}
                </span>
              </div>

              {/* Pickup Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{t('farmerTransport.pickupLocation', 'Pickup Location (Farm / Taluka) *')}</span>
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Pune, Maharashtra"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>

              {/* Delivery Destination APMC */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-primary" />
                  <span>{t('farmerTransport.deliveryDestination', 'Delivery Destination (APMC) *')}</span>
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                >
                  {MAHARASHTRA_DESTINATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" />
                  <span>{t('farmerTransport.pickupDate', 'Pickup Date *')}</span>
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted" />
                  <span>{t('farmerTransport.preferredDelivery', 'Preferred Delivery Window (Optional)')}</span>
                </label>
                <input
                  type="date"
                  value={preferredDeliveryDate}
                  min={pickupDate}
                  onChange={(e) => setPreferredDeliveryDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* SECTION C & D: CROP-BASED VEHICLE OPTIONS & SHARED TRANSPORT TOGGLE */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  <span>{t('farmerTransport.step3Vehicle', 'Step 3: Crop-Specific Vehicle Selection *')}</span>
                </label>
                <p className="text-[11px] text-muted">
                  {t('farmerTransport.showingVehiclesFor', 'Showing verified vehicles suitable for {crop} ({weight} kg load).', { crop: selectedCrop, weight: totalWeightKg })}
                </p>
              </div>

              {/* Shared Transport Toggle */}
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-emerald-50 border border-emerald-300">
                <input
                  type="checkbox"
                  id="shared-pooling-toggle"
                  checked={isSharedPooling}
                  onChange={(e) => setIsSharedPooling(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="shared-pooling-toggle" className="text-xs font-bold text-emerald-950 cursor-pointer flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t('farmerTransport.sharedPoolingDiscount', 'Shared Pooling (Split Freight)')}</span>
                </label>
              </div>
            </div>

            {/* FEATURE 4: Active Shared Pooling Match Suggestions */}
            {isSharedPooling && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-slate-50 border border-emerald-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                      <Users className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <span>Compatible Shared Pooling Matches</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                          {poolMatches.length} Matches Found
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Join an active verified APMC trip along your route to split freight fares and prevent empty-truck return runs.
                      </p>
                    </div>
                  </div>
                  {loadingPoolMatches && (
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {poolMatches.map((match) => {
                    const combinedWeight = (match.currentLoad || 0) + totalWeightKg;
                    const capacityPercent = Math.min(100, Math.round((combinedWeight / match.capacity) * 100));

                    return (
                      <div
                        key={match.id}
                        className="p-3.5 rounded-xl bg-white border border-emerald-200/90 shadow-2xs hover:shadow-sm transition-all space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-black text-slate-900">
                              {match.vehicleType}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {match.vehicleNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-600">
                            <span>Driver: <strong>{match.driverName}</strong></span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold">Departs: {match.departureTime}</span>
                          </div>
                          
                          {/* Co-Farmers List */}
                          {match.coFarmers && match.coFarmers.length > 0 && (
                            <div className="text-[10.5px] bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-0.5">
                              <span className="text-slate-500 font-bold block text-[10px] uppercase">
                                Co-Farmers Onboard:
                              </span>
                              {match.coFarmers.map((cf, idx) => (
                                <div key={idx} className="flex justify-between text-slate-700">
                                  <span>👤 {cf.farmerName}</span>
                                  <span className="font-semibold">{cf.quantity} kg ({cf.crop})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Capacity meter */}
                        <div className="space-y-1 text-[10.5px]">
                          <div className="flex justify-between text-slate-600 font-medium">
                            <span>Combined Load: <strong>{combinedWeight.toLocaleString('en-IN')} kg</strong></span>
                            <span>Capacity: <strong>{match.capacity.toLocaleString('en-IN')} kg</strong></span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                capacityPercent > 90 ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${capacityPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold block text-right">
                            Space Remaining: {Math.max(0, match.capacity - combinedWeight)} kg free
                          </span>
                        </div>

                        {/* Pricing & CTA */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block line-through">
                              Solo: {formatINR(match.soloCost)}
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-black text-emerald-800">
                                {formatINR(match.sharedCost)}
                              </span>
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                Save {formatINR(match.savings)} ({match.savingsPercent}%)
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPoolToConfirm(match)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <span>Join Pool</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Vehicle Cards Grid */}
            {loadingVehicles ? (
              <div className="p-8 text-center text-xs text-muted space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
                <span>{t('farmerTransport.checkingVehicles', 'Checking verified vehicle availability across APMC corridors...')}</span>
              </div>
            ) : vehicleFetchError ? (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
                <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
                <h4 className="text-sm font-bold text-rose-900">Transport Database Unavailable</h4>
                <p className="text-xs text-rose-800">{vehicleFetchError}</p>
                <button
                  type="button"
                  onClick={fetchVehicles}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
              </div>
            ) : availableVehicles.length === 0 ? (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
                <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                <h4 className="text-sm font-bold text-amber-900">{t('farmerTransport.noVehiclesTitle', 'No Vehicles Directly Available for {weight} kg', { weight: totalWeightKg })}</h4>
                <p className="text-xs text-amber-800">
                  {t('farmerTransport.noVehiclesDesc', 'Try reducing quantity, adjusting pickup date, or switching from shared to solo carrier.')}
                </p>
                <button
                  type="button"
                  onClick={fetchVehicles}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-400 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Availability</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableVehicles.map((vehicle) => {
                  const isSelected = selectedVehicle?.id === vehicle.id;
                  const estimatedFare = isSharedPooling ? vehicle.estimatedSharedFare : vehicle.estimatedSoloFare;
                  const savings = Math.max(0, (vehicle.estimatedSoloFare || 0) - (vehicle.estimatedSharedFare || 0));
                  const savingsPercent = vehicle.estimatedSoloFare > 0 ? Math.round((savings / vehicle.estimatedSoloFare) * 100) : 0;

                  const userActiveBooking = myBookings.find(
                    (b) => Number(b.vehicleId) === Number(vehicle.id) && !['delivered', 'completed', 'cancelled', 'rejected'].includes(b.status)
                  );

                  return (
                    <div
                      key={vehicle.id}
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                        userActiveBooking
                          ? 'border-emerald-500 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-400'
                          : isSelected
                          ? 'border-primary bg-emerald-50/50 shadow-md ring-2 ring-primary/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      {userActiveBooking ? (
                        <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                          <span>Booked by You ({userActiveBooking.weightKg} kg)</span>
                        </div>
                      ) : isSelected ? (
                        <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <Check className="w-3 h-3" /> {t('farmerTransport.selectedVehicleBadge', 'Selected Vehicle')}
                        </div>
                      ) : null}

                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-black text-slate-900 leading-snug">
                            {vehicle.vehicleType}
                          </h4>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                            {vehicle.registrationNumber}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {vehicle.isRecommended && (
                            <span className="text-[9.5px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              {t('farmerTransport.recommendedFor', '⭐️ Recommended for {crop}', { crop: selectedCrop })}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                            {vehicle.cropSuitabilityReason}
                          </span>
                        </div>
                      </div>

                      {/* Specs Matrix */}
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200/90">
                        <div>
                          <span className="text-muted block text-[10px]">{t('farmerTransport.totalCapacity', 'Total Capacity:')}</span>
                          <span className="font-bold text-slate-900 font-mono">
                            {vehicle.capacityKg.toLocaleString('en-IN')} kg
                          </span>
                        </div>
                        <div>
                          <span className="text-muted block text-[10px]">{t('farmerTransport.spaceAvailable', 'Space Available:')}</span>
                          <span className="font-bold text-emerald-700 font-mono">
                            {vehicle.remainingCapacityKg.toLocaleString('en-IN')} kg {t('farmerTransport.free', 'free')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted block text-[10px]">{t('farmerTransport.driver', 'Driver:')}</span>
                          <span className="font-semibold text-slate-800 block truncate">
                            {vehicle.driverName}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted block text-[10px]">{t('farmerTransport.route', 'Route:')}</span>
                          <span className="font-semibold text-slate-800 block truncate">
                            {vehicle.baseLocation || 'Pune'} ➔ APMC
                          </span>
                        </div>
                      </div>

                      {/* Pricing Details */}
                      <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-muted block">
                            {isSharedPooling ? t('farmerTransport.estimatedSharedFare', 'Estimated Shared Fare:') : t('farmerTransport.soloTruckFare', 'Solo Truck Fare:')}
                          </span>
                          <span className="text-base font-black text-slate-900">
                            {formatINR(estimatedFare)}
                          </span>
                        </div>

                        {isSharedPooling && (
                          <div className="text-right">
                            {savings > 0 ? (
                              <>
                                <span className="text-[10px] text-emerald-700 font-bold block">
                                  {t('farmerTransport.saveBadge', 'Save +{amount}!', { amount: formatINR(savings) })}
                                </span>
                                <span className="text-[9px] text-muted font-mono">{savingsPercent}% Pool Savings</span>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold block">
                                Shared Fare
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SHARED TRANSPORT POOLING SUMMARY BREAKDOWN */}
          {isSharedPooling && selectedVehicle && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('farmerTransport.poolTransparencyTitle', 'Shared Pooling Cost & Space Transparency')}</span>
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {t('farmerTransport.totalFareSplit', 'Total Fare: {fare} (Split Proportionally)', { fare: formatINR(selectedVehicle.estimatedSoloFare) })}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-muted block">{t('farmerTransport.yourCargoShare', 'Your Cargo Share')}</span>
                  <span className="font-black text-slate-900 font-mono">
                    {totalWeightKg.toLocaleString('en-IN')} kg
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-muted block">{t('farmerTransport.remainingTruckSpace', 'Remaining Truck Space')}</span>
                  <span className="font-black text-emerald-700 font-mono">
                    {(selectedVehicle.remainingCapacityKg - totalWeightKg >= 0 
                      ? selectedVehicle.remainingCapacityKg - totalWeightKg 
                      : 0).toLocaleString('en-IN')} kg
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-muted block">{t('farmerTransport.yourEstimatedFare', 'Your Estimated Fare')}</span>
                  <span className="font-black text-primary font-mono text-sm">
                    {formatINR(selectedVehicle.estimatedSharedFare)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-muted block">{t('farmerTransport.yourCashSavings', 'Your Cash Savings')}</span>
                  <span className="font-black text-emerald-600 font-mono text-sm">
                    +{formatINR(selectedVehicle.estimatedSoloFare - selectedVehicle.estimatedSharedFare)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('farmerTransport.qrPassNotice', 'Verifiable Digital Mandi Gate Pass with QR code generated immediately upon confirmation.')}</span>
            </div>

            <button
              type="submit"
              disabled={submittingBooking || availableVehicles.length === 0}
              className={`btn-primary py-3 px-6 rounded-2xl text-xs font-bold inline-flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                submittingBooking || availableVehicles.length === 0 ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {submittingBooking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('farmerTransport.securingVehicle', 'Securing Vehicle & Space...')}</span>
                </>
              ) : (
                <>
                  <span>{t('farmerTransport.confirmTransportBooking', 'Confirm Transport Booking ({fare})', { fare: formatINR(isSharedPooling ? selectedVehicle?.estimatedSharedFare || 1200 : selectedVehicle?.estimatedSoloFare || 2400) })}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* MY BOOKINGS TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {t('farmerTransport.bookingHistoryHeading', 'Your Transport Booking History & Active Dispatches')}
            </span>
            <button
              type="button"
              onClick={fetchMyBookings}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBookings ? 'animate-spin' : ''}`} />
              <span>{t('farmerTransport.refreshStatus', 'Refresh Status')}</span>
            </button>
          </div>

          {loadingBookings ? (
            <div className="p-8 text-center text-xs text-muted">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
              <span>{t('farmerTransport.loadingRecords', 'Loading your transport records...')}</span>
            </div>
          ) : myBookings.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <Truck className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">{t('farmerTransport.noBookingsYetTitle', 'No Transport Bookings Yet')}</h4>
              <p className="text-xs text-muted">
                {t('farmerTransport.noBookingsYetDesc', 'Choose your crop and book a verified vehicle above to view live transit milestones here.')}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('book')}
                className="btn-primary py-2 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 mt-2 cursor-pointer"
              >
                <span>{t('farmerTransport.bookTransportNowBtn', 'Book Transport Now')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        #{booking.bookingId || `BK-${booking.id}`}
                      </span>
                      {getStatusBadge(booking.status)}
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {booking.bookingType === 'shared' ? t('farmerTransport.sharedPooling', 'Shared Pooling') : t('farmerTransport.individualDedicated', 'Individual Dedicated')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmedBooking(booking);
                          setIsGatePassModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{t('farmerTransport.digitalGatePassBtn', 'Digital Gate Pass')}</span>
                      </button>

                      {['pending', 'confirmed'].includes(booking.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 cursor-pointer"
                        >
                          {t('farmerTransport.cancelBtn', 'Cancel')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted block text-[10px]">{t('farmerTransport.cropAndWeight', 'Crop & Weight')}</span>
                      <span className="font-bold text-slate-900">
                        {booking.cropName} • {booking.weightKg?.toLocaleString('en-IN')} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">{t('farmerTransport.route', 'Route')}</span>
                      <span className="font-bold text-slate-800 block truncate">
                        {booking.pickupLocation} ➔ {booking.destinationMarket}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">{t('farmerTransport.vehicleAndDriver', 'Vehicle & Driver')}</span>
                      <span className="font-bold text-slate-800 block truncate">
                        {booking.driverName || 'Verified Driver'} ({booking.vehicleNumber || 'MH-APMC'})
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">{t('farmerTransport.fare', 'Fare')}</span>
                      <span className="font-black text-emerald-700 font-mono">
                        {formatINR(booking.estimatedSharedCost || 1200)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Digital Mandi Gate Pass Modal */}
      {confirmedBooking && (
        <DigitalGatePassModal
          isOpen={isGatePassModalOpen}
          booking={confirmedBooking}
          onClose={() => {
            setIsGatePassModalOpen(false);
            setActiveTab('my-bookings');
          }}
        />
      )}
    </div>
  );
}
