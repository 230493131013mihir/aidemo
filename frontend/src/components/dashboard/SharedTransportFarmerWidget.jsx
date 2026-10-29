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

function formatISTDateTime(dateValue) {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
  const timePart = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
  return `${datePart}, ${timePart} IST`;
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

  // Default primary initial crop
  const defaultInitialCrop = useMemo(() => {
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
  }, [cleanInitialCrop, registeredCrops, user]);

  // Form State - Multiple Selected Crops Array (Part 1 requirement)
  const [selectedCrops, setSelectedCrops] = useState(() => [defaultInitialCrop]);

  // Per-Crop Quantities & Units dictionary (Part 2 requirement)
  const [cropQuantities, setCropQuantities] = useState(() => {
    const initQty = initialWeightKg && Number(initialWeightKg) > 0 ? Number(initialWeightKg) : 500;
    return {
      [defaultInitialCrop]: { quantity: initQty, unit: 'kg' }
    };
  });

  // String crop identifier for API compatibility
  const selectedCrop = useMemo(() => selectedCrops.join(', '), [selectedCrops]);

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

  // Combined total cargo in kg and per-crop itemized breakdown (Part 1 & 2 requirements)
  const { totalWeightKg, cropBreakdown } = useMemo(() => {
    let sumKg = 0;
    const breakdown = selectedCrops.map((cName) => {
      const item = cropQuantities[cName] || { quantity: 500, unit: 'kg' };
      const weightInKg = convertToKg(item.quantity, item.unit);
      sumKg += weightInKg;
      return {
        cropName: cName,
        quantity: item.quantity,
        quantityUnit: item.unit,
        weightKg: weightInKg
      };
    });
    return { totalWeightKg: sumKg, cropBreakdown: breakdown };
  }, [selectedCrops, cropQuantities]);

  // Active booking statuses indicating ongoing reservation
  const ACTIVE_BOOKING_STATUSES = useMemo(() => [
    'open', 'pending', 'confirmed', 'accepted', 'driver_assigned',
    'vehicle_assigned', 'awaiting_pickup', 'pickup_confirmed', 'in_transit', 'arrived_destination'
  ], []);

  // Helper to determine if the currently logged-in farmer already has an active booking on a vehicle
  const getUserBookingForVehicle = React.useCallback((vehicle) => {
    if (!vehicle) return null;
    if (vehicle.userActiveBooking) return vehicle.userActiveBooking;
    return (
      myBookings.find(
        (b) => Number(b.vehicleId) === Number(vehicle.id) &&
               ACTIVE_BOOKING_STATUSES.includes(b.status) &&
               (!selectedCrop || b.cropName?.toLowerCase() === selectedCrop?.toLowerCase()) &&
               (!pickupDate || b.pickupDate === pickupDate)
      ) ||
      myBookings.find(
        (b) => Number(b.vehicleId) === Number(vehicle.id) &&
               ACTIVE_BOOKING_STATUSES.includes(b.status)
      ) ||
      null
    );
  }, [myBookings, selectedCrop, pickupDate, ACTIVE_BOOKING_STATUSES]);

  // Existing booking on currently selected vehicle for this requirement
  const selectedVehicleBooking = useMemo(() => {
    if (!selectedVehicle) return null;
    return getUserBookingForVehicle(selectedVehicle);
  }, [selectedVehicle, getUserBookingForVehicle]);

  // Sync initial props if changed externally
  useEffect(() => {
    if (cleanInitialCrop) {
      setSelectedCrops((prev) => {
        if (!prev.some((c) => c.toLowerCase() === cleanInitialCrop.toLowerCase())) {
          return [cleanInitialCrop, ...prev];
        }
        return prev;
      });
    }
  }, [cleanInitialCrop]);

  useEffect(() => {
    if (initialDestination) setDestination(initialDestination);
  }, [initialDestination]);

  // Sync registered crop weights when farmerCropsList loads
  useEffect(() => {
    if (farmerCropsList.length > 0) {
      setCropQuantities((prev) => {
        const next = { ...prev };
        farmerCropsList.forEach((c) => {
          const name = (c.cropName || c.name || '').trim();
          if (name && !next[name]) {
            const cropWeight = Number(c.harvestQuantityKg || c.quantity || c.enteredQuantity || 0);
            if (cropWeight > 0) {
              next[name] = { quantity: cropWeight, unit: c.unit || 'kg' };
            }
          }
        });
        return next;
      });
    }
  }, [farmerCropsList]);

  // Multi-crop toggle handler: Clicking an unselected crop selects it, clicking a selected crop deselects it
  const handleToggleCrop = (cropName) => {
    if (!cropName) return;
    const trimmed = String(cropName).trim();
    setIsOtherCropSelected(false);
    setSelectedCrops((prev) => {
      const exists = prev.some((c) => c.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        return prev.filter((c) => c.toLowerCase() !== trimmed.toLowerCase());
      } else {
        return [...prev, trimmed];
      }
    });

    setCropQuantities((prev) => {
      if (prev[trimmed]) return prev;
      const match = farmerCropsList.find(
        (c) => (c.cropName || c.name || '').toLowerCase() === trimmed.toLowerCase()
      );
      const cropWeight = Number(match?.harvestQuantityKg || match?.quantity || match?.enteredQuantity || 0);
      return {
        ...prev,
        [trimmed]: {
          quantity: cropWeight > 0 ? cropWeight : 500,
          unit: match?.unit || 'kg'
        }
      };
    });
  };

  const handleUpdateCropQuantity = (cropName, val) => {
    const qty = Math.max(0, Number(val) || 0);
    setCropQuantities((prev) => ({
      ...prev,
      [cropName]: {
        ...(prev[cropName] || { unit: 'kg' }),
        quantity: qty
      }
    }));
  };

  const handleUpdateCropUnit = (cropName, unit) => {
    setCropQuantities((prev) => ({
      ...prev,
      [cropName]: {
        ...(prev[cropName] || { quantity: 500 }),
        unit
      }
    }));
  };

  const handleRemoveCrop = (cropName) => {
    setSelectedCrops((prev) => prev.filter((c) => c.toLowerCase() !== cropName.toLowerCase()));
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
  }, [selectedCrops, totalWeightKg, destination, pickupDate, isSharedPooling, token]);

  useEffect(() => {
    if (isSharedPooling) {
      fetchPoolMatches();
    }
  }, [selectedCrops, totalWeightKg, destination, pickupDate, isSharedPooling]);

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

    if (selectedCrops.length === 0) {
      showToast({ type: 'warning', title: 'Crop Required', message: 'Please select at least one crop before submitting a booking.' });
      return;
    }

    if (!pickupLocation.trim() || !destination.trim()) {
      showToast({ type: 'error', title: 'Missing Information', message: 'Please enter pickup location and destination mandi.' });
      return;
    }

    if (totalWeightKg <= 0) {
      showToast({ type: 'error', title: 'Invalid Quantity', message: 'Total cargo weight must be greater than 0 kg.' });
      return;
    }

    if (!selectedVehicle || !selectedVehicle.id) {
      showToast({ type: 'warning', title: 'Vehicle Required', message: 'Please select an available vehicle from the verified database list.' });
      return;
    }

    if (selectedVehicleBooking) {
      showToast({
        type: 'warning',
        title: 'Already Booked',
        message: `You already have an active booking (#${selectedVehicleBooking.bookingId || selectedVehicleBooking.id}) on this vehicle. Check My Bookings.`
      });
      return;
    }

    if (selectedVehicle.isDedicatedReserved) {
      showToast({
        type: 'error',
        title: 'Vehicle Dedicated Reserved',
        message: 'This vehicle is reserved for dedicated transport on this date. Please select another vehicle.'
      });
      return;
    }

    if (selectedVehicle.isFullyBooked || (selectedVehicle.remainingCapacityKg !== undefined && selectedVehicle.remainingCapacityKg <= 0)) {
      showToast({
        type: 'error',
        title: 'Vehicle Fully Booked',
        message: 'This vehicle is fully booked for this date. Please select another vehicle.'
      });
      return;
    }

    if (selectedVehicle.remainingCapacityKg !== undefined && totalWeightKg > selectedVehicle.remainingCapacityKg) {
      showToast({
        type: 'error',
        title: 'Insufficient Vehicle Capacity',
        message: `Requested ${totalWeightKg} kg exceeds remaining capacity of ${selectedVehicle.remainingCapacityKg} kg.`
      });
      return;
    }

    setSubmittingBooking(true);

    try {
      const payload = {
        farmerName: user.name,
        farmerPhone: user.phone || '',
        cropName: selectedCrops.join(', '),
        selectedCrops: cropBreakdown,
        quantity: totalWeightKg,
        quantityUnit: 'kg',
        weightKg: totalWeightKg,
        pickupLocation: pickupLocation.trim(),
        destinationMarket: destination.trim(),
        pickupDate: pickupDate,
        preferredDeliveryDate: preferredDeliveryDate || null,
        bookingType: isSharedPooling ? 'shared' : 'dedicated',
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

      const json = await res.json().catch(() => ({}));
      if (res.status === 409 || !res.ok || !json.success) {
        // Authoritative reload of vehicles and bookings on conflict
        await Promise.all([fetchVehicles(), fetchMyBookings()]);
        const isDuplicate = json.code === 'DUPLICATE_BOOKING';
        const isFull = json.code === 'VEHICLE_FULLY_BOOKED';
        showToast({
          type: 'error',
          title: isDuplicate ? 'Duplicate Booking Prevented' : isFull ? 'Vehicle Fully Booked' : 'Booking Error',
          message: json.message || 'Server rejected booking due to existing active reservation or capacity limits.'
        });
        return;
      }

      setConfirmedBooking(json.data);
      setIsGatePassModalOpen(true);
      setSelectedVehicle(null);
      await Promise.all([fetchMyBookings(), fetchVehicles()]);
      setActiveTab('my-bookings');

      showToast({
        type: 'celebrate',
        title: '🎉 Transport Booked Successfully!',
        message: `Booking #${json.bookingId} confirmed! Assigned: ${json.data?.driverName || 'Driver'}. Digital Gate Pass issued.`,
        duration: 5000
      });

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

  // Semantic Status Badge Helper adhering to Transport Color System
  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">✓ Confirmed</span>;
      case 'driver_assigned':
      case 'vehicle_assigned':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">🚚 Driver Assigned</span>;
      case 'awaiting_pickup':
      case 'pickup_confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">📦 Awaiting Pickup</span>;
      case 'in_transit':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200 animate-pulse">🛣️ In Transit</span>;
      case 'delivered':
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">✓ Delivered at Mandi</span>;
      case 'cancelled':
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">✕ Cancelled</span>;
      case 'pending':
      case 'open':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">⏳ Awaiting Transporter Confirmation</span>;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <Users className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Confirm Shared Transport Pooling
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPoolToConfirm(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 space-y-1.5">
                <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
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
                <div className="flex justify-between text-blue-900 font-extrabold text-sm border-t border-slate-200 pt-1">
                  <span>Your Pooled Fare:</span>
                  <span>{formatINR(poolToConfirm.sharedCost)}</span>
                </div>
                <div className="flex justify-between text-purple-700 font-bold text-[11px]">
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
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {joiningPool ? 'Booking Pool...' : 'Confirm & Issue Gate Pass'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Logistics Dashboard Header with Deep Navy Styling */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center shadow-inner">
            <Truck className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">
                {t('farmerTransport.widgetTitle', 'Logistics & Shared Freight Dispatch')}
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                Shared Freight Pooling
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Verified crop-specific transport matching, real database availability, and guaranteed zero-duplicate booking.
            </p>
          </div>
        </div>

        {/* View Switcher: Book vs My Bookings */}
        <div className="inline-flex rounded-xl bg-slate-800/80 p-1 text-xs font-bold border border-slate-700/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={`py-1.5 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'book'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{t('farmerTransport.bookTransportTab', 'Find Transport')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-bookings')}
            className={`py-1.5 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my-bookings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
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
                    const isSelected = selectedCrops.some((c) => c.toLowerCase() === cropName.toLowerCase());
                    return (
                      <button
                        key={cropName}
                        type="button"
                        onClick={() => handleToggleCrop(cropName)}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-500/30 shadow-xs'
                            : 'border-emerald-200/90 bg-emerald-50/30 hover:bg-emerald-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{cropMeta.icon}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
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
                      const targetName = customCropName.trim() || 'Other';
                      handleToggleCrop(targetName);
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      selectedCrops.some((c) => c.toLowerCase() === 'other' || (customCropName && c.toLowerCase() === customCropName.trim().toLowerCase()))
                        ? 'border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-500/30 shadow-xs'
                        : 'border-dashed border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">📦</span>
                      {selectedCrops.some((c) => c.toLowerCase() === 'other' || (customCropName && c.toLowerCase() === customCropName.trim().toLowerCase())) && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
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
                        if (val.trim()) {
                          handleToggleCrop(val.trim());
                        }
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
                            handleToggleCrop(sug);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all border cursor-pointer ${
                            selectedCrops.some((c) => c.toLowerCase() === sug.toLowerCase())
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
                    const isSelected = selectedCrops.some((c) => c.toLowerCase() === crop.name.toLowerCase());
                    return (
                      <button
                        key={crop.name}
                        type="button"
                        onClick={() => {
                          if (crop.name.toLowerCase() === 'other') {
                            setIsOtherCropSelected(true);
                            handleToggleCrop(customCropName.trim() || 'Other');
                          } else {
                            handleToggleCrop(crop.name);
                          }
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-500/30 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{crop.icon}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
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

          {/* SECTION B: HARVEST DETAILS & PER-CROP QUANTITIES (PART 1 & 2 REQUIREMENTS) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-primary" />
                <span>{t('farmerTransport.step2Harvest', 'Step 2: Harvest Details & Per-Crop Quantities *')}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300">
                  Total Cargo: {totalWeightKg.toLocaleString('en-IN')} kg
                  {totalWeightKg >= 100 && ` (${(totalWeightKg / 100).toFixed(1)} qtl)`}
                  {totalWeightKg >= 1000 && ` (${(totalWeightKg / 1000).toFixed(2)} t)`}
                </span>
              </div>
            </div>

            {selectedCrops.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-1">
                <AlertCircle className="w-5 h-5 text-amber-600 mx-auto" />
                <p className="text-xs font-bold text-amber-900">No Crops Selected</p>
                <p className="text-[11px] text-amber-700">Please select at least one crop above to add cargo to your transport booking request.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedCrops.map((cropName) => {
                    const meta = getCropMeta(cropName);
                    const currentItem = cropQuantities[cropName] || { quantity: 500, unit: 'kg' };
                    const cropKg = convertToKg(currentItem.quantity, currentItem.unit);

                    return (
                      <div
                        key={cropName}
                        className="p-3.5 rounded-2xl border border-emerald-200/80 bg-white shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{meta.icon}</span>
                            <div>
                              <h5 className="text-xs font-black text-slate-900">{cropName}</h5>
                              <span className="text-[10px] text-muted block">{meta.vehicleHint}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCrop(cropName)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={`Deselect ${cropName}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              step="0.5"
                              value={currentItem.quantity}
                              onChange={(e) => handleUpdateCropQuantity(cropName, e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold outline-none focus:border-primary"
                            />
                            <div className="inline-flex rounded-xl border border-slate-300 bg-slate-100 p-0.5 text-xs font-bold shrink-0">
                              {['kg', 'quintal', 'tonne'].map((u) => (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={() => handleUpdateCropUnit(cropName, u)}
                                  className={`px-2 py-0.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                                    currentItem.unit === u
                                      ? 'bg-primary text-white shadow-xs'
                                      : 'text-slate-600 hover:text-black'
                                  }`}
                                >
                                  {u}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono text-muted pt-0.5">
                            <span>
                              {currentItem.unit === 'quintal' && `= ${currentItem.quantity} × 100 kg`}
                              {currentItem.unit === 'tonne' && `= ${currentItem.quantity} × 1,000 kg`}
                              {currentItem.unit === 'kg' && 'Base metric kg'}
                            </span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              = {cropKg.toLocaleString('en-IN')} kg
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Route & Dates Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/80">
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

              {/* Pickup Date */}
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
            </div>

            {/* Preferred Delivery Window */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted" />
                <span>{t('farmerTransport.preferredDelivery', 'Preferred Delivery Window (Optional)')}</span>
              </label>
              <input
                type="date"
                value={preferredDeliveryDate}
                min={pickupDate}
                onChange={(e) => setPreferredDeliveryDate(e.target.value)}
                className="w-full sm:w-1/3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* SECTION: BOOKING TYPE SELECTOR (PART 3 REQUIREMENT: SHARED VS DEDICATED) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Choose Transport Service Type *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setIsSharedPooling(true)}
                className={`p-3.5 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                  isSharedPooling
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className={`p-2 rounded-lg shrink-0 ${isSharedPooling ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-700'}`}>
                  <Users className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs sm:text-sm">Shared Transport (Split Freight)</span>
                    <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full ${isSharedPooling ? 'bg-purple-500/80 text-white' : 'bg-purple-100 text-purple-800'}`}>Save 35-50%</span>
                  </div>
                  <p className={`text-[11px] mt-0.5 leading-snug ${isSharedPooling ? 'text-purple-100' : 'text-slate-500'}`}>
                    Multiple farmers share vehicle capacity along the same route and split the freight fare proportionally.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsSharedPooling(false)}
                className={`p-3.5 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                  !isSharedPooling
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className={`p-2 rounded-lg shrink-0 ${!isSharedPooling ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-700'}`}>
                  <Truck className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs sm:text-sm">Dedicated Truck (Full Reserve)</span>
                    <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full ${!isSharedPooling ? 'bg-blue-600/80 text-white' : 'bg-blue-100 text-blue-800'}`}>Exclusive</span>
                  </div>
                  <p className={`text-[11px] mt-0.5 leading-snug ${!isSharedPooling ? 'text-blue-100' : 'text-slate-500'}`}>
                    Reserve the entire vehicle exclusively for your shipment. No shared pooling with other cargo.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION: STEP 3 VEHICLE SELECTION */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  <span>{t('farmerTransport.step3Vehicle', 'Step 3: Crop-Specific Vehicle Selection *')}</span>
                </label>
                <p className="text-[11px] text-muted">
                  {t('farmerTransport.showingVehiclesFor', 'Showing verified vehicles suitable for {crop} ({weight} kg load).', { crop: selectedCrop, weight: totalWeightKg })}
                </p>
              </div>
            </div>

            {/* FEATURE 4: Active Shared Pooling Match Suggestions - Semantic Purple */}
            {isSharedPooling && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/90 via-indigo-50/70 to-slate-50 border border-purple-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
                      <Users className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <span>Compatible Shared Pooling Matches</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          {poolMatches.length} Matches Found
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Join an active verified APMC trip along your route to split freight fares and prevent empty-truck return runs.
                      </p>
                    </div>
                  </div>
                  {loadingPoolMatches && (
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {poolMatches.map((match) => {
                    const combinedWeight = (match.currentLoad || 0) + totalWeightKg;
                    const capacityPercent = Math.min(100, Math.round((combinedWeight / match.capacity) * 100));

                    return (
                      <div
                        key={match.id}
                        className="p-3.5 rounded-xl bg-white border border-purple-200/90 shadow-2xs hover:shadow-sm transition-all space-y-2.5 flex flex-col justify-between"
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
                            <span className="text-purple-700 font-bold">Departs: {match.departureTime}</span>
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
                                capacityPercent > 90 ? 'bg-amber-500' : 'bg-purple-600'
                              }`}
                              style={{ width: `${capacityPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-purple-700 font-bold block text-right">
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
                              <span className="text-sm font-black text-purple-900">
                                {formatINR(match.sharedCost)}
                              </span>
                              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                                Save {formatINR(match.savings)} ({match.savingsPercent}%)
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPoolToConfirm(match)}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
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

                  const userActiveBooking = getUserBookingForVehicle(vehicle);
                  const isAlreadyBooked = Boolean(userActiveBooking);
                  const isDedicatedReserved = Boolean(vehicle.isDedicatedReserved);
                  const isFullyBooked = isDedicatedReserved || vehicle.isFullyBooked || (vehicle.remainingCapacityKg !== undefined && vehicle.remainingCapacityKg <= 0);
                  const isCapacityInsufficient = !isFullyBooked && vehicle.remainingCapacityKg !== undefined && totalWeightKg > vehicle.remainingCapacityKg;

                  return (
                    <div
                      key={vehicle.id}
                      onClick={() => {
                        if (isDedicatedReserved) {
                          showToast({
                            type: 'warning',
                            title: 'Dedicated Reserved',
                            message: 'This truck is reserved for a dedicated transport trip on this date.'
                          });
                          return;
                        }
                        if (isFullyBooked) {
                          showToast({
                            type: 'warning',
                            title: 'Vehicle Full / Sold Out',
                            message: 'This truck is fully booked for this date.'
                          });
                          return;
                        }
                        setSelectedVehicle(vehicle);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                        isAlreadyBooked
                          ? userActiveBooking?.status === 'pending'
                            ? 'border-amber-400 bg-amber-50/50 shadow-xs ring-1 ring-amber-300'
                            : ['in_transit'].includes(userActiveBooking?.status)
                            ? 'border-purple-400 bg-purple-50/50 shadow-xs ring-1 ring-purple-300'
                            : 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-300'
                          : isDedicatedReserved
                          ? 'border-amber-400 bg-amber-50/40 opacity-80 shadow-2xs'
                          : isFullyBooked
                          ? 'border-rose-300 bg-rose-50/40 opacity-80 shadow-2xs'
                          : isSelected
                          ? 'border-blue-600 bg-blue-50/30 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-blue-400 shadow-2xs'
                      }`}
                    >
                      {/* Top Badges */}
                      {isAlreadyBooked ? (
                        <div
                          className={`absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs ${
                            userActiveBooking?.status === 'pending'
                              ? 'bg-amber-500 text-white'
                              : ['in_transit'].includes(userActiveBooking?.status)
                              ? 'bg-purple-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {userActiveBooking?.status === 'pending' ? (
                            <>
                              <Clock className="w-3 h-3 text-amber-100" />
                              <span>ALREADY BOOKED • PENDING ({userActiveBooking.weightKg} kg)</span>
                            </>
                          ) : ['in_transit'].includes(userActiveBooking?.status) ? (
                            <>
                              <Truck className="w-3 h-3 text-purple-100" />
                              <span>ALREADY BOOKED • IN TRANSIT</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-100" />
                              <span>ALREADY BOOKED • CONFIRMED ({userActiveBooking.weightKg} kg)</span>
                            </>
                          )}
                        </div>
                      ) : isDedicatedReserved ? (
                        <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <AlertCircle className="w-3 h-3 text-amber-100" />
                          <span>DEDICATED RESERVED (Full Truck)</span>
                        </div>
                      ) : isFullyBooked ? (
                        <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <AlertCircle className="w-3 h-3 text-rose-100" />
                          <span>FULL / SOLD OUT (0 kg free)</span>
                        </div>
                      ) : isSelected ? (
                        <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <Check className="w-3 h-3" /> Selected Vehicle
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
                            <span className="text-[9.5px] font-black text-blue-800 bg-blue-100/90 border border-blue-300/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              ⭐️ Recommended for {selectedCrop}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                            {vehicle.cropSuitabilityReason}
                          </span>
                        </div>
                      </div>

                      {/* Specs Matrix */}
                      {/* Specs Matrix: Total Capacity, Confirmed Booked Load, Remaining Capacity */}
                      <div className="space-y-1.5 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200/90">
                        <div className="grid grid-cols-3 gap-1 text-center bg-slate-50 p-1.5 rounded-lg border border-slate-200/70">
                          <div>
                            <span className="text-slate-500 block text-[9.5px] font-semibold">Total Cap</span>
                            <span className="font-bold text-slate-900 font-mono text-[11px]">
                              {vehicle.capacityKg.toLocaleString('en-IN')} kg
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9.5px] font-semibold">Booked</span>
                            <span className={`font-bold font-mono text-[11px] ${Number(vehicle.bookedWeightKg || 0) > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                              {Number(vehicle.bookedWeightKg || 0).toLocaleString('en-IN')} kg
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9.5px] font-semibold">Remaining</span>
                            <span
                              className={`font-black font-mono text-[11px] ${
                                isDedicatedReserved
                                  ? 'text-amber-700'
                                  : isFullyBooked
                                  ? 'text-rose-600'
                                  : isCapacityInsufficient
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {isDedicatedReserved
                                ? '0 kg (Reserved)'
                                : isFullyBooked
                                ? '0 kg (FULL)'
                                : `${(vehicle.remainingCapacityKg !== undefined ? vehicle.remainingCapacityKg : vehicle.capacityKg).toLocaleString('en-IN')} kg`}
                            </span>
                          </div>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[9.5px] text-slate-500">
                            <span>Capacity Load</span>
                            <span className="font-mono font-bold text-slate-700">
                              {isFullyBooked
                                ? '100% FULL'
                                : `${Math.round(((Number(vehicle.bookedWeightKg || 0)) / (Number(vehicle.capacityKg || 1))) * 100)}% Booked`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isFullyBooked
                                  ? 'bg-rose-600'
                                  : Number(vehicle.bookedWeightKg || 0) > 0
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.round(((Number(vehicle.bookedWeightKg || 0)) / (Number(vehicle.capacityKg || 1))) * 100))}%`
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Driver:</span>
                            <span className="font-semibold text-slate-800 block truncate">
                              {vehicle.driverName}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Route:</span>
                            <span className="font-semibold text-slate-800 block truncate">
                              {vehicle.baseLocation || 'Pune'} ➔ APMC
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Details */}
                      <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block">
                            {isSharedPooling ? 'Estimated Shared Fare:' : 'Solo Truck Fare:'}
                          </span>
                          <span className="text-base font-black text-slate-900">
                            {formatINR(estimatedFare)}
                          </span>
                        </div>

                        {isSharedPooling && (
                          <div className="text-right">
                            {savings > 0 ? (
                              <>
                                <span className="text-[10px] text-purple-700 font-bold block">
                                  Save +{formatINR(savings)}!
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono">{savingsPercent}% Pool Savings</span>
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

          {/* SHARED TRANSPORT POOLING SUMMARY BREAKDOWN - DEEP NAVY LOGISTICS STYLING */}
          {isSharedPooling && selectedVehicle && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 text-white space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Shared Pooling Cost & Space Transparency</span>
                </span>
                <span className="text-xs font-bold text-blue-300 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800/80 font-mono">
                  Total Trip Fare: {formatINR(selectedVehicle.estimatedSoloFare)} (Split Proportionally)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block">Your Cargo Share</span>
                  <span className="font-black text-white font-mono">
                    {totalWeightKg.toLocaleString('en-IN')} kg
                  </span>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block">Remaining Truck Space</span>
                  <span className="font-black text-blue-400 font-mono">
                    {Math.max(0, selectedVehicle.remainingCapacityKg - totalWeightKg).toLocaleString('en-IN')} kg
                  </span>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block">Your Pooled Fare</span>
                  <span className="font-black text-emerald-400 font-mono text-sm">
                    {formatINR(selectedVehicle.estimatedSharedFare)}
                  </span>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block">Your Freight Savings</span>
                  <span className="font-black text-purple-400 font-mono text-sm">
                    +{formatINR(selectedVehicle.estimatedSoloFare - selectedVehicle.estimatedSharedFare)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ACTION BAR: PREVENT DUPLICATE SUBMISSION AND SHOW AUTHORITATIVE STATUS */}
          <div className="pt-3 border-t border-slate-200">
            {selectedVehicleBooking ? (
              <div
                className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border shadow-xs ${
                  selectedVehicleBooking.status === 'pending'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : ['in_transit'].includes(selectedVehicleBooking.status)
                    ? 'bg-purple-50 border-purple-300 text-purple-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedVehicleBooking.status === 'pending'
                        ? 'bg-amber-500 text-white'
                        : ['in_transit'].includes(selectedVehicleBooking.status)
                        ? 'bg-purple-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {selectedVehicleBooking.status === 'pending' ? (
                      <Clock className="w-5 h-5" />
                    ) : ['in_transit'].includes(selectedVehicleBooking.status) ? (
                      <Truck className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm">
                        Already Booked by You
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 border">
                        {selectedVehicleBooking.status?.toUpperCase().replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90">
                      Booking #{selectedVehicleBooking.bookingId || selectedVehicleBooking.id} • {selectedVehicleBooking.weightKg} kg {selectedVehicleBooking.cropName} on {selectedVehicleBooking.pickupDate || pickupDate}.
                      Repeated bookings for this requirement are disabled.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedBooking(selectedVehicleBooking);
                      setIsGatePassModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Gate Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('my-bookings')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span>My Bookings</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : selectedVehicle?.isFullyBooked || (selectedVehicle?.remainingCapacityKg !== undefined && selectedVehicle.remainingCapacityKg <= 0) ? (
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 shadow-xs">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  <div>
                    <span className="text-xs sm:text-sm font-black block">VEHICLE FULLY BOOKED</span>
                    <span className="text-[11px] text-rose-700">
                      All {selectedVehicle?.capacityKg} kg capacity has been reserved for {pickupDate}. Please choose another vehicle.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="px-4 py-2.5 rounded-xl bg-rose-200 text-rose-800 text-xs font-bold cursor-not-allowed shrink-0"
                >
                  Fully Booked (0 kg free)
                </button>
              </div>
            ) : selectedVehicle?.remainingCapacityKg !== undefined && totalWeightKg > selectedVehicle.remainingCapacityKg ? (
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 shadow-xs">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  <div>
                    <span className="text-xs sm:text-sm font-black block">INSUFFICIENT VEHICLE SPACE</span>
                    <span className="text-[11px] text-rose-700">
                      Requested cargo load ({totalWeightKg} kg) exceeds remaining capacity of {selectedVehicle.remainingCapacityKg} kg.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="px-4 py-2.5 rounded-xl bg-rose-200 text-rose-800 text-xs font-bold cursor-not-allowed shrink-0"
                >
                  Exceeds Capacity ({selectedVehicle.remainingCapacityKg} kg left)
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Verifiable Digital Mandi Gate Pass with QR code generated immediately upon confirmation.</span>
                </div>

                <button
                  type="submit"
                  disabled={submittingBooking || availableVehicles.length === 0}
                  className={`py-3 px-6 rounded-2xl text-xs font-bold inline-flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all ${
                    submittingBooking || availableVehicles.length === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.99]'
                  }`}
                >
                  {submittingBooking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Securing Vehicle & Space...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Confirm Transport Booking ({formatINR(isSharedPooling ? selectedVehicle?.estimatedSharedFare || 1200 : selectedVehicle?.estimatedSoloFare || 2400)})
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
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
                      {!booking.driverName && !booking.driverPhone && (!booking.Vehicle || (!booking.Vehicle.driverName && !booking.Vehicle.driverPhone)) ? (
                        <span className="font-semibold text-amber-700 block text-[11px] mt-0.5">
                          ⏳ {t('farmerTransport.awaitingTransporterConfirmation', 'Awaiting transporter confirmation')}
                        </span>
                      ) : (
                        <div className="space-y-0.5 mt-0.5">
                          <div className="font-bold text-slate-800 leading-tight">
                            <span>{booking.driverName || booking.Vehicle?.driverName || t('farmerTransport.assignedDriver', 'Assigned Driver')}</span>
                            {(booking.vehicleNumber || booking.Vehicle?.registrationNumber) && (
                              <span className="text-slate-500 font-medium ml-1">
                                ({booking.vehicleNumber || booking.Vehicle?.registrationNumber})
                              </span>
                            )}
                          </div>
                          {(booking.vehicleType || booking.vehicleModel || booking.Vehicle?.vehicleType) && (booking.vehicleType || booking.vehicleModel || booking.Vehicle?.vehicleType) !== 'any' && (
                            <span className="text-[10px] text-slate-500 block truncate leading-tight">
                              {booking.vehicleType || booking.vehicleModel || booking.Vehicle?.vehicleType}
                            </span>
                          )}
                          <div className="pt-0.5">
                            {(booking.driverPhone || booking.Vehicle?.driverPhone) ? (
                              <a
                                href={`tel:${booking.driverPhone || booking.Vehicle?.driverPhone}`}
                                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded text-[11px] transition-colors"
                                title={`Call Driver: ${booking.driverPhone || booking.Vehicle?.driverPhone}`}
                              >
                                <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="font-mono">{booking.driverPhone || booking.Vehicle?.driverPhone}</span>
                                <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-200/60 px-1 py-0.2 rounded ml-0.5">
                                  {t('farmerTransport.callBtn', 'Call')}
                                </span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 opacity-50 shrink-0" />
                                <span>{t('farmerTransport.contactUnavailable', 'Contact number unavailable')}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">{t('farmerTransport.fare', 'Fare')}</span>
                      <span className="font-black text-emerald-700 font-mono">
                        {formatINR(booking.estimatedSharedCost || 1200)}
                      </span>
                    </div>
                  </div>

                  {/* Authoritative Departure Schedule Strip */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[11px] font-bold">Scheduled Departure:</span>
                      {booking.scheduledDepartureTime ? (
                        <span className="font-mono font-bold text-slate-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {formatISTDateTime(booking.scheduledDepartureTime)}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Departure not scheduled
                        </span>
                      )}
                    </div>
                    {booking.actualDepartureTime ? (
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Departed: {formatISTDateTime(booking.actualDepartureTime)}
                      </span>
                    ) : ['in_transit', 'arrived_destination', 'delivered', 'completed'].includes(booking.status) ? (
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        🚚 Vehicle Departed & In Transit
                      </span>
                    ) : null}
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
