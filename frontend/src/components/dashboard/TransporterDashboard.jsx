import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Bell,
  Star,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  Download,
  Eye,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import DigitalGatePassModal from '../transport/DigitalGatePassModal';
import LiveDriverTrackingMap from '../transport/LiveDriverTrackingMap';

import { API_BASE_URL } from '../../config/apiConfig';

function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

// Web Audio API notification alert tone
function playBookingNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

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
    console.warn('AudioContext chime:', err.message);
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

const TRIP_PROGRESS_STEPS = [
  { key: 'request_received', label: 'Request Received', icon: Clock },
  { key: 'accepted', label: 'Accepted', icon: Check },
  { key: 'vehicle_assigned', label: 'Vehicle Assigned', icon: Car },
  { key: 'awaiting_pickup', label: 'Awaiting Pickup', icon: MapPin },
  { key: 'pickup_confirmed', label: 'Pickup Confirmed', icon: Scale },
  { key: 'in_transit', label: 'In Transit', icon: Navigation },
  { key: 'arrived_destination', label: 'Arrived at Mandi', icon: Truck },
  { key: 'delivered', label: 'Delivery Confirmed', icon: CheckCheck },
  { key: 'completed', label: 'Completed & Settled', icon: ShieldCheck }
];

export default function TransporterDashboard() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Active Tab: 'overview' | 'requests' | 'shared' | 'active' | 'gatepass' | 'fleet' | 'notifications' | 'history'
  const [activeTab, setActiveTab] = useState('overview');
  const prevRequestIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // Sync tab with URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'requests') {
      setActiveTab('requests');
    } else if (tabParam === 'shared' || tabParam === 'available') {
      setActiveTab('shared');
    } else if (tabParam === 'active') {
      setActiveTab('active');
    } else if (tabParam === 'gatepass') {
      setActiveTab('gatepass');
    } else if (tabParam === 'fleet') {
      setActiveTab('fleet');
    } else if (tabParam === 'notifications') {
      setActiveTab('notifications');
    } else if (tabParam === 'history') {
      setActiveTab('history');
    } else if (tabParam === 'overview' || !tabParam) {
      setActiveTab('overview');
    }
  }, [location.search]);

  // Key Statistics State (Derived strictly from authorized database records)
  const [stats, setStats] = useState({
    totalTripsCompleted: 0,
    deliveriesCompletedCount: 0,
    activeTripsCount: 0,
    newEligibleRequestsCount: 0,
    tripsAwaitingAssignmentCount: 0,
    todayPickupsCount: 0,
    registeredVehiclesCount: 0,
    availableVehiclesCount: 0,
    totalCargoDeliveredKg: 0,
    totalEarnings: 0,
    confirmedFreightEarnings: 0,
    completedTripTotals: 0,
    pendingFreightEarnings: 0,
    escrowLockedEarnings: 0,
    rating: 4.8,
    totalRatings: 1,
    vehicleType: user?.TransporterProfile?.vehicleType || '',
    vehicleNumber: user?.TransporterProfile?.vehicleNumber || '',
    capacityKg: user?.TransporterProfile?.capacityKg || 0,
    isAvailable: true,
    activeTrip: null
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
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterBookingType, setFilterBookingType] = useState('all');

  // Accept / Reject Modal State
  const [selectedRequestForAction, setSelectedRequestForAction] = useState(null);
  const [assignedVehicleId, setAssignedVehicleId] = useState('primary');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedGatePass, setSelectedGatePass] = useState(null);

  // Suggested Shared Groups (Phase 4: 3-4 farmers)
  const [suggestedGroups, setSuggestedGroups] = useState([]);
  const [loadingSuggestedGroups, setLoadingSuggestedGroups] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [selectedForGrouping, setSelectedForGrouping] = useState([]);
  const [groupVehicleId, setGroupVehicleId] = useState('primary');
  const [groupingTrip, setGroupingTrip] = useState(false);

  // Active Trips List
  const [myBookings, setMyBookings] = useState([]);
  const [loadingMyBookings, setLoadingMyBookings] = useState(false);

  // Pickup & Delivery Action Modals (Phase 7)
  const [selectedTripForPickup, setSelectedTripForPickup] = useState(null);
  const [pickupFormData, setPickupFormData] = useState({
    actualPickupTime: new Date().toISOString().slice(0, 16),
    loadedQuantity: '',
    pickupNotes: ''
  });
  const [submittingPickup, setSubmittingPickup] = useState(false);

  const [selectedTripForDelivery, setSelectedTripForDelivery] = useState(null);
  const [deliveryFormData, setDeliveryFormData] = useState({
    actualDeliveryTime: new Date().toISOString().slice(0, 16),
    deliveredQuantity: '',
    deliveryNotes: '',
    recipientAcknowledgment: 'Consignee received and verified at APMC Weighbridge'
  });
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Departure Scheduling Modal
  const [selectedTripForSchedule, setSelectedTripForSchedule] = useState(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    date: '',
    time: '',
    notes: ''
  });
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  // Trip History & Earnings (Phase 14)
  const [tripHistory, setTripHistory] = useState([]);
  const [historySummary, setHistorySummary] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');
  const [historyCorridorFilter, setHistoryCorridorFilter] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // Notifications Log
  const [notificationLog, setNotificationLog] = useState([
    {
      id: 'n-init',
      title: 'Transporter Portal Ready',
      message: 'Logged in to Maharashtra Agricultural Logistics Console.',
      time: 'Just now',
      type: 'info'
    }
  ]);

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
        if (json.data.length > 0) {
          setAssignedVehicleId((prev) => (!prev || prev === 'primary' ? json.data[0].id : prev));
          setGroupVehicleId((prev) => (!prev || prev === 'primary' ? json.data[0].id : prev));
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
        if (!isInitialLoadRef.current && prevRequestIdsRef.current.size > 0) {
          const brandNewBookings = json.data.filter(
            (r) => !prevRequestIdsRef.current.has(r.id) && (r.status === 'pending' || r.status === 'open' || r.status === 'confirmed')
          );

          if (brandNewBookings.length > 0) {
            playBookingNotificationChime();
            const latest = brandNewBookings[0];
            showToast({
              type: 'celebrate',
              title: '🔔 New Farmer Transport Request!',
              message: `${latest.farmerName} requested ${latest.weightKg} kg ${latest.cropName} ➔ ${latest.destinationMarket}.`,
              duration: 7000
            });
            setNotificationLog((prev) => [
              {
                id: `n-${Date.now()}`,
                title: 'New Booking Request',
                message: `${latest.farmerName} • ${latest.cropName} (${latest.weightKg} kg) ➔ ${latest.destinationMarket}`,
                time: new Date().toLocaleTimeString(),
                type: 'booking'
              },
              ...prev
            ]);
          }
        }

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

  // Load Suggested Shared Groups (Phase 4)
  async function loadSuggestedGroups() {
    setLoadingSuggestedGroups(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/suggested-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSuggestedGroups(json.data);
      }
    } catch (err) {
      console.warn('Could not load suggested groups:', err.message);
    } finally {
      setLoadingSuggestedGroups(false);
    }
  }

  // Load My Bookings & Active Trips
  async function loadMyBookings() {
    setLoadingMyBookings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMyBookings(json.data);
      }
    } catch (err) {
      console.warn('Could not load my bookings:', err.message);
    } finally {
      setLoadingMyBookings(false);
    }
  }

  // Load Trip History & Earnings (Phase 14)
  async function loadTripHistory() {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (historyStatusFilter) params.append('status', historyStatusFilter);
      if (historyCorridorFilter) params.append('corridor', historyCorridorFilter);
      if (historyStartDate) params.append('startDate', historyStartDate);
      if (historyEndDate) params.append('endDate', historyEndDate);

      const res = await fetch(`${API_BASE_URL}/api/transport/trip-history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTripHistory(json.data);
        if (json.summary) setHistorySummary(json.summary);
      }
    } catch (err) {
      console.warn('Could not load trip history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Initial and Polling Load
  useEffect(() => {
    if (token) {
      loadTransporterStats();
      loadMyFleet();
      loadIncomingRequests(false);
      loadSuggestedGroups();
      loadMyBookings();
      loadTripHistory();

      const pollInterval = setInterval(() => {
        loadIncomingRequests(true);
        loadTransporterStats();
        loadMyFleet();
      }, 4000);

      return () => clearInterval(pollInterval);
    }
  }, [token, filterCrop, filterVehicleType, filterStatus, filterBookingType]);

  // Handle Tab Switch
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/transport?tab=${tab}`, { replace: true });
    if (tab === 'shared') {
      loadSuggestedGroups();
      loadMyFleet();
    }
    if (tab === 'fleet') loadMyFleet();
    if (tab === 'active' || tab === 'gatepass') loadMyBookings();
    if (tab === 'history') loadTripHistory();
  };

  // Add Vehicle to Fleet (Phase 5)
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
        message: `Registered ${json.data?.vehicleType} (${json.data?.registrationNumber}) with payload capacity ${json.data?.capacityKg} kg.`,
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

  // Toggle Vehicle Availability (Phase 5: with active trip conflict check)
  async function handleToggleVehicleAvailability(vehicle) {
    const nextAvailability = !vehicle.isAvailable;
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: nextAvailability })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update vehicle availability');

      showToast({
        type: 'success',
        title: 'Vehicle Status Updated',
        message: `${vehicle.registrationNumber} marked as ${nextAvailability ? 'Available' : 'Unavailable'}.`
      });

      loadMyFleet();
      loadTransporterStats();
    } catch (err) {
      showToast({ type: 'error', title: 'Action Denied', message: err.message });
    }
  }

  // Accept Individual Booking (Phase 6)
  async function handleAcceptBooking(bookingId) {
    if (selectedRequestForAction?.booking) {
      const s = String(selectedRequestForAction.booking.status || '').toLowerCase().trim();
      if (!['open', 'pending', 'requested', 'request_received'].includes(s)) {
        showToast({
          type: 'error',
          title: 'Action Not Allowed',
          message: `Cannot accept this request because the booking has already been ${s}.`
        });
        setSelectedRequestForAction(null);
        return;
      }
    }

    setActionLoading(true);
    try {
      const selectedVehicle = assignedVehicleId && assignedVehicleId !== 'primary'
        ? myFleet.find((v) => String(v.id) === String(assignedVehicleId))
        : null;

      const res = await fetch(`${API_BASE_URL}/api/transport/bookings/${bookingId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId: selectedVehicle?.id || (assignedVehicleId !== 'primary' ? assignedVehicleId : null),
          vehicleType: selectedVehicle?.vehicleType || stats.vehicleType || user?.TransporterProfile?.vehicleType || 'Commercial Agri Carrier',
          vehicleNumber: selectedVehicle?.registrationNumber || stats.vehicleNumber || user?.TransporterProfile?.vehicleNumber || null,
          driverName: selectedVehicle?.driverName || user?.TransporterProfile?.driverName || user?.name || 'Assigned Driver',
          driverPhone: selectedVehicle?.driverPhone || user?.phone || null
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to accept booking');

      showToast({
        type: 'celebrate',
        title: '✅ Booking Accepted & Vehicle Assigned!',
        message: json.message || 'Assigned vehicle and notified farmer.',
        duration: 4000
      });

      setSelectedRequestForAction(null);
      await loadIncomingRequests();
      await loadTransporterStats();
      await loadMyFleet();
      await loadMyBookings();
    } catch (err) {
      showToast({ type: 'error', title: 'Accept Failed', message: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  // Reject Booking Request
  async function handleRejectBooking(bookingId) {
    if (selectedRequestForAction?.booking) {
      const s = String(selectedRequestForAction.booking.status || '').toLowerCase().trim();
      if (!['open', 'pending', 'requested', 'request_received'].includes(s)) {
        showToast({
          type: 'error',
          title: 'Action Not Allowed',
          message: `Cannot reject this request because the booking has already been ${s}.`
        });
        setSelectedRequestForAction(null);
        return;
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/bookings/${bookingId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectionReason || 'Capacity full / corridor out of coverage' })
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
      loadTransporterStats();
    } catch (err) {
      showToast({ type: 'error', title: 'Action Failed', message: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  // Confirm Suggested Shared Group (Phase 4)
  async function handleConfirmSuggestedGroup(group) {
    if (!groupVehicleId) {
      showToast({ type: 'error', title: 'Vehicle Required', message: 'Select an available vehicle from your fleet.' });
      return;
    }
    setGroupingTrip(true);
    try {
      const bookingIds = group.bookings.map((b) => b.id);
      const res = await fetch(`${API_BASE_URL}/api/transport/shared-trips/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingIds,
          vehicleId: Number(groupVehicleId)
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to confirm shared trip');

      showToast({
        type: 'celebrate',
        title: '🎉 Shared Trip Group Confirmed!',
        message: `${json.message || `Grouped ${group.farmerCount} farmers into shared trip.`}`,
        duration: 5000
      });

      loadSuggestedGroups();
      loadIncomingRequests();
      loadTransporterStats();
      loadMyFleet();
      loadMyBookings();
      handleTabChange('active');
    } catch (err) {
      showToast({ type: 'error', title: 'Grouping Error', message: err.message });
    } finally {
      setGroupingTrip(false);
    }
  }

  // Confirm Custom Selection Shared Group
  async function handleGroupCustomSharedTrip() {
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
      loadSuggestedGroups();
      loadIncomingRequests();
      loadTransporterStats();
      loadMyFleet();
      loadMyBookings();
    } catch (err) {
      showToast({ type: 'error', title: 'Grouping Error', message: err.message });
    } finally {
      setGroupingTrip(false);
    }
  }

  // Toggle selection for manual pooling
  const handleToggleSelectForGrouping = (id) => {
    setSelectedForGrouping((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedGroupingCargoKg = useMemo(() => {
    return incomingRequests
      .filter((r) => selectedForGrouping.includes(r.id))
      .reduce((sum, r) => sum + (r.weightKg || 0), 0);
  }, [incomingRequests, selectedForGrouping]);

  // Consignment Pickup Confirmation (Phase 7)
  async function handleSubmitPickup(e) {
    e.preventDefault();
    if (!selectedTripForPickup) return;
    setSubmittingPickup(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/requests/${selectedTripForPickup.id}/pickup`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          actualPickupTime: pickupFormData.actualPickupTime,
          loadedQuantity: Number(pickupFormData.loadedQuantity) || selectedTripForPickup.weightKg,
          notes: pickupFormData.pickupNotes
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to confirm pickup');

      showToast({
        type: 'success',
        title: '🌾 Farm Pickup Confirmed!',
        message: `Loaded ${json.data?.loadedQuantity || selectedTripForPickup.weightKg} kg. Status updated to PICKUP CONFIRMED.`
      });

      setSelectedTripForPickup(null);
      loadMyBookings();
      loadTransporterStats();
    } catch (err) {
      showToast({ type: 'error', title: 'Pickup Action Failed', message: err.message });
    } finally {
      setSubmittingPickup(false);
    }
  }

  // Consignment Delivery Confirmation (Phase 7)
  async function handleSubmitDelivery(e) {
    e.preventDefault();
    if (!selectedTripForDelivery) return;
    setSubmittingDelivery(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/requests/${selectedTripForDelivery.id}/delivery`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          actualDeliveryTime: deliveryFormData.actualDeliveryTime,
          deliveredQuantity: Number(deliveryFormData.deliveredQuantity) || selectedTripForDelivery.weightKg,
          notes: deliveryFormData.deliveryNotes,
          recipientAcknowledgment: deliveryFormData.recipientAcknowledgment
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to confirm delivery');

      showToast({
        type: 'celebrate',
        title: '🏁 Cargo Delivered at APMC Mandi!',
        message: `Delivered ${json.data?.deliveredQuantity || selectedTripForDelivery.weightKg} kg with weighbridge acknowledgment.`
      });

      setSelectedTripForDelivery(null);
      loadMyBookings();
      loadTransporterStats();
      loadTripHistory();
    } catch (err) {
      showToast({ type: 'error', title: 'Delivery Action Failed', message: err.message });
    } finally {
      setSubmittingDelivery(false);
    }
  }

  // Progress Trip Status step (Phase 7: Audited Transitions)
  async function handleProgressTrip(bookingId, nextStatus) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to progress status');

      showToast({
        type: 'success',
        title: 'Trip Milestone Advanced',
        message: `Status moved to ${nextStatus.toUpperCase().replace(/_/g, ' ')}.`
      });

      loadMyBookings();
      loadTransporterStats();
      loadIncomingRequests(true);
    } catch (err) {
      showToast({ type: 'error', title: 'Status Error', message: err.message });
    }
  }

  // Format Indian Standard Time (IST) Date and Time string
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

  function openScheduleModal(trip) {
    let defaultDate = '';
    let defaultTime = '10:00';
    if (trip.scheduledDepartureTime) {
      const d = new Date(trip.scheduledDepartureTime);
      if (!isNaN(d.getTime())) {
        defaultDate = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        defaultTime = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
      }
    } else if (trip.pickupDate) {
      defaultDate = trip.pickupDate;
      defaultTime = '10:00';
    } else {
      defaultDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      defaultTime = '10:00';
    }
    setScheduleFormData({
      date: defaultDate,
      time: defaultTime,
      notes: ''
    });
    setSelectedTripForSchedule(trip);
  }

  async function handleSubmitSchedule(e) {
    e.preventDefault();
    if (!selectedTripForSchedule) return;
    if (!scheduleFormData.date || !scheduleFormData.time) {
      showToast({ type: 'error', title: 'Schedule Incomplete', message: 'Please select both departure date and departure time.' });
      return;
    }

    setSubmittingSchedule(true);
    try {
      // Formatted ISO interpreted strictly in IST (UTC+05:30)
      const isoString = new Date(`${scheduleFormData.date}T${scheduleFormData.time}:00+05:30`).toISOString();
      const res = await fetch(`${API_BASE_URL}/api/transport/bookings/${selectedTripForSchedule.id}/schedule-departure`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          scheduledDepartureTime: isoString,
          notes: scheduleFormData.notes
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to schedule departure');

      showToast({
        type: 'success',
        title: '📅 Departure Scheduled!',
        message: `Scheduled departure set for ${formatISTDateTime(isoString)}.`
      });

      setSelectedTripForSchedule(null);
      loadMyBookings();
      loadTransporterStats();
    } catch (err) {
      showToast({ type: 'error', title: 'Scheduling Error', message: err.message });
    } finally {
      setSubmittingSchedule(false);
    }
  }

  const activeTrip = stats.activeTrip;
  const activeBookings = myBookings.filter((b) =>
    ['accepted', 'vehicle_assigned', 'driver_assigned', 'awaiting_pickup', 'pickup_confirmed', 'in_transit', 'arrived_destination'].includes(b.status)
  );

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full 2xl:max-w-[1720px] mx-auto pb-16 animate-in fade-in">
      {/* 1. Transporter Header Banner — Orange / Slate Logistics Hub */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-orange-500/30 text-white animate-fade-slide-up">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/transport-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-orange-950/85 backdrop-blur-[1px]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Truck className="w-3.5 h-3.5 text-orange-400" />
              <span>{t('transporter.headerBadge') || "Transporter Logistics & Shared Fleet Hub"}</span>
            </div>

            <h1 
              className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md"
              style={{ color: '#FFFFFF' }}
            >
              {t('transporter.headerTitle') || "Logistics Management Console"}
            </h1>

            <p 
              className="text-xs sm:text-sm leading-relaxed drop-shadow-sm font-normal"
              style={{ color: '#F1F5F9' }}
            >
              {t('transporter.headerSubtitle') || "Manage agricultural cargo dispatch, group compatible farmer bookings into shared trips, assign fleet carriers, and track delivery progress across Maharashtra corridors."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddVehicleModal(true)}
              className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer btn-press"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('transporter.registerVehicleBtn') || "Register Fleet Vehicle"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                loadTransporterStats();
                loadMyFleet();
                loadIncomingRequests();
                loadSuggestedGroups();
                loadMyBookings();
                loadTripHistory();
              }}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors cursor-pointer"
              title={t('transporter.refreshStatsTooltip') || "Refresh Logistics Stats"}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Top Summary Metrics (Phase 3: Real Database Records Only) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Metric 1: New Eligible Requests */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{t('transporter.metricEligibleRequests') || "Eligible Requests"}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
            {stats.newEligibleRequestsCount ?? incomingRequests.length}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold block">{t('transporter.awaitingAcceptance') || "Awaiting Acceptance"}</span>
        </div>

        {/* Metric 2: Trips Awaiting Assignment */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{t('transporter.metricAwaitingVehicle') || "Awaiting Vehicle"}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Car className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
            {stats.tripsAwaitingAssignmentCount ?? 0}
          </p>
          <span className="text-[11px] text-amber-700 font-semibold block">{t('transporter.needCarrierMatch') || "Need Carrier Match"}</span>
        </div>

        {/* Metric 3: Today's Pickups */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{t('transporter.metricTodayPickups') || "Today's Pickups"}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
            {stats.todayPickupsCount ?? 0}
          </p>
          <span className="text-[11px] text-blue-700 font-semibold block">{t('transporter.scheduledToday') || "Scheduled Today"}</span>
        </div>

        {/* Metric 4: Active Trips */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{t('transporter.metricActiveTrips') || "Active Trips"}</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Navigation className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
            {stats.activeTripsCount ?? activeBookings.length}
          </p>
          <span className="text-[11px] text-purple-700 font-semibold block">{t('transporter.inTransit') || "In Progress / Transit"}</span>
        </div>

        {/* Metric 5: Deliveries Completed */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{t('transporter.metricCompletedTrips') || "Completed Trips"}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
            {stats.deliveriesCompletedCount ?? stats.totalTripsCompleted ?? 0}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold block">{t('transporter.verifiedDeliveries') || "Verified APMC Deliveries"}</span>
        </div>

        {/* Metric 6: Registered Fleet Availability */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{t('transporter.metricFleetReady') || "Fleet Ready"}</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Car className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
            {stats.availableVehiclesCount ?? myFleet.filter((v) => v.isAvailable !== false).length} / {stats.registeredVehiclesCount ?? myFleet.length}
          </p>
          <span className="text-[11px] text-teal-700 font-semibold block">{t('transporter.vehiclesAvailable') || "Vehicles Available"}</span>
        </div>
      </section>

      {/* 2.5 Strict Financial Separation (Phase 3 & 13) */}
      <section className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
              {t('transporter.ledgerTitle') || "Freight Accounts & Earnings Ledger (Non-Estimated)"}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {t('transporter.ledgerSubtitle') || "Confirmed payouts, pending freight, and escrow deposits are kept strictly distinct."}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('transporter.confirmedPaid') || "Confirmed Freight Paid"}</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono block">
              {formatINR(stats.confirmedFreightEarnings ?? 0)}
            </span>
            <span className="text-[10.5px] text-emerald-300">{t('transporter.settledDesc') || "Directly settled / paid"}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('transporter.completedTotal') || "Completed Trips Total"}</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono block">
              {formatINR(stats.completedTripTotals ?? stats.totalEarnings ?? 0)}
            </span>
            <span className="text-[10.5px] text-slate-300">{(t('transporter.verifiedTripsDesc') || "{count} verified trips").replace('{count}', stats.deliveriesCompletedCount ?? stats.totalTripsCompleted ?? 0)}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('transporter.pendingFreight') || "Pending / Active Freight"}</span>
            <span className="text-lg sm:text-xl font-black text-amber-400 font-mono block">
              {formatINR(stats.pendingFreightEarnings ?? 0)}
            </span>
            <span className="text-[10.5px] text-amber-300">{(t('transporter.inTransitDesc') || "{count} trips in transit").replace('{count}', stats.activeTripsCount ?? activeBookings.length)}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('transporter.lockedEscrow') || "Locked in Escrow"}</span>
            <span className="text-lg sm:text-xl font-black text-blue-400 font-mono block">
              {formatINR(stats.escrowLockedEarnings ?? 0)}
            </span>
            <span className="text-[10.5px] text-blue-300">{t('transporter.protectedDeposits') || "Protected farmer deposits"}</span>
          </div>
        </div>
      </section>

      {/* 3. Transporter Section Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold scrollbar-none">
        <button
          type="button"
          onClick={() => handleTabChange('overview')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t('transporter.overviewTab') || "Dashboard Overview"}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('requests')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('transporter.incomingRequestsTab') || "Incoming Requests"} ({incomingRequests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('shared')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'shared'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('transporter.sharedTripsTab') || "Shared Trips & Groups"} ({suggestedGroups.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('active')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'active'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Navigation className="w-3.5 h-3.5 text-purple-500" />
          <span>{t('transporter.activeTripsTab') || "My Active Trips"} ({activeBookings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('gatepass')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'gatepass'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          <span>{t('transporter.gatePassTab') || "Cargo Trips & Gate Pass"}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('fleet')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'fleet'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-blue-500" />
          <span>{t('transporter.fleetTab') || "Fleet & Vehicles"} ({myFleet.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('transporter.historyTab') || "Trip History & Earnings"}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('notifications')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'notifications'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('transporter.notificationsTab') || "Notifications"}</span>
        </button>
      </div>

      {/* 4. TAB CONTENT: OVERVIEW (Phase 3 Section A-E) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Section A: Incoming Requests Quick View */}
          <section className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-primary" />
                  <span>{t('transporter.sectionA') || "A. Incoming Produce Booking Requests"}</span>
                </h3>
                <p className="text-xs text-muted">
                  {t('transporter.sectionASub') || "Recent farmer requests awaiting your vehicle assignment or review."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('requests')}
                className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{t('transporter.viewAllRequests') || "View All"} ({incomingRequests.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted bg-slate-50 rounded-xl border border-slate-200">
                {t('transporter.noIncomingRequests') || "No new unassigned requests in your coverage corridors."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {incomingRequests.slice(0, 3).map((req) => (
                  <div key={req.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{req.farmerName}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                        {req.weightKg} kg {req.cropName}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] truncate">
                      {req.pickupLocation} ➔ {req.destinationMarket}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                      <span className="font-mono font-bold text-primary">{formatINR(req.estimatedSharedCost || 1200)}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedRequestForAction({ type: 'accept', booking: req })}
                        className="px-2.5 py-1 rounded-lg bg-primary text-white font-bold text-[11px] hover:bg-primary-dark cursor-pointer shadow-xs"
                      >
                        {t('transporter.acceptAction') || "Accept Load"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section B: Suggested Shared Trips (Phase 4: Groups of 3-4 Farmers) */}
          <section className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>{t('transporter.sectionB') || "B. Suggested Shared Trips (3–4 Farmer Optimization)"}</span>
                </h3>
                <p className="text-xs text-muted">
                  {t('transporter.sectionBSub') || "AI-clustered compatible farmer requests sharing the same highway corridor, pickup date, and produce handling rules."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('shared')}
                className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Groups ({suggestedGroups.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingSuggestedGroups ? (
              <div className="p-6 text-center text-xs text-muted">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto text-primary" />
                <span>Clustering compatible corridor requests...</span>
              </div>
            ) : suggestedGroups.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted bg-slate-50 rounded-xl border border-slate-200">
                {t('transporter.noSharedGroups') || "No compatible multi-farmer groups identified right now. Groups will suggest automatically when 2–4 compatible bookings arrive."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestedGroups.slice(0, 2).map((group) => (
                  <div key={group.suggestedGroupId} className="p-4 rounded-2xl border border-emerald-300 bg-gradient-to-br from-white to-emerald-50/40 shadow-xs space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2 border-b border-emerald-100 pb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-emerald-900 text-xs">
                            {group.suggestedGroupId}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                            {group.farmerCount} Farmers Pooled
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs mt-1">
                          {group.routeSummary}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted block uppercase">Combined Cargo</span>
                        <span className="font-black text-emerald-800 font-mono text-sm">
                          {group.totalWeightKg} kg
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] p-2 rounded-xl bg-white border border-emerald-200">
                      <div>
                        <span className="text-muted block text-[10px]">Crops</span>
                        <strong className="text-slate-800 truncate block">{group.cropTypes?.join(', ')}</strong>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">Capacity Check</span>
                        <span className="text-emerald-700 font-bold font-mono">
                          {group.totalWeightKg} / {group.vehicleCapacityKg} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">Total Shared Fare</span>
                        <span className="text-primary font-bold font-mono">
                          {formatINR(group.totalFare)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted">
                        Handling: {group.produceHandling}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleConfirmSuggestedGroup(group)}
                        disabled={groupingTrip}
                        className="py-1.5 px-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm & Dispatch Vehicle</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section C: Active Trips Dispatch & Progression */}
          <section className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-purple-600" />
                  <span>{t('transporter.sectionC') || "C. Active Dispatches & Live Telemetry Console"}</span>
                </h3>
                <p className="text-xs text-muted">
                  {t('transporter.sectionCSub') || "Audited progression from farm gate pickup to destination mandi weighbridge clearance."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('active')}
                className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{t('transporter.viewAllTrips') || "Open Active Workspace"} ({activeBookings.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeBookings.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted bg-slate-50 rounded-xl border border-slate-200">
                {t('transporter.noActiveTrips') || "No trips actively on the road. Accept an incoming request or confirm a shared trip above to begin transit."}
              </div>
            ) : (
              <div className="space-y-4">
                {activeBookings.slice(0, 1).map((trip) => (
                  <div key={trip.id} className="p-5 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-4 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            {trip.gatePassCode || `PASS-${trip.id}`}
                          </span>
                          <span className="text-xs text-slate-300 font-bold">
                            {trip.bookingType === 'shared' ? (t('transporter.pooledTrip') || 'Shared Transport Pool') : (t('transporter.soloTrip') || 'Individual Consignment')}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-black text-white mt-1">
                          {trip.cropName} ({trip.weightKg} kg) ➔ {trip.destinationMarket}
                        </h4>

                        {/* Scheduled Departure and Actual Departure Indicator */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                          <span className="text-[11px] text-slate-400">Scheduled Departure:</span>
                          {trip.scheduledDepartureTime ? (
                            <span className="font-mono font-bold text-sky-300 bg-sky-950/70 border border-sky-500/40 px-2 py-0.5 rounded text-[11px]">
                              {formatISTDateTime(trip.scheduledDepartureTime)}
                            </span>
                          ) : (
                            <span className="font-semibold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded text-[11px]">
                              Departure not scheduled
                            </span>
                          )}
                          {trip.actualDepartureTime ? (
                            <span className="text-[11px] font-bold text-purple-300 bg-purple-950/70 border border-purple-500/40 px-2 py-0.5 rounded">
                              Departed: {formatISTDateTime(trip.actualDepartureTime)}
                            </span>
                          ) : ['in_transit', 'arrived_destination', 'delivered', 'completed'].includes(trip.status) ? (
                            <span className="text-[11px] font-bold text-purple-300 bg-purple-950/70 border border-purple-500/40 px-2 py-0.5 rounded">
                              Departed • In Transit
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedGatePass(trip)}
                          className="px-3 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t('transporter.viewGatePass') || "Gate Pass (QR)"}</span>
                        </button>

                        {!['in_transit', 'arrived_destination', 'delivered', 'completed', 'cancelled'].includes(trip.status) && (
                          <button
                            type="button"
                            onClick={() => openScheduleModal(trip)}
                            className="px-2.5 py-1.5 rounded-xl border border-sky-400/40 bg-sky-950/30 hover:bg-sky-500/20 text-sky-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Set or update scheduled departure date/time"
                          >
                            <Calendar className="w-3.5 h-3.5 text-sky-400" />
                            <span>{trip.scheduledDepartureTime ? 'Edit Schedule' : 'Schedule Departure'}</span>
                          </button>
                        )}

                        {['awaiting_pickup', 'accepted', 'vehicle_assigned', 'driver_assigned', 'confirmed'].includes(trip.status) ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTripForPickup(trip);
                                setPickupFormData({
                                  actualPickupTime: new Date().toISOString().slice(0, 16),
                                  loadedQuantity: String(trip.weightKg || ''),
                                  pickupNotes: ''
                                });
                              }}
                              className="btn-primary py-1.5 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>{t('transporter.pickupAction') || "Confirm Pickup"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProgressTrip(trip.id, 'in_transit')}
                              className="bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              title="Direct Depart & Start Transit"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Depart</span>
                            </button>
                          </div>
                        ) : trip.status === 'pickup_confirmed' ? (
                          <button
                            type="button"
                            onClick={() => handleProgressTrip(trip.id, 'in_transit')}
                            className="bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Start Transit (Depart)</span>
                          </button>
                        ) : trip.status === 'in_transit' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTripForDelivery(trip);
                              setDeliveryFormData({
                                actualDeliveryTime: new Date().toISOString().slice(0, 16),
                                deliveredQuantity: String(trip.weightKg || ''),
                                deliveryNotes: '',
                                recipientAcknowledgment: 'Consignee received and verified at APMC Weighbridge'
                              });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>{t('transporter.deliveryAction') || "Confirm Mandi Delivery"}</span>
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Interactive Highway Radar */}
                    <div className="rounded-xl overflow-hidden border border-white/10">
                      <LiveDriverTrackingMap
                        booking={trip}
                        passCode={trip.gatePassCode || `MH-APMC-${trip.id}`}
                        originName={trip.pickupLocation}
                        destinationName={trip.destinationMarket}
                        driverName={trip.driverName || 'Assigned Driver'}
                        driverPhone={trip.driverPhone || '9876543210'}
                        vehicleNumber={trip.vehicleNumber || stats.vehicleNumber}
                        vehicleType={trip.vehicleType || stats.vehicleType}
                        cropInfo={`${trip.cropName} (${trip.weightKg} kg)`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section D & E: Vehicle Availability & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section D: Fleet Readiness */}
            <section className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span>{t('transporter.sectionD') || "D. Fleet Availability Quick Toggle"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabChange('fleet')}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Manage Fleet ({myFleet.length})
                </button>
              </div>

              {myFleet.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted bg-slate-50 rounded-xl border border-slate-200">
                  {t('transporter.noFleetRegistered') || "No registered fleet vehicles. Register one to receive direct farmer bookings."}
                </div>
              ) : (
                <div className="space-y-2">
                  {myFleet.slice(0, 3).map((vehicle) => (
                    <div key={vehicle.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{vehicle.vehicleType}</span>
                        <span className="text-[11px] text-muted font-mono">{vehicle.registrationNumber} • {vehicle.capacityKg} kg</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleVehicleAvailability(vehicle)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          vehicle.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {vehicle.isAvailable ? '🟢 Available' : '🔴 In Service'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section E: Recent Activity & Audit Log */}
            <section className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span>E. Recent Trip Updates & Audit Feed</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabChange('notifications')}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {notificationLog.slice(0, 4).map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-start justify-between gap-2">
                    <div>
                      <strong className="text-slate-800 block text-[11px]">{item.title}</strong>
                      <span className="text-slate-600 text-[10.5px]">{item.message}</span>
                    </div>
                    <span className="text-[10px] text-muted whitespace-nowrap font-mono">{item.time}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: INCOMING REQUESTS (Phase 6) */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
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
                <div key={req.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
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
                      <span className="text-xs font-bold text-slate-500 font-mono">
                        {req.pickupDate}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        ['delivered', 'completed', 'delivery_confirmed'].includes(req.status?.toLowerCase().trim())
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : ['cancelled', 'rejected', 'failed_delivery'].includes(req.status?.toLowerCase().trim())
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : ['in_transit', 'arrived_destination'].includes(req.status?.toLowerCase().trim())
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : ['accepted', 'confirmed', 'driver_assigned', 'vehicle_assigned', 'awaiting_pickup', 'pickup_confirmed'].includes(req.status?.toLowerCase().trim())
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {req.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted text-[10px] uppercase font-bold block">Farmer Consignor</span>
                      <strong className="text-slate-900">{req.farmerName}</strong>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase font-bold block">Pickup Location</span>
                      <span className="text-slate-800 truncate block">{req.pickupLocation}</span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase font-bold block">Destination APMC</span>
                      <span className="text-slate-800 truncate block">{req.destinationMarket}</span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase font-bold block">Proposed Fare</span>
                      <span className="font-mono font-black text-primary text-sm block">
                        {formatINR(req.estimatedSharedCost || 1200)}
                      </span>
                    </div>
                  </div>

                  {['open', 'pending', 'request_received', 'requested'].includes(req.status?.toLowerCase().trim()) ? (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedRequestForAction({ type: 'reject', booking: req })}
                        className="py-1.5 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer transition-colors"
                      >
                        {t('transporter.rejectBtn') || 'Reject Request'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRequestForAction({ type: 'accept', booking: req })}
                        className="btn-primary py-1.5 px-4 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('transporter.acceptAndAssignVehicle') || 'Accept & Assign Vehicle'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <span className="text-[11px] font-medium flex items-center gap-1.5">
                        {['delivered', 'completed', 'delivery_confirmed'].includes(req.status?.toLowerCase().trim()) ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-emerald-700 font-semibold">{t('transporter.deliveredNoAction', 'Booking delivered at Mandi. No further actions required.')}</span>
                          </>
                        ) : ['cancelled', 'rejected'].includes(req.status?.toLowerCase().trim()) ? (
                          <>
                            <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span className="text-red-700 font-semibold">{t('transporter.cancelledNoAction', `Booking has been ${req.status?.toLowerCase()}. No actions available.`)}</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="text-blue-700 font-semibold">{t('transporter.assignedNoAction', `Booking ${req.status?.toLowerCase().replace(/_/g, ' ')} — vehicle already assigned.`)}</span>
                          </>
                        )}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {['delivered', 'completed', 'delivery_confirmed'].includes(req.status?.toLowerCase().trim()) ? 'Delivered' : ['cancelled', 'rejected'].includes(req.status?.toLowerCase().trim()) ? 'Closed' : 'Active Trip'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB CONTENT: SHARED TRIPS & GROUPS (Phase 4: 3-4 Farmers) */}
      {activeTab === 'shared' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 text-white space-y-2 border border-amber-500/30">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white">
                Compatible Farmer Shared Trip Pooling Engine
              </h3>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              HarvestMitra AI analyzes pending booking requests across Maharashtra to suggest optimal shared trips of approximately 3–4 farmers. Groups verify route corridor alignment, pickup timing, produce compatibility, and vehicle payload capacity before assignment.
            </p>
          </div>

          {/* Real Database Fleet Capacity Overview Strip */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Available Fleet Vehicles & Real-Time Capacity</span>
              </h4>
              <button
                type="button"
                onClick={loadMyFleet}
                className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Fleet Capacity</span>
              </button>
            </div>

            {myFleet.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-muted">
                No fleet vehicles registered. Register vehicles in the Fleet & Vehicles tab to manage capacities.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {myFleet.map((vehicle) => {
                  const totalCap = Number(vehicle.totalCapacityKg || vehicle.capacityKg || 0);
                  const bookedLoad = Number(vehicle.bookedWeightKg || 0);
                  const remaining = vehicle.remainingCapacityKg !== undefined
                    ? Number(vehicle.remainingCapacityKg)
                    : Math.max(0, totalCap - bookedLoad);
                  const isDedicated = Boolean(vehicle.isDedicatedReserved);
                  const isFull = isDedicated || vehicle.isFullyBooked || remaining <= 0;
                  const pct = totalCap > 0 ? Math.min(100, Math.round((bookedLoad / totalCap) * 100)) : 0;

                  return (
                    <div
                      key={vehicle.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{vehicle.vehicleType}</span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {vehicle.registrationNumber}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted">
                            Driver: {vehicle.driverName || 'Self'} ({vehicle.driverPhone || '—'})
                          </span>
                        </div>
                        {isDedicated ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                            Dedicated (0 kg)
                          </span>
                        ) : isFull ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 border border-rose-200">
                            FULL (0 kg)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {remaining.toLocaleString('en-IN')} kg Free
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-600 block">Total Capacity</span>
                          <span className="font-mono font-bold text-slate-900">{totalCap.toLocaleString('en-IN')} kg</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-600 block">Confirmed Load</span>
                          <span className={`font-mono font-bold ${bookedLoad > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                            {bookedLoad.toLocaleString('en-IN')} kg
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-600 block">Remaining</span>
                          <span className={`font-mono font-black ${isDedicated ? 'text-amber-700' : isFull ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {isDedicated ? '0 kg (Reserved)' : isFull ? '0 kg (FULL)' : `${remaining.toLocaleString('en-IN')} kg`}
                          </span>
                        </div>
                      </div>

                      {/* Capacity Utilization Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>Capacity Utilization</span>
                          <span>{pct}% ({bookedLoad}/{totalCap} kg)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isFull ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 1: Suggested Groups of 3-4 Farmers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>AI Suggested Groups Ready for Transporter Confirmation</span>
              </h4>
              <button
                type="button"
                onClick={loadSuggestedGroups}
                className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recalculate Groups</span>
              </button>
            </div>

            {loadingSuggestedGroups ? (
              <div className="p-8 text-center text-xs text-muted">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
                <span>Analyzing compatible farmer consignments...</span>
              </div>
            ) : suggestedGroups.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Multi-Farmer Groups Available</h4>
                <p className="text-xs text-muted max-w-md mx-auto">
                  When 2–4 compatible farmer bookings arrive for the same destination corridor within an overlapping pickup window, suggested trips will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestedGroups.map((group) => {
                  const isExpanded = expandedGroupId === group.suggestedGroupId;
                  return (
                    <div
                      key={group.suggestedGroupId}
                      className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-white shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                              {group.suggestedGroupId}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900">
                              👥 {group.farmerCount} Farmers Pooled
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {group.pickupWindow}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-slate-900 mt-1">
                            {group.routeSummary}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedGroupId(isExpanded ? null : group.suggestedGroupId)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Consignments' : 'View Consignments'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            disabled={groupingTrip}
                            onClick={() => handleConfirmSuggestedGroup(group)}
                            className="btn-primary py-1.5 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm Shared Trip & Assign Fleet</span>
                          </button>
                        </div>
                      </div>

                      {/* Group Summary Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div>
                          <span className="text-muted text-[10px] uppercase font-bold block">Total Cargo Load</span>
                          <strong className="text-slate-900 font-mono text-sm">{group.totalWeightKg} kg</strong>
                          <span className="text-[10px] text-emerald-700 font-semibold block">{group.cropTypes?.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-muted text-[10px] uppercase font-bold block">Vehicle Capacity Check</span>
                          <strong className="text-slate-900 font-mono text-sm">{group.totalWeightKg} / {group.vehicleCapacityKg} kg</strong>
                          <span className="text-[10px] text-emerald-700 font-semibold block">Within payload safety limit</span>
                        </div>
                        <div>
                          <span className="text-muted text-[10px] uppercase font-bold block">Total Freight Revenue</span>
                          <strong className="text-primary font-mono text-sm">{formatINR(group.totalFare)}</strong>
                          <span className="text-[10px] text-muted block">Direct transporter fare</span>
                        </div>
                        <div>
                          <span className="text-muted text-[10px] uppercase font-bold block">Produce Handling</span>
                          <span className="font-semibold text-slate-800 text-[11px] block">{group.produceHandling}</span>
                          <span className="text-[10px] text-emerald-700 font-semibold block">Compatible agronomic group</span>
                        </div>
                      </div>

                      {/* Expanded Individual Consignments Breakdown */}
                      {isExpanded && (
                        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2 animate-in fade-in">
                          <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                            Linked Individual Consignments ({group.bookings.length} Farmers)
                          </h5>
                          <div className="space-y-2">
                            {group.bookings.map((consignment, idx) => {
                              const share = group.fareAllocation?.find((f) => f.bookingId === consignment.id);
                              return (
                                <div
                                  key={consignment.id}
                                  className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                                      <strong className="text-slate-900 font-bold">{consignment.farmerName}</strong>
                                      <span className="text-muted">({consignment.farmerPhone || 'Direct via App'})</span>
                                    </div>
                                    <p className="text-slate-600 text-[11px] mt-0.5">
                                      Pickup: {consignment.pickupLocation} • Date: {consignment.pickupDate}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4 text-right">
                                    <div>
                                      <span className="text-[10px] text-muted block">Quantity</span>
                                      <strong className="font-mono text-slate-800">{consignment.weightKg} kg {consignment.cropName}</strong>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-muted block">Proportional Fare Share</span>
                                      <strong className="font-mono text-emerald-700">{formatINR(share?.allocatedFare || consignment.estimatedSharedCost || 450)}</strong>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Manual Checkbox Grouping Console */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Manual Shared Transport Selection & Grouping
                </h4>
                <p className="text-xs text-muted">
                  Check individual shared requests below to group them custom onto an assigned fleet vehicle.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-muted block">Selected Combined Cargo</span>
                <span className="text-base font-black text-primary font-mono">
                  {selectedGroupingCargoKg} kg ({selectedForGrouping.length} Farmers)
                </span>
              </div>
            </div>

            {(() => {
              const selectedVeh = myFleet.find((v) => String(v.id) === String(groupVehicleId)) || myFleet[0];
              const vehCap = selectedVeh ? Number(selectedVeh.totalCapacityKg || selectedVeh.capacityKg || 0) : Number(stats.capacityKg || 0);
              const vehBooked = selectedVeh ? Number(selectedVeh.bookedWeightKg || 0) : 0;
              const vehRem = selectedVeh && selectedVeh.remainingCapacityKg !== undefined
                ? Number(selectedVeh.remainingCapacityKg)
                : Math.max(0, vehCap - vehBooked);
              const isVehDedicated = Boolean(selectedVeh?.isDedicatedReserved);
              const isVehFull = isVehDedicated || (selectedVeh && selectedVeh.isFullyBooked) || vehRem <= 0;
              const exceedsCapacity = isVehFull || selectedGroupingCargoKg > vehRem;

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] text-muted font-bold block mb-1">Assign Fleet Vehicle *</label>
                      <select
                        value={groupVehicleId}
                        onChange={(e) => setGroupVehicleId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 font-semibold outline-none focus:border-primary bg-white"
                      >
                        {myFleet.length > 0 ? (
                          myFleet.map((v) => {
                            const tc = Number(v.totalCapacityKg || v.capacityKg || 0);
                            const bw = Number(v.bookedWeightKg || 0);
                            const rem = v.remainingCapacityKg !== undefined ? Number(v.remainingCapacityKg) : Math.max(0, tc - bw);
                            const full = Boolean(v.isDedicatedReserved) || Boolean(v.isFullyBooked) || rem <= 0;
                            return (
                              <option key={v.id} value={v.id}>
                                {v.vehicleType} ({v.registrationNumber}) • Total: {tc} kg | Booked: {bw} kg | Remaining: {rem} kg {full ? '(FULL)' : ''}
                              </option>
                            );
                          })
                        ) : (
                          <option value="primary">
                            {stats.vehicleType || user?.TransporterProfile?.vehicleType || 'Commercial Goods Carrier'}{(stats.vehicleNumber || user?.TransporterProfile?.vehicleNumber) ? ` (${stats.vehicleNumber || user?.TransporterProfile?.vehicleNumber})` : ''}{(stats.capacityKg || user?.TransporterProfile?.capacityKg) ? ` • ${stats.capacityKg || user?.TransporterProfile?.capacityKg} kg` : ''} [Primary Profile]
                          </option>
                        )}
                      </select>
                    </div>

                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        disabled={groupingTrip || selectedForGrouping.length < 2 || !groupVehicleId || exceedsCapacity}
                        onClick={handleGroupCustomSharedTrip}
                        className={`btn-primary py-2.5 px-6 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md w-full justify-center ${
                          groupingTrip || selectedForGrouping.length < 2 || !groupVehicleId || exceedsCapacity
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
                            <span>Confirm Custom Group ({selectedForGrouping.length} Selected Farmers)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Selected Vehicle Real-Time Capacity Badge & Overbooking Guard */}
                  {selectedVeh && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center bg-white p-2 rounded-lg border border-slate-200/90 shadow-2xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold">Vehicle Total Capacity</span>
                          <span className="font-mono font-bold text-slate-900">{vehCap.toLocaleString('en-IN')} kg</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold">Confirmed Load</span>
                          <span className={`font-mono font-bold ${vehBooked > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                            {vehBooked.toLocaleString('en-IN')} kg
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold">Remaining Capacity</span>
                          <span className={`font-mono font-black ${isVehDedicated ? 'text-amber-700' : isVehFull ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {isVehDedicated ? '0 kg (Reserved)' : isVehFull ? '0 kg (FULL)' : `${vehRem.toLocaleString('en-IN')} kg`}
                          </span>
                        </div>
                      </div>

                      {exceedsCapacity && (
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                          <span>
                            ⚠️ {isVehDedicated ? 'This vehicle is reserved for a dedicated booking.' : isVehFull ? 'This vehicle is already FULL (0 kg free).' : `Selected cargo (${selectedGroupingCargoKg} kg) exceeds remaining vehicle capacity (${vehRem} kg) by ${selectedGroupingCargoKg - vehRem} kg.`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
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
                          Date: {req.pickupDate} • Fare: {formatINR(req.estimatedSharedCost || 1200)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT: MY ACTIVE TRIPS (Phase 7: Audited Stepper Progression) */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Active Trips & Consignment Progression ({activeBookings.length})
              </h3>
              <p className="text-xs text-muted">
                Record farm gate pickups, departure onto highway corridors, and arrival acknowledgments at destination APMC weighbridges.
              </p>
            </div>
            <button
              type="button"
              onClick={loadMyBookings}
              className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Active Trips</span>
            </button>
          </div>

          {activeBookings.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <Truck className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Active Trips in Progress</h4>
              <p className="text-xs text-muted">
                When you accept incoming requests or confirm shared trips, they will appear here with state progression controls.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeBookings.map((trip) => {
                const currentStepIdx = TRIP_PROGRESS_STEPS.findIndex((s) => s.key === trip.status);
                return (
                  <div key={trip.id} className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                            Pass: {trip.gatePassCode || `MH-APMC-${trip.id}`}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            {trip.bookingType === 'shared' ? 'Shared Transport Pool' : 'Individual Cargo'}
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                          {trip.cropName} ({trip.weightKg} kg) ➔ {trip.destinationMarket}
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedGatePass(trip)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Gate Pass (QR)</span>
                        </button>

                        {!['in_transit', 'arrived_destination', 'delivered', 'delivery_confirmed', 'completed', 'cancelled', 'rejected'].includes(trip.status) && (
                          <button
                            type="button"
                            onClick={() => openScheduleModal(trip)}
                            className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Set or update scheduled departure date & time"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>{trip.scheduledDepartureTime ? 'Edit Schedule' : 'Schedule Departure'}</span>
                          </button>
                        )}

                        {/* Action buttons based on current state */}
                        {['accepted', 'vehicle_assigned', 'driver_assigned', 'awaiting_pickup', 'confirmed'].includes(trip.status) && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTripForPickup(trip);
                                setPickupFormData({
                                  actualPickupTime: new Date().toISOString().slice(0, 16),
                                  loadedQuantity: String(trip.weightKg || ''),
                                  pickupNotes: ''
                                });
                              }}
                              className="btn-primary py-1.5 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>Confirm Farm Pickup</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProgressTrip(trip.id, 'in_transit')}
                              className="bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Direct Depart & Start Transit"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Depart</span>
                            </button>
                          </div>
                        )}

                        {trip.status === 'pickup_confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleProgressTrip(trip.id, 'in_transit')}
                            className="bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Start Transit (Depart)</span>
                          </button>
                        )}

                        {trip.status === 'in_transit' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTripForDelivery(trip);
                              setDeliveryFormData({
                                actualDeliveryTime: new Date().toISOString().slice(0, 16),
                                deliveredQuantity: String(trip.weightKg || ''),
                                deliveryNotes: '',
                                recipientAcknowledgment: 'Consignee received and verified at APMC Weighbridge'
                              });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Confirm Mandi Delivery</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 9-Step Audited Progression Stepper (Phase 7) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>Milestone Workflow Progression:</span>
                        <span className="font-mono text-primary uppercase">
                          {trip.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                        {TRIP_PROGRESS_STEPS.map((step, idx) => {
                          const isDone = currentStepIdx >= idx;
                          const isCurrent = trip.status === step.key;
                          const StepIcon = step.icon;
                          return (
                            <div
                              key={step.key}
                              className={`p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                                isCurrent
                                  ? 'bg-primary text-white shadow-xs ring-2 ring-primary ring-offset-1 font-bold'
                                  : isDone
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                                  : 'bg-slate-50 text-slate-400 border border-slate-200'
                              }`}
                            >
                              <StepIcon className="w-3.5 h-3.5 mb-1" />
                              <span className="text-[9.5px] leading-tight line-clamp-2">{step.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Departure Schedule & Transit Status Banner */}
                    <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      trip.actualDepartureTime || ['in_transit', 'arrived_destination', 'delivered', 'completed'].includes(trip.status)
                        ? 'bg-purple-50/80 border-purple-200'
                        : trip.scheduledDepartureTime
                        ? 'bg-blue-50/80 border-blue-200'
                        : 'bg-amber-50/80 border-amber-200'
                    }`}>
                      <div className="flex items-start sm:items-center gap-3">
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          trip.actualDepartureTime || ['in_transit', 'arrived_destination', 'delivered', 'completed'].includes(trip.status)
                            ? 'bg-purple-100 text-purple-700'
                            : trip.scheduledDepartureTime
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Scheduled Departure:
                            </span>
                            {trip.scheduledDepartureTime ? (
                              <span className="text-xs font-extrabold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                                {formatISTDateTime(trip.scheduledDepartureTime)}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                                Departure not scheduled
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                            {trip.actualDepartureTime ? (
                              <span className="font-bold text-purple-800 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                                Actual Departure: {formatISTDateTime(trip.actualDepartureTime)} • (Departed)
                              </span>
                            ) : ['in_transit', 'arrived_destination', 'delivered', 'completed'].includes(trip.status) ? (
                              <span className="font-bold text-purple-800 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                                Status: Vehicle Departed & In Transit
                              </span>
                            ) : (
                              <span className="text-slate-500">
                                Status: <strong className="text-slate-700 uppercase">{trip.status.replace(/_/g, ' ')}</strong> (Awaiting Departure)
                              </span>
                            )}

                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">
                              Farm Pickup Date: <strong className="text-slate-700 font-mono">{trip.pickupDate || 'Today'}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {!['in_transit', 'arrived_destination', 'delivered', 'delivery_confirmed', 'completed', 'cancelled'].includes(trip.status) && (
                        <button
                          type="button"
                          onClick={() => openScheduleModal(trip)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 self-start md:self-auto"
                        >
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>{trip.scheduledDepartureTime ? 'Update Schedule' : 'Schedule Departure'}</span>
                        </button>
                      )}
                    </div>

                    {/* Trip Details Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-[10px] text-muted uppercase font-bold block">Consignor</span>
                        <strong className="text-slate-900 block truncate">{trip.farmerName}</strong>
                        <span className="text-[11px] text-emerald-700 font-mono">{trip.farmerPhone || 'Direct App'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted uppercase font-bold block">Assigned Fleet Carrier</span>
                        <strong className="text-slate-900 block truncate">{trip.vehicleType || stats.vehicleType}</strong>
                        <span className="text-[11px] text-amber-700 font-mono font-bold">{trip.vehicleNumber || stats.vehicleNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted uppercase font-bold block">Pickup Origin</span>
                        <span className="text-slate-800 block truncate">{trip.pickupLocation}</span>
                        <span className="text-[10px] text-muted">{trip.pickupDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted uppercase font-bold block">Freight Revenue</span>
                        <strong className="text-primary font-mono text-sm block">
                          {formatINR(trip.finalCost || trip.estimatedSharedCost || 1200)}
                        </strong>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          {trip.paymentStatus === 'paid' ? '✅ Paid' : '🛡️ Direct APMC Settlement'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 8. TAB CONTENT: CARGO TRIPS & GATE PASS (Phase 12) */}
      {activeTab === 'gatepass' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official Digital Mandi Gate Passes ({myBookings.length})
              </h3>
              <p className="text-xs text-muted">
                Each confirmed consignment includes a digital gate pass with QR code verification for APMC yard entry.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myBookings.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-xs font-black font-mono text-primary block">
                      {b.gatePassCode || `MH-APMC-${b.id}`}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                      {b.cropName} ({b.weightKg} kg)
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted text-[10px] block">Farmer:</span>
                    <strong className="text-slate-800">{b.farmerName}</strong>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] block">Vehicle:</span>
                    <strong className="text-slate-800">{b.vehicleNumber || stats.vehicleNumber}</strong>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] block">Pickup:</span>
                    <span className="text-slate-700 truncate block">{b.pickupLocation}</span>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] block">Destination:</span>
                    <span className="text-slate-700 truncate block">{b.destinationMarket}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-muted font-mono">
                    Dispatch: {b.pickupDate}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedGatePass(b)}
                    className="btn-primary py-1.5 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Open QR Gate Pass</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. TAB CONTENT: FLEET & VEHICLE MANAGEMENT (Phase 5) */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('transporter.fleetTitle') || "Registered Fleet Vehicles"} ({myFleet.length})
              </h3>
              <p className="text-xs text-muted">
                {t('transporter.fleetSubtitle') || "Maintain accurate vehicle registration, payload capacity (kg), special handling, and availability."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddVehicleModal(true)}
              className="btn-primary py-2 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('transporter.registerNewVehicle') || "Register New Vehicle"}</span>
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-black text-slate-900 text-sm">
                        {vehicle.vehicleType}
                      </h4>
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        ID #{vehicle.id}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                      {vehicle.registrationNumber}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                    {vehicle.specialHandling}
                  </span>
                </div>

                {/* Real Database Capacity Matrix */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-white border border-slate-200/90 text-center shadow-2xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block font-semibold">Total Capacity</span>
                      <strong className="text-slate-900 font-mono text-[11px]">
                        {Number(vehicle.totalCapacityKg || vehicle.capacityKg || 0).toLocaleString('en-IN')} kg
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-semibold">Confirmed Load</span>
                      <strong className={`font-mono text-[11px] ${Number(vehicle.bookedWeightKg || 0) > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                        {Number(vehicle.bookedWeightKg || 0).toLocaleString('en-IN')} kg
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-semibold">Remaining</span>
                      <strong
                        className={`font-mono text-[11px] ${
                          vehicle.isDedicatedReserved
                            ? 'text-amber-700 font-black'
                            : vehicle.isFullyBooked || (vehicle.remainingCapacityKg !== undefined && vehicle.remainingCapacityKg <= 0)
                            ? 'text-rose-600 font-black'
                            : 'text-emerald-700 font-black'
                        }`}
                      >
                        {vehicle.isDedicatedReserved
                          ? '0 kg (Reserved)'
                          : vehicle.isFullyBooked || (vehicle.remainingCapacityKg !== undefined && vehicle.remainingCapacityKg <= 0)
                          ? '0 kg (FULL)'
                          : `${Number(vehicle.remainingCapacityKg !== undefined ? vehicle.remainingCapacityKg : vehicle.capacityKg).toLocaleString('en-IN')} kg`}
                      </strong>
                    </div>
                  </div>

                  {/* Capacity Utilization Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>Capacity Utilization</span>
                      <span className="font-mono font-bold text-slate-700">
                        {vehicle.isDedicatedReserved
                          ? 'DEDICATED FULL'
                          : vehicle.isFullyBooked || (vehicle.remainingCapacityKg !== undefined && vehicle.remainingCapacityKg <= 0)
                          ? '100% (FULL)'
                          : `${Math.round(((Number(vehicle.bookedWeightKg || 0)) / (Number(vehicle.totalCapacityKg || vehicle.capacityKg || 1))) * 100)}% Used`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden border border-slate-200/60">
                      <div
                        className={`h-full transition-all duration-300 ${
                          vehicle.isDedicatedReserved
                            ? 'bg-amber-600'
                            : vehicle.isFullyBooked || (vehicle.remainingCapacityKg !== undefined && vehicle.remainingCapacityKg <= 0)
                            ? 'bg-rose-600'
                            : Number(vehicle.bookedWeightKg || 0) > 0
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${vehicle.isDedicatedReserved ? 100 : Math.min(100, Math.round(((Number(vehicle.bookedWeightKg || 0)) / (Number(vehicle.totalCapacityKg || vehicle.capacityKg || 1))) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Existing fields preserved */}
                  <div className="flex justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-muted text-[11px]">{t('transporter.freightRateLabel') || "Freight Rate:"}</span>
                    <strong className="text-slate-900 font-mono">₹{vehicle.ratePerKm}/km</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted text-[11px]">{t('transporter.driverLabel') || "Driver:"}</span>
                    <span className="text-slate-800 font-semibold">{vehicle.driverName} ({vehicle.driverPhone})</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('transporter.apmcVerified') || "APMC Verified"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleVehicleAvailability(vehicle)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      vehicle.isAvailable
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {vehicle.isAvailable ? `🟢 ${t('transporter.available') || 'Available'}` : `🔴 ${t('transporter.inService') || 'In Service'}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. TAB CONTENT: TRIP HISTORY & EARNINGS (Phase 14) */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('transporter.historyTitle') || "Transporter Trip History & Freight Ledger"}
              </h3>
              <p className="text-xs text-muted">
                {t('transporter.historySubtitle') || "Audit all completed and settled transport bookings with actual recorded freight earnings."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="py-2 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('transporter.printReportBtn') || "Print History Report"}</span>
            </button>
          </div>

          {/* History Filters */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span>{t('transporter.filterTitle') || "Filter History Records"}</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-muted font-bold block mb-1">Status</label>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-2 py-1.5 text-xs font-semibold outline-none focus:border-primary bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed & Settled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted font-bold block mb-1">Route Corridor</label>
                <input
                  type="text"
                  placeholder="e.g. Pune, Mumbai, Vashi"
                  value={historyCorridorFilter}
                  onChange={(e) => setHistoryCorridorFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted font-bold block mb-1">Start Date</label>
                <input
                  type="date"
                  value={historyStartDate}
                  onChange={(e) => setHistoryStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted font-bold block mb-1">End Date</label>
                <input
                  type="date"
                  value={historyEndDate}
                  onChange={(e) => setHistoryEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* History Records Table */}
          {loadingHistory ? (
            <div className="p-8 text-center text-xs text-muted">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
              <span>Loading trip history...</span>
            </div>
          ) : tripHistory.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-muted">
              No trip history matches the selected filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Trip ID / Date</th>
                    <th className="py-3 px-4">Consignor Farmer</th>
                    <th className="py-3 px-4">Produce & Quantity</th>
                    <th className="py-3 px-4">Route Corridor</th>
                    <th className="py-3 px-4">Freight Fare</th>
                    <th className="py-3 px-4">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tripHistory.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono">
                        <strong className="text-slate-900 block">{trip.gatePassCode || `#${trip.bookingId || trip.id}`}</strong>
                        <span className="text-[10px] text-muted">{trip.pickupDate}</span>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block">{trip.farmerName}</strong>
                        <span className="text-[10px] text-muted">{trip.bookingType === 'shared' ? 'Shared Pool' : 'Individual'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{trip.cropName}</span>
                        <span className="text-muted block text-[11px] font-mono">
                          Loaded: {trip.loadedQuantity || trip.weightKg} kg
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {trip.pickupLocation} ➔ {trip.destinationMarket}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {formatINR(trip.finalCost || trip.estimatedSharedCost || 1200)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          trip.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {trip.paymentStatus === 'paid' ? 'Paid / Settled' : 'Pending Settlement'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 11. TAB CONTENT: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {t('transporter.notificationsTitle') || "Messages & Dispatch Alerts"}
            </h3>
            <button
              type="button"
              onClick={playBookingNotificationChime}
              className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{t('transporter.testAudioAlert') || "Test Audio Alert Chime"}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {notificationLog.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-0.5 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 text-xs">{item.title}</strong>
                    <span className="text-[10px] text-muted font-mono">{item.time}</span>
                  </div>
                  <p className="text-slate-600">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: REGISTER VEHICLE IN FLEET */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-slate-900">
                  {t('transporter.registerVehicleTitle') || "Register New Vehicle in Fleet"}
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
                  <label className="font-bold text-slate-700">{t('transporter.registrationNumber') || "Registration Number *"}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('transporter.registrationNumberPlaceholder') || "e.g. MH-12-AB-1234"}
                    value={vehicleForm.registrationNumber}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold uppercase outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">{t('transporter.vehicleType') || "Vehicle Type *"}</label>
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
                  <label className="font-bold text-slate-700">{t('transporter.payloadCapacity') || "Usable Payload Capacity (kg) *"}</label>
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
                  <label className="font-bold text-slate-700">{t('transporter.ratePerKm') || "Rate per km (₹) *"}</label>
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
                <label className="font-bold text-slate-700">{t('transporter.specialHandling') || "Special Handling / Body Type"}</label>
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
                <label className="font-bold text-slate-700">{t('transporter.supportedCrops') || "Supported Crops / Cargo Types"}</label>
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
                  <label className="font-bold text-slate-700">{t('transporter.driverName') || "Assigned Driver Name *"}</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.driverName}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">{t('transporter.driverPhone') || "Driver Phone *"}</label>
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
                  {t('transporter.cancelBtn') || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={savingVehicle}
                  className="btn-primary py-2 px-5 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {savingVehicle ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('transporter.registeringBtn') || "Saving..."}</span>
                    </>
                  ) : (
                    <span>{t('transporter.registerBtn') || "Register Vehicle"}</span>
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
                {selectedRequestForAction.type === 'accept' ? (t('transporter.acceptRequestTitle') || 'Accept Booking Request') : (t('transporter.rejectRequestTitle') || 'Reject Booking Request')}
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
                <span className="text-muted">{t('transporter.farmer') || "Farmer:"}</span>
                <span className="font-bold text-slate-900">{selectedRequestForAction.booking.farmerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('transporter.cargo') || "Cargo:"}</span>
                <span className="font-bold text-slate-900">
                  {selectedRequestForAction.booking.weightKg} kg {selectedRequestForAction.booking.cropName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('transporter.route') || "Route:"}</span>
                <span className="font-semibold text-slate-800">
                  {selectedRequestForAction.booking.pickupLocation} ➔ {selectedRequestForAction.booking.destinationMarket}
                </span>
              </div>
            </div>

            {selectedRequestForAction.type === 'accept' ? (
              <div className="space-y-3 text-xs">
                {(() => {
                  const chosenVehicle = assignedVehicleId && assignedVehicleId !== 'primary'
                    ? myFleet.find((v) => String(v.id) === String(assignedVehicleId))
                    : (myFleet[0] || null);

                  const totalCap = chosenVehicle ? Number(chosenVehicle.totalCapacityKg || chosenVehicle.capacityKg || 0) : Number(stats.capacityKg || 0);
                  const bookedLoad = chosenVehicle ? Number(chosenVehicle.bookedWeightKg || 0) : 0;
                  const remaining = chosenVehicle && chosenVehicle.remainingCapacityKg !== undefined
                    ? Number(chosenVehicle.remainingCapacityKg)
                    : Math.max(0, totalCap - bookedLoad);
                  const reqWeight = Number(selectedRequestForAction.booking.weightKg) || 0;
                  const isDedicated = Boolean(chosenVehicle?.isDedicatedReserved);
                  const isFull = isDedicated || Boolean(chosenVehicle?.isFullyBooked) || remaining <= 0;
                  const isOver = isFull || remaining < reqWeight;

                  return (
                    <>
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800">{t('transporter.assignVehicle') || "Assign Vehicle from Fleet *"}</label>
                        <select
                          value={assignedVehicleId}
                          onChange={(e) => setAssignedVehicleId(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold outline-none focus:border-primary bg-white text-slate-800"
                        >
                          {myFleet.length > 0 ? (
                            myFleet.map((v) => {
                              const tc = Number(v.totalCapacityKg || v.capacityKg || 0);
                              const bw = Number(v.bookedWeightKg || 0);
                              const rem = v.remainingCapacityKg !== undefined ? Number(v.remainingCapacityKg) : Math.max(0, tc - bw);
                              const full = Boolean(v.isDedicatedReserved) || Boolean(v.isFullyBooked) || rem <= 0;
                              return (
                                <option key={v.id} value={v.id}>
                                  {v.vehicleType} ({v.registrationNumber}) • Total: {tc} kg | Booked: {bw} kg | Remaining: {rem} kg {full ? '(FULL)' : ''}
                                </option>
                              );
                            })
                          ) : (
                            <option value="primary">
                              {stats.vehicleType || user?.TransporterProfile?.vehicleType || 'Commercial Agri Carrier'}{(stats.vehicleNumber || user?.TransporterProfile?.vehicleNumber) ? ` (${stats.vehicleNumber || user?.TransporterProfile?.vehicleNumber})` : ''}{(stats.capacityKg || user?.TransporterProfile?.capacityKg) ? ` • Capacity ${stats.capacityKg || user?.TransporterProfile?.capacityKg} kg` : ''} [Primary Profile]
                            </option>
                          )}
                        </select>
                      </div>

                      {/* Live Remaining Capacity & Overbooking Guard Display */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="grid grid-cols-3 gap-1 text-center bg-white p-2 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-[10px] text-slate-500 block font-semibold">Total Capacity</span>
                            <span className="font-mono font-bold text-slate-900">{totalCap.toLocaleString('en-IN')} kg</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block font-semibold">Confirmed Load</span>
                            <span className={`font-mono font-bold ${bookedLoad > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                              {bookedLoad.toLocaleString('en-IN')} kg
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block font-semibold">Remaining</span>
                            <span className={`font-mono font-bold ${isDedicated ? 'text-amber-700' : isFull ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {isDedicated ? '0 kg (Reserved)' : isFull ? '0 kg (FULL)' : `${remaining.toLocaleString('en-IN')} kg`}
                            </span>
                          </div>
                        </div>

                        {isOver && (
                          <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                            ⚠️ Cannot assign: {isDedicated ? 'vehicle is reserved for a dedicated booking.' : isFull ? 'vehicle is already FULL (0 kg free).' : `requested load (${reqWeight} kg) exceeds remaining capacity (${remaining} kg).`}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRequestForAction(null)}
                          className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                        >
                          {t('transporter.cancelBtn') || "Cancel"}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading || isOver}
                          onClick={() => handleAcceptBooking(selectedRequestForAction.booking.id)}
                          className={`btn-primary py-2 px-5 rounded-xl font-bold inline-flex items-center gap-1.5 ${
                            actionLoading || isOver ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          {actionLoading ? (t('transporter.assigning') || 'Assigning...') : (t('transporter.confirmAcceptance') || 'Confirm Acceptance')}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">{t('transporter.rejectionReason') || "Reason for Rejection"}</label>
                  <textarea
                    rows={3}
                    placeholder={t('transporter.rejectionReasonPlaceholder') || "e.g. All trucks fully booked on this date, or destination route out of coverage."}
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
                    {t('transporter.cancelBtn') || "Cancel"}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRejectBooking(selectedRequestForAction.booking.id)}
                    className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {actionLoading ? (t('transporter.rejecting') || 'Rejecting...') : (t('transporter.rejectBtn') || 'Reject Request')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: FARM GATE PICKUP CONFIRMATION (Phase 7) */}
      {selectedTripForPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <span>{t('transporter.pickupTitle') || "Record Farm Gate Pickup"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTripForPickup(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPickup} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">{t('transporter.farmer') || "Farmer:"}</span>
                  <strong className="text-slate-900">{selectedTripForPickup.farmerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t('transporter.route') || "Origin:"}</span>
                  <span className="text-slate-800">{selectedTripForPickup.pickupLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t('transporter.loadedWeight') || "Booked Weight:"}</span>
                  <strong className="text-slate-900 font-mono">{selectedTripForPickup.weightKg} kg {selectedTripForPickup.cropName}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">{t('transporter.actualPickupTime') || "Actual Pickup Timestamp *"}</label>
                <input
                  type="datetime-local"
                  required
                  value={pickupFormData.actualPickupTime}
                  onChange={(e) => setPickupFormData({ ...pickupFormData, actualPickupTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">{t('transporter.actualLoadedQty') || "Actual Loaded Quantity (kg) *"}</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={pickupFormData.loadedQuantity}
                  onChange={(e) => setPickupFormData({ ...pickupFormData, loadedQuantity: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">{t('transporter.pickupNotes') || "Pickup Notes / Condition Exceptions"}</label>
                <textarea
                  rows={2}
                  placeholder={t('transporter.pickupNotesPlaceholder') || "e.g. 50 crates inspected, crates loaded and strapped securely onto vehicle bed."}
                  value={pickupFormData.pickupNotes}
                  onChange={(e) => setPickupFormData({ ...pickupFormData, pickupNotes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-medium outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTripForPickup(null)}
                  className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  {t('transporter.cancelBtn') || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submittingPickup}
                  className="btn-primary py-2 px-5 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {submittingPickup ? (t('transporter.recording') || 'Recording...') : (t('transporter.confirmPickup') || 'Confirm Pickup Milestone')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANDI DELIVERY CONFIRMATION (Phase 7) */}
      {selectedTripForDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
                <span>{t('transporter.deliveryTitle') || "Record Destination Delivery"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTripForDelivery(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDelivery} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">{t('transporter.destination') || "Destination:"}</span>
                  <strong className="text-slate-900">{selectedTripForDelivery.destinationMarket}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t('transporter.loadedWeight') || "Loaded Weight:"}</span>
                  <strong className="text-slate-900 font-mono">{selectedTripForDelivery.loadedQuantity || selectedTripForDelivery.weightKg} kg</strong>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">{t('transporter.actualDeliveryTime') || "Actual Arrival Timestamp *"}</label>
                <input
                  type="datetime-local"
                  required
                  value={deliveryFormData.actualDeliveryTime}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, actualDeliveryTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">{t('transporter.deliveredQty') || "Delivered Quantity (kg) *"}</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={deliveryFormData.deliveredQuantity}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, deliveredQuantity: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">{t('transporter.recipientSlip') || "Recipient Acknowledgment / Trader Slip"}</label>
                <input
                  type="text"
                  required
                  value={deliveryFormData.recipientAcknowledgment}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, recipientAcknowledgment: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">{t('transporter.damageNotes') || "Damage / Shortage / Delay Notes (if any)"}</label>
                <textarea
                  rows={2}
                  placeholder={t('transporter.damageNotesPlaceholder') || "e.g. Zero damage, weighbridge verified, consignment received in full."}
                  value={deliveryFormData.deliveryNotes}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, deliveryNotes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-medium outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTripForDelivery(null)}
                  className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  {t('transporter.cancelBtn') || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submittingDelivery}
                  className="btn-primary py-2 px-5 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {submittingDelivery ? (t('transporter.recording') || 'Recording...') : (t('transporter.confirmDelivery') || 'Confirm Delivery Clearance')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE DEPARTURE DATE & TIME */}
      {selectedTripForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>{selectedTripForSchedule.scheduledDepartureTime ? 'Update Scheduled Departure' : 'Set Scheduled Departure'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTripForSchedule(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSchedule} className="space-y-4 text-xs">
              {/* Trip Context Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[11px] font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                    {selectedTripForSchedule.gatePassCode || `PASS-${selectedTripForSchedule.id}`}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {selectedTripForSchedule.bookingType === 'shared' ? 'Shared Transport Pool' : 'Individual Cargo'}
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedTripForSchedule.cropName} ({selectedTripForSchedule.weightKg} kg) ➔ {selectedTripForSchedule.destinationMarket}
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Pickup Origin: <strong className="text-slate-800">{selectedTripForSchedule.pickupLocation}</strong></span>
                  <span>Farm Pickup Date: <strong className="text-slate-800 font-mono">{selectedTripForSchedule.pickupDate || 'Today'}</strong></span>
                </div>
              </div>

              {/* Date & Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Departure Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleFormData.date}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Departure Time *</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleFormData.time}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, time: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Timezone & Live Preview Notice */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Departure Schedule Preview (Indian Standard Time):</span>
                </div>
                <p className="font-mono font-black text-xs text-blue-950">
                  {scheduleFormData.date && scheduleFormData.time
                    ? formatISTDateTime(new Date(`${scheduleFormData.date}T${scheduleFormData.time}:00+05:30`))
                    : 'Select date and time above'}
                </p>
                <p className="text-[10px] text-blue-700">
                  All dates and times are scheduled and displayed in Indian Standard Time (IST, UTC+05:30). Sibling bookings on this trip will receive this authoritative schedule.
                </p>
              </div>

              {/* Operational Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Operational Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Departing yard after morning mandi gate clearance."
                  value={scheduleFormData.notes}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTripForSchedule(null)}
                  className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSchedule}
                  className="py-2 px-5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{submittingSchedule ? 'Saving...' : 'Confirm Scheduled Departure'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Mandi Gate Pass Modal (Phase 12) */}
      <DigitalGatePassModal
        isOpen={Boolean(selectedGatePass)}
        onClose={() => setSelectedGatePass(null)}
        booking={selectedGatePass}
      />
    </div>
  );
}
