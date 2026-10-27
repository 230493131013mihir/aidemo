import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LogIn,
  Phone,
  Sprout,
  Truck,
  UserPlus,
  Shield,
  Building2,
  Layers,
  Scale,
  ArrowLeft,
  X,
  Search,
  MessageSquare,
  Smartphone,
  KeyRound,
  Users,
  Award,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthSuccessModal from '../components/common/AuthSuccessModal';

const MAHARASHTRA_DISTRICTS = [
  'Pune', 'Nashik', 'Mumbai', 'Ahmednagar', 'Kolhapur',
  'Solapur', 'Sangli', 'Satara', 'Jalgaon', 'Chhatrapati Sambhajinagar',
  'Nagpur', 'Amravati', 'Akola', 'Latur', 'Nanded',
  'Chandrapur', 'Beed', 'Parbhani', 'Buldhana', 'Yavatmal'
];

const STANDARD_CROPS = [
  'Tomato', 'Onion', 'Potato', 'Cotton', 'Wheat',
  'Soybean', 'Rice', 'Maize', 'Pomegranate', 'Grapes',
  'Sugarcane', 'Turmeric', 'Green Chilli', 'Brinjal', 'Garlic',
  'Groundnut', 'Mustard', 'Other'
];

export function normalizeRole(r) {
  if (!r) return 'farmer';
  const s = String(r).toLowerCase().trim();
  if (s === 'farmer') return 'farmer';
  if (s === 'transporter' || s === 'driver') return 'transporter';
  if (s === 'mandi' || s === 'apmc') return 'mandi';
  if (s === 'fpo_leader' || s === 'fpo' || s === 'fpo leader') return 'fpo_leader';
  if (s === 'admin' || s === 'administrator') return 'admin';
  return 'farmer';
}

export function getDashboardRouteForRole(normalizedRole) {
  switch (normalizedRole) {
    case 'admin':
      return '/admin';
    case 'fpo_leader':
      return '/fpo';
    case 'transporter':
      return '/transport';
    case 'mandi':
      return '/dashboard'; // Dedicated Mandi Portal
    case 'farmer':
    default:
      return '/dashboard'; // Dedicated Farmer Analytics & Harvest Portal
  }
}

export function isPathAllowedForRole(pathname, normalizedRole) {
  if (!pathname || pathname === '/' || pathname === '/login' || pathname === '/register') return false;
  
  const SHARED_PATHS = ['/markets', '/prices', '/weather', '/chat', '/assistant', '/profile', '/schemes', '/farmer/schemes'];
  if (SHARED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return true;

  if (normalizedRole === 'admin') return true;

  if (normalizedRole === 'farmer') {
    return pathname === '/dashboard' || pathname.startsWith('/harvest') || pathname.startsWith('/simulator');
  }

  if (normalizedRole === 'transporter') {
    return pathname === '/transport' || pathname === '/dashboard';
  }

  if (normalizedRole === 'mandi') {
    return pathname === '/dashboard';
  }

  if (normalizedRole === 'fpo_leader') {
    return pathname.startsWith('/fpo') || pathname === '/dashboard';
  }

  return false;
}

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, sendOtp, loginWithOtp, loginWithWhatsApp } = useAuth();
  const { showToast } = useToast();
  const isRegister = mode === 'register';

  // 5-Way Role Selector: 'farmer', 'fpo_leader', 'transporter', 'mandi', 'admin'
  const [role, setRole] = useState('farmer');

  // Authentication Mode: 'otp' (Farmer-First Passwordless) vs 'password' (Admin & Standard)
  const [authMethod, setAuthMethod] = useState(isRegister ? 'password' : 'otp');
  const [otpStep, setOtpStep] = useState('phone'); // 'phone' | 'verify'
  const [otpPhone, setOtpPhone] = useState('');
  const [otpName, setOtpName] = useState('');
  const [otpAgristackId, setOtpAgristackId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    // Common location - strictly Maharashtra
    state: 'Maharashtra',
    district: 'Pune',
    village: '',
    // Farmer fields
    farmSizeAcres: '3.5',
    selectedCrops: ['Tomato'],
    customCrop: '',
    // Product-wise quantities map: { cropName: { qty: 500, unit: 'kg' } }
    productQuantities: {
      Tomato: { qty: 500, unit: 'kg' }
    },
    currentHarvestKg: '500',
    // FPO Leader fields
    fpoName: 'Pune Kisan Samruddhi Producer Co Ltd',
    fpoRegistrationNumber: 'FPO-MH-4921',
    memberFarmerCount: '45',
    agristackId: '',
    // Transporter fields
    vehicleType: 'Mahindra Bolero Maxi Truck',
    vehicleNumber: '',
    capacityKg: '2000',
    baseMandi: 'Pune APMC',
    ratePerKm: '26',
    // Mandi Official fields
    mandiName: '',
    licenseNumber: '',
    operatingDays: 'Mon-Sat',
    facilities: 'Electronic Auction, Cold Storage, Modern Weighbridge, RTGS Direct Settlement'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cropSearchTerm, setCropSearchTerm] = useState('');

  // 3D Success Popup Modal state (registration only)
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'register',
    data: {},
  });

  async function handleSendOtp(channel = 'sms') {
    setError('');
    setSuccess('');
    const cleanPhone = otpPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      const msg = 'Please enter a valid 10-digit Indian mobile number.';
      setError(msg);
      showToast({ type: 'error', title: 'Mobile Required', message: msg });
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp({
        phone: cleanPhone,
        channel,
        role,
        name: otpName.trim()
      });

      setDevOtp(res.devOtp || '');
      setOtpStep('verify');
      setCountdown(30);
      showToast({
        type: 'success',
        title: channel === 'whatsapp' ? '💬 WhatsApp Code Sent' : '📲 SMS OTP Dispatched',
        message: res.message || `Verification code sent to +91 ${cleanPhone}.`
      });
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code.');
      showToast({ type: 'error', title: 'Dispatch Error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (loading) return;
    setError('');
    const cleanPhone = otpPhone.replace(/\D/g, '').slice(-10);
    if (!otpCode || otpCode.trim().length < 4) {
      const msg = 'Please enter the 6-digit verification code.';
      setError(msg);
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await loginWithOtp({
        phone: cleanPhone,
        otp: otpCode.trim(),
        role,
        name: otpName.trim(),
        district: form.district || 'Pune',
        state: 'Maharashtra',
        agristackId: otpAgristackId.trim()
      });

      const actualRole = normalizeRole(loggedUser?.role);

      showToast({
        type: 'celebrate',
        title: '🌾 Verification Complete!',
        message: `Welcome, ${loggedUser?.name || 'User'}! Logging into HarvestMitra...`,
        duration: 2500
      });

      navigate(getDashboardRouteForRole(actualRole), { replace: true });
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your code.');
      showToast({ type: 'error', title: 'Verification Error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleWhatsAppQuickLogin() {
    if (loading) return;
    setError('');
    const cleanPhone = otpPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      const msg = 'Please enter a valid 10-digit mobile number for WhatsApp verification.';
      setError(msg);
      showToast({ type: 'error', title: 'Mobile Required', message: msg });
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await loginWithWhatsApp({
        phone: cleanPhone,
        name: otpName.trim(),
        role,
        district: form.district || 'Pune',
        state: 'Maharashtra',
        agristackId: otpAgristackId.trim()
      });

      const actualRole = normalizeRole(loggedUser?.role);

      showToast({
        type: 'celebrate',
        title: '🟢 1-Click WhatsApp Verified!',
        message: `Welcome, ${loggedUser?.name || 'User'}! Verified via WhatsApp handshake.`,
        duration: 2500
      });

      navigate(getDashboardRouteForRole(actualRole), { replace: true });
    } catch (err) {
      setError(err.message || 'WhatsApp authentication failed.');
      showToast({ type: 'error', title: 'WhatsApp Error', message: err.message });
    } finally {
      setLoading(false);
    }
  }



  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  // Calculate dynamic total harvest kg across selected crops
  const calculateTotalKg = (quantities, cropsList, customName) => {
    let total = 0;
    cropsList.forEach(crop => {
      const entryKey = crop === 'Other' && customName ? customName : crop;
      const item = quantities[crop] || quantities[entryKey];
      if (item && item.qty) {
        const val = Number(item.qty) || 0;
        const u = String(item.unit || 'kg').toLowerCase();
        if (u === 'tonne' || u === 'ton' || u === 'mt') {
          total += val * 1000;
        } else if (u === 'quintal' || u === 'qtl') {
          total += val * 100;
        } else {
          total += val;
        }
      }
    });
    return Math.round(total);
  };

  function handleCropToggle(crop) {
    setForm((prev) => {
      const exists = prev.selectedCrops?.includes(crop);
      let updatedCrops;
      const updatedQuantities = { ...prev.productQuantities };

      if (exists) {
        updatedCrops = prev.selectedCrops.filter(c => c !== crop);
        delete updatedQuantities[crop];
      } else {
        updatedCrops = [...(prev.selectedCrops || []), crop];
        if (!updatedQuantities[crop]) {
          updatedQuantities[crop] = { qty: 250, unit: 'kg' };
        }
      }

      const totalKg = calculateTotalKg(updatedQuantities, updatedCrops, prev.customCrop);

      return {
        ...prev,
        selectedCrops: updatedCrops,
        productQuantities: updatedQuantities,
        currentHarvestKg: String(totalKg)
      };
    });
  }

  function handleCropRemove(crop) {
    setForm((prev) => {
      const updatedCrops = prev.selectedCrops.filter(c => c !== crop);
      const updatedQuantities = { ...prev.productQuantities };
      delete updatedQuantities[crop];
      const totalKg = calculateTotalKg(updatedQuantities, updatedCrops, prev.customCrop);
      return {
        ...prev,
        selectedCrops: updatedCrops,
        productQuantities: updatedQuantities,
        currentHarvestKg: String(totalKg)
      };
    });
  }

  function handleProductQtyChange(crop, qtyVal, unitVal) {
    setForm((prev) => {
      const currentEntry = prev.productQuantities[crop] || { qty: 250, unit: 'kg' };
      const nextQty = qtyVal !== undefined ? qtyVal : currentEntry.qty;
      const nextUnit = unitVal !== undefined ? unitVal : currentEntry.unit;

      const updatedQuantities = {
        ...prev.productQuantities,
        [crop]: {
          qty: nextQty,
          unit: nextUnit
        }
      };

      const totalKg = calculateTotalKg(updatedQuantities, prev.selectedCrops, prev.customCrop);

      return {
        ...prev,
        productQuantities: updatedQuantities,
        currentHarvestKg: String(totalKg)
      };
    });
  }

  function validateRegister() {
    if (role === 'admin') {
      return 'APMC Regulatory Officer clearance accounts are provisioned directly. Please login with your official credentials.';
    }

    if (!form.name.trim() || form.name.trim().length < 2) {
      return 'Please enter your full name (minimum 2 characters).';
    }

    const cleanPhone = form.phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return 'Please enter a valid 10-digit mobile number.';
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (!form.password || form.password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    if (role === 'farmer') {
      const farmSize = Number(form.farmSizeAcres);
      if (Number.isNaN(farmSize) || farmSize <= 0) {
        return 'Please enter a valid farm size in acres.';
      }
      if (!form.selectedCrops || form.selectedCrops.length === 0) {
        return 'Please select at least one crop grown on your land.';
      }
      if (form.selectedCrops.includes('Other') && !form.customCrop.trim()) {
        return 'Please enter your custom crop name.';
      }
      for (const crop of form.selectedCrops) {
        const item = form.productQuantities[crop];
        const val = item ? Number(item.qty) : 0;
        if (!item || Number.isNaN(val) || val <= 0) {
          const dName = crop === 'Other' && form.customCrop ? form.customCrop : crop;
          return `Please enter a valid harvest quantity (> 0) for ${dName}.`;
        }
      }
      const harvestKg = Number(form.currentHarvestKg);
      if (Number.isNaN(harvestKg) || harvestKg <= 0) {
        return 'Please enter valid harvest quantities for your selected crops.';
      }
    } else if (role === 'transporter') {
      if (!form.vehicleNumber.trim() || form.vehicleNumber.trim().length < 5) {
        return 'Please enter a valid vehicle registration number (e.g. MH-12-TR-4921).';
      }
      const cap = Number(form.capacityKg);
      if (Number.isNaN(cap) || cap <= 0) {
        return 'Please enter a valid vehicle payload capacity in kg.';
      }
    } else if (role === 'mandi') {
      if (!form.mandiName.trim() || form.mandiName.trim().length < 3) {
        return 'Please enter your official Mandi name (e.g. Pune APMC Market Yard).';
      }
      if (!form.licenseNumber.trim() || form.licenseNumber.trim().length < 4) {
        return 'Please enter your APMC license or registration number (e.g. MH-APMC-8492).';
      }
    }

    return null;
  }

  function validateLogin() {
    const identifier = form.email.trim();
    if (!identifier) {
      return role === 'admin'
        ? 'Please enter your official administrator email.'
        : 'Please enter your registered email address or 10-digit mobile number.';
    }
    if (!form.password) {
      return 'Please enter your password.';
    }
    return null;
  }

  async function submit(event) {
    if (event && event.preventDefault) event.preventDefault();
    if (loading) return;
    setError('');
    setSuccess('');

    if (!isRegister && authMethod === 'otp' && role !== 'admin') {
      if (otpStep === 'phone') {
        return handleSendOtp('sms');
      } else {
        return handleVerifyOtp();
      }
    }

    if (isRegister) {
      const validationError = validateRegister();
      if (validationError) {
        setError(validationError);
        showToast({ type: 'error', title: 'Validation Notice', message: validationError });
        return;
      }
    } else {
      const validationError = validateLogin();
      if (validationError) {
        setError(validationError);
        showToast({ type: 'error', title: 'Login Required', message: validationError });
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        const cropsList = form.selectedCrops.map(c => (c === 'Other' && form.customCrop ? form.customCrop.trim() : c));
        const payload = await register({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.replace(/\D/g, '').slice(-10),
          password: form.password,
          role,
          // Fixed strictly to Maharashtra
          state: 'Maharashtra',
          district: form.district.trim(),
          village: form.village ? form.village.trim() : '',
          // Farmer specifics
          farmSizeAcres: Number(form.farmSizeAcres) || 3.5,
          mainCrop: cropsList.join(', '),
          customCrop: form.selectedCrops.includes('Other') ? form.customCrop.trim() : null,
          currentHarvestKg: Number(form.currentHarvestKg) || 500,
          productQuantities: JSON.stringify(form.productQuantities),
          preferredLanguage: 'mr',
          // FPO specifics
          fpoName: role === 'fpo_leader' ? form.fpoName?.trim() : null,
          fpoRegistrationNumber: role === 'fpo_leader' ? form.fpoRegistrationNumber?.trim() : null,
          memberFarmerCount: role === 'fpo_leader' ? Number(form.memberFarmerCount) || 45 : null,
          agristackId: form.agristackId?.trim() || null,
          // Transporter specifics
          vehicleType: form.vehicleType,
          vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
          capacityKg: Number(form.capacityKg),
          baseMandi: form.baseMandi,
          ratePerKm: Number(form.ratePerKm),
          // Mandi specifics
          mandiName: form.mandiName.trim(),
          licenseNumber: form.licenseNumber.trim().toUpperCase(),
          operatingDays: form.operatingDays,
          facilities: form.facilities
        });

        const registeredRole = normalizeRole(payload.role || role);
        const msg = payload.message || 'Account registered successfully! Entering your dashboard...';
        setSuccess(msg);

        showToast({
          type: 'celebrate',
          title: '🙏 Registration Complete!',
          message: `Welcome, ${form.name.trim()}! Your profile is active. Opening dashboard...`,
          duration: 3000,
        });

        navigate(getDashboardRouteForRole(registeredRole), { replace: true });
      } else {
        // INSTANT LOGIN REDIRECT (Requirement 5: No delay, no countdown, immediate redirect)
        const loggedUser = await login(form.email.trim(), form.password);
        const actualRole = normalizeRole(loggedUser?.role);

        if (role === 'admin' && actualRole !== 'admin') {
          throw new Error('Access denied: Account is not an APMC administrator.');
        }

        showToast({
          type: 'success',
          title: '✅ Session Active!',
          message: `Welcome back, ${loggedUser?.name || 'User'}! Connecting to live Maharashtra APMCs...`,
          duration: 2500,
        });

        const fromPath = location.state?.from?.pathname;
        if (fromPath && isPathAllowedForRole(fromPath, actualRole)) {
          // If a farmer previously navigated to /transport, default them to farmer dashboard
          if (actualRole === 'farmer' && fromPath === '/transport') {
            navigate('/dashboard', { replace: true });
          } else {
            navigate(fromPath, { replace: true });
          }
          return;
        }

        // Direct strictly to role-specific dashboard based on verified backend role
        navigate(getDashboardRouteForRole(actualRole), { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
      showToast({
        type: 'error',
        title: 'Authentication Error',
        message: err.message || 'Unable to authenticate. Please check your credentials.',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleModalProceed() {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    const modalRole = normalizeRole(modalState.data?.role || role);
    navigate(getDashboardRouteForRole(modalRole), { replace: true });
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start px-4 py-6 sm:py-10 overflow-y-auto">
      {/* FIXED Background Layers - Prevents jumping/moving during form scrolling (Requirement 10) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url('/images/dashboard-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/90 to-slate-950/95 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-radial-at-t from-emerald-500/15 via-transparent to-black/60" />
      </div>

      {/* 3D Celebratory Popup Modal for Registration */}
      <AuthSuccessModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        data={modalState.data}
        onProceed={handleModalProceed}
      />

      {/* Top Exit Navigation Bar - Explore Without Login */}
      <div className="relative z-10 w-full max-w-lg flex items-center justify-between pb-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/90 hover:text-white text-xs sm:text-sm font-semibold bg-slate-900/70 hover:bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to Home (Explore Without Login)</span>
        </Link>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-md transition-all"
        >
          <span>Exit</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-4 my-0 sm:my-2">
        <form
          onSubmit={submit}
          className="relative rounded-3xl border border-white/20 bg-white/95 p-6 sm:p-8 shadow-2xl space-y-4 backdrop-blur-xl"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.15)'
          }}
        >
          {/* Top-Right Dismiss Button */}
          <button
            type="button"
            onClick={() => navigate('/')}
            title="Back to Landing Page"
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo & Header */}
          <div className="text-center space-y-2 pb-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-primary/20">
              {role === 'admin' ? (
                <Shield className="w-8 h-8 text-amber-200" />
              ) : role === 'mandi' ? (
                <Building2 className="w-8 h-8 text-teal-200" />
              ) : role === 'transporter' ? (
                <Truck className="w-8 h-8" />
              ) : (
                <Sprout className="w-8 h-8" />
              )}
            </div>

            <h1 className="text-2xl font-black text-text">
              {isRegister
                ? role === 'mandi'
                  ? 'Register Authorized APMC Mandi'
                  : role === 'transporter'
                  ? 'Register as Transporter / Driver'
                  : role === 'admin'
                  ? 'APMC Regulatory Clearance'
                  : 'Register Farmer Land & Produce'
                : role === 'admin'
                ? 'APMC Regulatory Officer Login'
                : role === 'mandi'
                ? 'APMC Mandi Official Login'
                : role === 'transporter'
                ? 'Transporter & Fleet Login'
                : role === 'fpo_leader'
                ? 'FPO Leader / Aggregator Portal'
                : 'Farmer & Produce Login'}
            </h1>

            <p className="text-xs text-muted max-w-sm mx-auto">
              {isRegister
                ? role === 'mandi'
                  ? 'Connect your Maharashtra APMC yard with verified local farmers and logistics networks.'
                  : role === 'transporter'
                  ? 'Offer empty truck capacity and earn fair rates directly from Maharashtra farmers.'
                  : role === 'fpo_leader'
                  ? 'Aggregate member farmers, pool transport freight, and negotiate direct mandi deals.'
                  : role === 'admin'
                  ? 'Administrative clearance portal for certified Maharashtra APMC regulators.'
                  : 'Join HarvestMitra for real-time Maharashtra mandi rates, harvest intelligence, and shared transport.'
                : role === 'admin'
                ? 'Authorized access for Maharashtra APMC regulators, market controllers, and system supervisors.'
                : role === 'mandi'
                ? 'Access incoming farmer produce batches, publish auction rates, and direct procurement.'
                : role === 'transporter'
                ? 'Manage your transport bookings, available truck payload, and view farmer pickup requests.'
                : role === 'fpo_leader'
                ? 'Manage collective produce batches and coordinate group transport.'
                : 'Enter your 10-digit mobile number for instant password-free OTP login or use your registered email.'}
            </p>
          </div>

          {/* Top-Level Mode Selector: Login vs Register */}
          <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200 grid grid-cols-2 gap-1 text-xs sm:text-sm font-bold">
            <Link
              to="/login"
              onClick={() => { setError(''); setSuccess(''); }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center ${
                !isRegister
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Login to Account</span>
            </Link>
            <Link
              to="/register"
              onClick={() => { setError(''); setSuccess(''); }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center ${
                isRegister
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Account</span>
            </Link>
          </div>

          {/* 5-Way Role Selection Tabs */}
          <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200 grid grid-cols-5 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setRole('farmer');
                setError('');
              }}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                role === 'farmer'
                  ? 'bg-white text-primary shadow-xs border border-primary/20'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Sprout className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[10px] sm:text-[11px]">Farmer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('fpo_leader');
                setError('');
              }}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                role === 'fpo_leader'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-300'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[10px] sm:text-[11px]">FPO Leader</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('transporter');
                setError('');
              }}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                role === 'transporter'
                  ? 'bg-white text-primary shadow-xs border border-primary/20'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[10px] sm:text-[11px]">Transporter</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('mandi');
                setError('');
              }}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                role === 'mandi'
                  ? 'bg-white text-teal-700 shadow-xs border border-teal-300'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[10px] sm:text-[11px]">Mandi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('admin');
                setAuthMethod('password');
                setError('');
              }}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                role === 'admin'
                  ? 'bg-white text-amber-700 shadow-xs border border-amber-300'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[10px] sm:text-[11px]">Admin</span>
            </button>
          </div>

          {/* FPO Leader Educational Explanation Banner */}
          {role === 'fpo_leader' && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 text-xs text-emerald-950 space-y-1 shadow-2xs animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>What is an FPO Leader Portal?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700">
                A <strong>Farmer Producer Organisation (FPO)</strong> aggregates harvest batches across 40+ member farmers to negotiate higher bulk APMC wholesale rates and coordinate shared truck transport for collective agricultural dispatches.
              </p>
            </div>
          )}

          {/* Authentication Mode Switcher: Mobile OTP vs Password (Non-admin Login) */}
          {!isRegister && role !== 'admin' && (
            <div className="p-1 rounded-2xl bg-emerald-50/70 border border-emerald-200 grid grid-cols-2 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('otp');
                  setError('');
                }}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMethod === 'otp'
                    ? 'bg-gradient-to-r from-emerald-600 to-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>📱 Mobile OTP & WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('password');
                  setError('');
                }}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMethod === 'password'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>🔑 Password Login</span>
              </button>
            </div>
          )}

          {/* College Evaluation Demo Accounts Quick-Select */}
          {!isRegister && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  College Evaluation Demo Accounts
                </span>
                <span className="text-[10px] text-muted">Click to auto-fill</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  id="demo-account-mihir-btn"
                  onClick={() => {
                    setRole('farmer');
                    setAuthMethod('password');
                    updateField('email', 'mihir');
                    updateField('password', '123456');
                    setError('');
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'farmer' && (form.email === 'farmer' || form.email === 'mihir')
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-emerald-700 font-semibold">🌾 Farmer</div>
                  <div className="font-mono text-xs font-bold text-slate-900 truncate">mihir</div>
                </button>

                <button
                  type="button"
                  id="demo-account-varun-btn"
                  onClick={() => {
                    setRole('transporter');
                    setAuthMethod('password');
                    updateField('email', 'varun');
                    updateField('password', '123456');
                    setError('');
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'transporter' && (form.email === 'transport' || form.email === 'transporter' || form.email === 'varun')
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-blue-700 font-semibold">🚚 Transporter</div>
                  <div className="font-mono text-xs font-bold text-slate-900 truncate">varun</div>
                </button>

                <button
                  type="button"
                  id="demo-account-sayali-btn"
                  onClick={() => {
                    setRole('mandi');
                    setAuthMethod('password');
                    updateField('email', 'sayali');
                    updateField('password', '123456');
                    setError('');
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'mandi' && (form.email === 'mandi' || form.email === 'sayali')
                      ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 hover:border-purple-300 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-purple-700 font-semibold">🏪 Mandi</div>
                  <div className="font-mono text-xs font-bold text-slate-900 truncate">sayali</div>
                </button>

                <button
                  type="button"
                  id="demo-account-prashant-btn"
                  onClick={() => {
                    setRole('admin');
                    setAuthMethod('password');
                    updateField('email', 'prashant');
                    updateField('password', '123456');
                    setError('');
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'admin' && (form.email === 'admin' || form.email === 'prashant')
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 hover:border-amber-300 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-amber-700 font-semibold">🛡️ Admin</div>
                  <div className="font-mono text-xs font-bold text-slate-900 truncate">prashant</div>
                </button>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {success && (
            <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs flex items-start gap-2 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-start gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Admin Register Notice */}
          {isRegister && role === 'admin' ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-center space-y-3">
              <Shield className="w-10 h-10 text-amber-600 mx-auto" />
              <h3 className="text-sm font-bold text-amber-950">Administrative Clearance</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                APMC Administrator accounts are systematically provisioned by the Maharashtra State Agricultural Marketing Board (MSAMB).
              </p>
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2 py-2 px-5 rounded-xl text-xs font-bold"
              >
                <span>Proceed to Admin Login</span>
              </Link>
            </div>
          ) : !isRegister && authMethod === 'otp' && role !== 'admin' ? (
            /* ============================================================ */
            /* FARMER-FIRST OTP & 1-CLICK WHATSAPP AUTHENTICATION UI         */
            /* ============================================================ */
            <div className="space-y-4 pt-1">
              {/* Informative Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-xs flex items-center gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-emerald-950">Farmer-First Access (No Password Required)</p>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    Instant 1-Click WhatsApp verification or 6-digit SMS OTP. Pre-approved Agristack 7/12 land records auto-link seamlessly.
                  </p>
                </div>
              </div>

              {otpStep === 'phone' ? (
                <div className="space-y-3.5">
                  {/* Mobile Number Input */}
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                      10-Digit Mobile Number *
                    </span>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500 font-mono">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        placeholder="9822012345"
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-xl border border-border pl-16 pr-3.5 py-2.5 text-sm font-bold font-mono outline-none focus:border-primary tracking-wider"
                      />
                    </div>
                  </label>

                  {/* Full Name (Optional) */}
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Full Name (Optional for First-Time Users)
                    </span>
                    <input
                      type="text"
                      placeholder={
                        role === 'fpo_leader'
                          ? 'e.g. Kisan Samruddhi FPO'
                          : role === 'transporter'
                          ? 'e.g. Suresh Pawar'
                          : role === 'mandi'
                          ? 'e.g. Ramesh Patil'
                          : 'e.g. Ramesh Patel'
                      }
                      value={otpName}
                      onChange={(e) => setOtpName(e.target.value)}
                      className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                    />
                  </label>

                  {/* PM-KISAN / Agristack ID (Optional) */}
                  {(role === 'farmer' || role === 'fpo_leader') && (
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>PM-KISAN / Agristack ID (Optional)</span>
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. PMK-MH-98201 or AGRI-IND-4921"
                        value={otpAgristackId}
                        onChange={(e) => setOtpAgristackId(e.target.value)}
                        className="w-full rounded-xl border border-border px-3.5 py-2 text-sm font-mono outline-none focus:border-primary"
                      />
                      <span className="text-[10px] text-muted block">
                        Pre-fills official 7/12 land survey and activates paperwork-free DBT matching.
                      </span>
                    </label>
                  )}

                  {/* Action Buttons: SMS OTP vs WhatsApp 1-Click */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendOtp('sms')}
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-700 hover:to-primary-dark text-white font-bold text-sm shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{loading ? 'Dispatching Code...' : 'Send SMS OTP to Mobile'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleWhatsAppQuickLogin}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>💬 1-Click WhatsApp Login (No OTP Needed)</span>
                    </button>
                  </div>


                </div>
              ) : (
                /* OTP Verification Step */
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                    <p className="text-xs text-slate-600">Verification code sent to</p>
                    <p className="text-sm font-black text-slate-900 font-mono tracking-wider">
                      +91 {otpPhone}
                    </p>
                    <button
                      type="button"
                      onClick={() => setOtpStep('phone')}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      ← Change Mobile Number
                    </button>
                  </div>

                  {/* Verification Code Sent Confirmation */}
                  {devOtp && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                      <span className="text-[11px] text-emerald-900 font-semibold">
                        Verification Code: <span className="font-mono font-bold text-emerald-950">{devOtp}</span>
                      </span>
                    </div>
                  )}

                  {/* 6-Digit OTP Input */}
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Enter 6-Digit Code *
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.5em] text-lg font-black font-mono rounded-xl border border-border px-3.5 py-2.5 outline-none focus:border-primary bg-white"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-700 hover:to-primary-dark text-white font-bold text-sm shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{loading ? 'Verifying...' : 'Verify OTP & Enter Dashboard'}</span>
                  </button>

                  <div className="flex items-center justify-between text-xs text-muted pt-1">
                    <span>
                      {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive code?"}
                    </span>
                    <button
                      type="button"
                      disabled={countdown > 0}
                      onClick={() => handleSendOtp('sms')}
                      className={`font-bold ${countdown > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-primary hover:underline cursor-pointer'}`}
                    >
                      Resend via SMS
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Registration Specific Fields */}
              {isRegister && (
                <div className="space-y-3">
                  <div className="pb-1">
                    <span className="text-xs font-bold text-text">Account Information</span>
                  </div>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                      {role === 'mandi'
                        ? 'Official In-Charge Name *'
                        : role === 'transporter'
                        ? 'Driver / Transporter Full Name *'
                        : role === 'fpo_leader'
                        ? 'FPO President / Aggregator Name *'
                        : 'Farmer Full Name *'}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={
                        role === 'mandi'
                          ? 'e.g. Ramesh Patil (APMC Secretary)'
                          : role === 'transporter'
                          ? 'e.g. Suresh Pawar'
                          : 'e.g. Mihir Jadav'
                      }
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                    />
                  </label>

                  {/* Location Grid: Strictly Maharashtra (Requirement 11) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                        State / राज्य * (Fixed)
                      </span>
                      <select
                        value="Maharashtra"
                        disabled
                        className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none bg-slate-100 font-semibold text-slate-700 cursor-not-allowed"
                      >
                        <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
                      </select>
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                        District / जिल्हा *
                      </span>
                      <select
                        value={form.district}
                        onChange={(e) => updateField('district', e.target.value)}
                        className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary bg-white"
                      >
                        {MAHARASHTRA_DISTRICTS.map((dist) => (
                          <option key={dist} value={dist}>
                            {dist}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* FARMER & FPO LEADER REGISTRATION SPECIFICS */}
                  {(role === 'farmer' || role === 'fpo_leader') && (
                    <>
                      {role === 'fpo_leader' && (
                        <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-teal-950 font-bold text-xs">
                            <Users className="w-4 h-4 text-teal-700" />
                            <span>Farmer Producer Organization (FPO) Details</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="block space-y-1">
                              <span className="text-[11px] font-semibold text-slate-700">FPO Organization Name *</span>
                              <input
                                type="text"
                                placeholder="e.g. Pune Kisan Samruddhi FPO"
                                value={form.fpoName}
                                onChange={(e) => updateField('fpoName', e.target.value)}
                                className="w-full rounded-xl border border-teal-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-teal-600"
                              />
                            </label>
                            <label className="block space-y-1">
                              <span className="text-[11px] font-semibold text-slate-700">Member Farmer Count</span>
                              <input
                                type="number"
                                placeholder="45"
                                value={form.memberFarmerCount}
                                onChange={(e) => updateField('memberFarmerCount', e.target.value)}
                                className="w-full rounded-xl border border-teal-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-teal-600"
                              />
                            </label>
                          </div>
                          <label className="block space-y-1">
                            <span className="text-[11px] font-semibold text-slate-700">FPO Agristack / Registration No.</span>
                            <input
                              type="text"
                              placeholder="e.g. FPO-MH-4921 or FPO-MH-7701"
                              value={form.fpoRegistrationNumber}
                              onChange={(e) => updateField('fpoRegistrationNumber', e.target.value)}
                              className="w-full rounded-xl border border-teal-300 bg-white px-3 py-1.5 text-xs font-mono outline-none focus:border-teal-600"
                            />
                          </label>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2.5">
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            Village / गाव
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. Haveli, Baramati"
                            value={form.village}
                            onChange={(e) => updateField('village', e.target.value)}
                            className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                          />
                        </label>

                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            {role === 'fpo_leader' ? 'Collective Land (Acres) *' : 'Farm Land (Acres) *'}
                          </span>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            required
                            placeholder="3.5"
                            value={form.farmSizeAcres}
                            onChange={(e) => updateField('farmSizeAcres', e.target.value)}
                            className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                          />
                        </label>
                      </div>

                      {/* Multi-Crop Selection with Searchable Selector and Tags */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <Sprout className="w-3.5 h-3.5 text-primary" />
                            <span>Select Crops Grown on Your Land *</span>
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                            form.selectedCrops.length > 0 
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                              : 'text-amber-700 bg-amber-50 border-amber-200'
                          }`}>
                            {form.selectedCrops.length} crop{form.selectedCrops.length === 1 ? '' : 's'} selected
                          </span>
                        </div>

                        {/* Search Bar for Crops */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search crops (e.g. Tomato, Onion, Wheat, Cotton)..."
                            value={cropSearchTerm}
                            onChange={(e) => setCropSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-border text-xs bg-white outline-none focus:border-primary"
                          />
                          {cropSearchTerm && (
                            <button
                              type="button"
                              onClick={() => setCropSearchTerm('')}
                              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Selected Crops Badge Chips */}
                        {form.selectedCrops.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 p-2 bg-emerald-50/70 rounded-xl border border-emerald-200">
                            {form.selectedCrops.map((crop) => {
                              const displayName = crop === 'Other' && form.customCrop ? form.customCrop : crop;
                              return (
                                <span
                                  key={crop}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold shadow-2xs"
                                >
                                  <span>{displayName}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCropRemove(crop)}
                                    className="hover:bg-emerald-900 rounded-full w-4 h-4 inline-flex items-center justify-center text-xs ml-0.5 cursor-pointer font-bold"
                                    title={`Remove ${displayName}`}
                                  >
                                    ✕
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Available Crops Grid (Filtered) */}
                        <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto pr-1">
                          {STANDARD_CROPS
                            .filter(crop => crop.toLowerCase().includes(cropSearchTerm.toLowerCase()) || crop === 'Other')
                            .map((crop) => {
                              const isSelected = form.selectedCrops.includes(crop);
                              return (
                                <button
                                  key={crop}
                                  type="button"
                                  onClick={() => handleCropToggle(crop)}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white shadow-xs border border-emerald-700'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  <span>{crop}</span>
                                  {isSelected ? <span>✓</span> : <span className="opacity-40">+</span>}
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* Custom Crop Input when "Other" is chosen */}
                      {form.selectedCrops.includes('Other') && (
                        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5">
                          <label className="block space-y-1">
                            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                              Custom Crop Name (इतर पीक) *
                            </span>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Dragonfruit, Custard Apple (Sitaphal), Ginger"
                              value={form.customCrop}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateField('customCrop', val);
                              }}
                              className="w-full rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-amber-500 font-semibold"
                            />
                          </label>
                        </div>
                      )}

                      {/* Product-Wise Quantity Inputs with kg / quintal / tonne toggle */}
                      {form.selectedCrops.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Scale className="w-3.5 h-3.5 text-primary" />
                              <span>Harvest Quantity per Crop *</span>
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                              Total: {Number(form.currentHarvestKg).toLocaleString('en-IN')} kg
                            </span>
                          </div>

                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {form.selectedCrops.map((crop) => {
                              const displayName = crop === 'Other' && form.customCrop ? form.customCrop : crop;
                              const item = form.productQuantities[crop] || { qty: 250, unit: 'kg' };
                              return (
                                <div
                                  key={crop}
                                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-1.5 min-w-[90px] truncate">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {displayName}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="1"
                                      step="any"
                                      required
                                      value={item.qty}
                                      onChange={(e) => handleProductQtyChange(crop, Number(e.target.value), item.unit)}
                                      className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-mono font-bold outline-none focus:border-primary text-right"
                                    />

                                    {/* Unit Toggle: kg vs quintal vs tonne */}
                                    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-[10px] font-bold">
                                      <button
                                        type="button"
                                        onClick={() => handleProductQtyChange(crop, item.qty, 'kg')}
                                        className={`px-1.5 py-0.5 rounded-md transition-all ${
                                          item.unit === 'kg'
                                            ? 'bg-primary text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-black'
                                        }`}
                                      >
                                        kg
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleProductQtyChange(crop, item.qty, 'quintal')}
                                        className={`px-1.5 py-0.5 rounded-md transition-all ${
                                          item.unit === 'quintal' || item.unit === 'qtl'
                                            ? 'bg-primary text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-black'
                                        }`}
                                      >
                                        qtl
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleProductQtyChange(crop, item.qty, 'tonne')}
                                        className={`px-1.5 py-0.5 rounded-md transition-all ${
                                          item.unit === 'tonne' || item.unit === 'ton'
                                            ? 'bg-primary text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-black'
                                        }`}
                                      >
                                        tonne
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* MANDI OFFICIAL REGISTRATION SPECIFICS */}
                  {role === 'mandi' && (
                    <div className="space-y-3 p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200">
                      <label className="block space-y-1">
                        <span className="text-xs font-semibold text-teal-900 uppercase tracking-wider">
                          APMC Mandi Name
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Pune APMC Market Yard"
                          value={form.mandiName}
                          onChange={(e) => updateField('mandiName', e.target.value)}
                          className="w-full rounded-xl border border-teal-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-teal-600"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-2.5">
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-teal-900 uppercase tracking-wider">
                            APMC License Number
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="MH-APMC-PUN-8492"
                            value={form.licenseNumber}
                            onChange={(e) => updateField('licenseNumber', e.target.value.toUpperCase())}
                            className="w-full rounded-xl border border-teal-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-teal-600 font-mono uppercase"
                          />
                        </label>

                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-teal-900 uppercase tracking-wider">
                            Operating Days
                          </span>
                          <select
                            value={form.operatingDays}
                            onChange={(e) => updateField('operatingDays', e.target.value)}
                            className="w-full rounded-xl border border-teal-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-teal-600 cursor-pointer"
                          >
                            <option value="Mon-Sat">Mon-Sat</option>
                            <option value="Mon-Fri">Mon-Fri</option>
                            <option value="Daily">Daily</option>
                          </select>
                        </label>
                      </div>

                      <label className="block space-y-1">
                        <span className="text-xs font-semibold text-teal-900 uppercase tracking-wider">
                          Mandi Facilities & Infrastructure
                        </span>
                        <input
                          type="text"
                          value={form.facilities}
                          onChange={(e) => updateField('facilities', e.target.value)}
                          className="w-full rounded-xl border border-teal-300 bg-white px-3.5 py-2 text-xs outline-none focus:border-teal-600"
                        />
                      </label>
                    </div>
                  )}

                  {/* TRANSPORTER REGISTRATION SPECIFICS */}
                  {role === 'transporter' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            Vehicle Model *
                          </span>
                          <select
                            value={form.vehicleType}
                            onChange={(e) => updateField('vehicleType', e.target.value)}
                            className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary bg-white"
                          >
                            <option value="Mahindra Bolero Maxi Truck">Mahindra Bolero Maxi</option>
                            <option value="Tata 407 Agri LCV">Tata 407 Agri LCV</option>
                            <option value="Eicher Pro 2049">Eicher Pro 2049</option>
                            <option value="Tata Ace Gold">Tata Ace Gold (Chota Hathi)</option>
                            <option value="Tractor Trolley">Tractor Trolley</option>
                            <option value="Ashok Leyland Dost">Ashok Leyland Dost</option>
                          </select>
                        </label>

                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            Vehicle Reg Number *
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="MH-12-TR-4921"
                            value={form.vehicleNumber}
                            onChange={(e) => updateField('vehicleNumber', e.target.value.toUpperCase())}
                            className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary font-mono uppercase"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            Payload Capacity (kg) *
                          </span>
                          <input
                            type="number"
                            required
                            min="500"
                            step="100"
                            placeholder="2000"
                            value={form.capacityKg}
                            onChange={(e) => updateField('capacityKg', e.target.value)}
                            className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary font-mono"
                          />
                        </label>

                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            Base Mandi *
                          </span>
                          <select
                            value={form.baseMandi}
                            onChange={(e) => updateField('baseMandi', e.target.value)}
                            className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary bg-white"
                          >
                            <option value="Pune APMC">Pune APMC</option>
                            <option value="Nashik APMC">Nashik APMC</option>
                            <option value="Mumbai Vashi APMC">Mumbai Vashi APMC</option>
                            <option value="Ahmednagar APMC">Ahmednagar APMC</option>
                            <option value="Solapur APMC">Solapur APMC</option>
                            <option value="Kolhapur APMC">Kolhapur APMC</option>
                            <option value="Nagpur APMC">Nagpur APMC</option>
                            <option value="Jalgaon APMC">Jalgaon APMC</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* 10-Digit Mobile Number */}
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Mobile Number (10 Digits) *
                    </span>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-muted absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9822012345"
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-xl border border-border pl-10 pr-3.5 py-2 text-sm outline-none focus:border-primary font-mono"
                      />
                    </div>
                  </label>
                </div>
              )}



              {/* Email / Identifier Field */}
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  {isRegister
                    ? 'Email Address *'
                    : role === 'admin'
                    ? 'APMC Admin Username or Email *'
                    : role === 'mandi'
                    ? 'APMC Mandi Username, Email or Mobile *'
                    : 'Username, Email or 10-Digit Mobile *'}
                </span>
                <input
                  type={isRegister ? 'email' : 'text'}
                  required
                  placeholder={
                    isRegister
                      ? 'official@example.com'
                      : role === 'admin'
                      ? 'e.g. admin or prashant'
                      : role === 'mandi'
                      ? 'e.g. mandi or sayali'
                      : role === 'transporter'
                      ? 'e.g. transport or varun'
                      : 'e.g. farmer or mihir'
                  }
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              {/* Password Field with Show/Hide Toggle */}
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Password *
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="w-full rounded-xl border border-border px-3.5 py-2 pr-10 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-2.5 text-muted hover:text-text transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2 rounded-xl shadow-sm text-sm font-bold"
              >
                {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>
                  {loading
                    ? 'Connecting to Live MySQL...'
                    : isRegister
                    ? role === 'mandi'
                      ? 'Register APMC Mandi'
                      : role === 'transporter'
                      ? 'Register Transporter Fleet'
                      : 'Register Farmer Account'
                    : role === 'admin'
                    ? 'Login as APMC Regulator'
                    : role === 'mandi'
                    ? 'Login to Mandi Portal'
                    : role === 'transporter'
                    ? 'Login to Logistics Portal'
                    : 'Login to Farmer Dashboard'}
                </span>
              </button>
            </>
          )}

          {/* Mode Switcher */}
          <div className="pt-2 text-center text-xs text-muted">
            {isRegister ? 'Already registered?' : "Don't have an account yet?"}{' '}
            <Link
              to={isRegister ? '/login' : '/register'}
              className="font-bold text-primary hover:underline"
              onClick={() => {
                setError('');
                setSuccess('');
              }}
            >
              {isRegister ? 'Login here' : 'Register here'}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
