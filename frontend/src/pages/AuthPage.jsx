import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ShieldCheck,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthSuccessModal from '../components/common/AuthSuccessModal';

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const isRegister = mode === 'register';

  // 3-Way Role Selector: 'farmer', 'transporter', 'admin'
  const [role, setRole] = useState('farmer');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    // Farmer fields
    district: 'Surat',
    village: '',
    farmSizeAcres: '3.5',
    mainCrop: 'Tomato',
    currentHarvestKg: '500',
    // Transporter fields
    vehicleType: 'Mahindra Bolero Maxi Truck',
    vehicleNumber: '',
    capacityKg: '2000',
    baseMandi: 'Surat APMC',
    ratePerKm: '25',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // 3D Success Popup Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'register',
    data: {},
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateRegister() {
    if (role === 'admin') {
      return 'APMC Administrator accounts cannot be self-registered. Please login with your official credentials.';
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
      const harvestKg = Number(form.currentHarvestKg);
      if (Number.isNaN(harvestKg) || harvestKg <= 0) {
        return 'Please enter your ready harvest quantity in kg (e.g. 500).';
      }
    } else if (role === 'transporter') {
      if (!form.vehicleNumber.trim() || form.vehicleNumber.trim().length < 5) {
        return 'Please enter a valid vehicle registration number (e.g. GJ-05-BX-4921).';
      }
      const cap = Number(form.capacityKg);
      if (Number.isNaN(cap) || cap <= 0) {
        return 'Please enter a valid vehicle payload capacity in kg.';
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
    event.preventDefault();
    setError('');
    setSuccess('');

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
        const payload = await register({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.replace(/\D/g, '').slice(-10),
          password: form.password,
          role,
          // Farmer specifics
          district: form.district.trim(),
          village: form.village.trim(),
          farmSizeAcres: Number(form.farmSizeAcres),
          mainCrop: form.mainCrop || 'Tomato',
          currentHarvestKg: Number(form.currentHarvestKg) || 500,
          // Transporter specifics
          vehicleType: form.vehicleType,
          vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
          capacityKg: Number(form.capacityKg),
          baseMandi: form.baseMandi,
          ratePerKm: Number(form.ratePerKm),
        });

        const msg = payload.message || 'Account registered successfully! Please login with your credentials.';
        setSuccess(msg);

        // Celebratory Toast
        showToast({
          type: 'celebrate',
          title: '🙏 Registration Complete!',
          message: `Thank you, ${form.name.trim()}! Your ${role === 'transporter' ? 'Transporter' : 'Farmer'} profile is now active.`,
          duration: 5000,
        });

        // 3D Thank You & Success Popup Modal
        setModalState({
          isOpen: true,
          mode: 'register',
          data: {
            name: form.name.trim(),
            role,
            phone: form.phone.replace(/\D/g, '').slice(-10),
            email: form.email.trim(),
            district: role === 'farmer' ? form.district : form.baseMandi,
          },
        });
      } else {
        // LOGIN
        const loggedUser = await login(form.email.trim(), form.password);

        // Security role cross-check:
        if (role === 'admin' && loggedUser?.role !== 'admin') {
          throw new Error('Access denied: Account is not an APMC administrator.');
        }

        showToast({
          type: 'success',
          title: '✅ Session Active!',
          message: `Welcome back, ${loggedUser?.name || 'User'}! Loading live agritech intelligence...`,
          duration: 3500,
        });

        // 3D Welcome Popup Modal
        setModalState({
          isOpen: true,
          mode: 'login',
          data: {
            name: loggedUser?.name,
            role: loggedUser?.role || role,
            phone: loggedUser?.phone,
            email: loggedUser?.email,
            district: loggedUser?.FarmerProfile?.district || loggedUser?.TransporterProfile?.baseMandi || 'Surat',
          },
        });
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
    if (modalState.mode === 'register') {
      navigate('/login');
    } else {
      if (role === 'admin' || modalState.data.role === 'admin') {
        navigate('/admin');
      } else if (role === 'transporter' || modalState.data.role === 'transporter') {
        navigate('/transport');
      } else {
        navigate('/dashboard');
      }
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background Photographic Image with Dark Emerald Vignette */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url('/images/dashboard-hero.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/90 to-slate-950/95 backdrop-blur-[1px]" />
      <div className="absolute inset-0 bg-radial-at-t from-emerald-500/15 via-transparent to-black/60 pointer-events-none" />

      {/* 3D Celebratory & Status Popup Modal */}
      <AuthSuccessModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        data={modalState.data}
        onProceed={handleModalProceed}
      />

      <div className="relative z-10 w-full max-w-lg space-y-4">
        <form
          onSubmit={submit}
          className="rounded-3xl border border-white/20 bg-white/95 p-6 sm:p-8 shadow-2xl space-y-4 backdrop-blur-xl"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.15)'
          }}
        >
          {/* Logo & Header */}
          <div className="text-center space-y-2 pb-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-primary/20">
              {role === 'admin' ? (
                <Shield className="w-8 h-8 text-amber-200" />
              ) : role === 'transporter' ? (
                <Truck className="w-8 h-8" />
              ) : (
                <Sprout className="w-8 h-8" />
              )}
            </div>

            <h1 className="text-2xl font-black text-text">
              {isRegister
                ? role === 'transporter'
                  ? 'Register as Transporter / Driver'
                  : role === 'admin'
                  ? 'APMC Admin Clearance'
                  : 'Register Farmer Land & Profile'
                : role === 'admin'
                ? 'APMC Regulatory Officer Login'
                : role === 'transporter'
                ? 'Transporter & Logistics Login'
                : 'Farmer & Produce Login'}
            </h1>

            <p className="text-xs text-muted max-w-sm mx-auto">
              {isRegister
                ? role === 'transporter'
                  ? 'Join our shared transport network. Offer empty truck capacity and earn fair rates directly from local farmers.'
                  : role === 'admin'
                  ? 'Administrative clearance portal for certified APMC mandi regulators.'
                  : 'Join HarvestMitra for real-time mandi prices, harvest intelligence, and pooled vehicle transport.'
                : role === 'admin'
                ? 'Authorized access for mandi regulators, market controllers, and system supervisors.'
                : role === 'transporter'
                ? 'Manage your transport bookings, available truck payload, and view farmer pickup requests.'
                : 'Enter your registered email address or 10-digit mobile number to access your farmer dashboard.'}
            </p>
          </div>

          {/* 3-Way Role Selection Tabs (Visible on BOTH Login and Register) */}
          <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200 grid grid-cols-3 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setRole('farmer');
                setError('');
              }}
              className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                role === 'farmer'
                  ? 'bg-white text-primary shadow-xs border border-primary/20'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Sprout className="w-4 h-4 shrink-0" />
              <span className="truncate">Farmer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('transporter');
                setError('');
              }}
              className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                role === 'transporter'
                  ? 'bg-white text-primary shadow-xs border border-primary/20'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Truck className="w-4 h-4 shrink-0" />
              <span className="truncate">Transporter</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('admin');
                setError('');
              }}
              className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                role === 'admin'
                  ? 'bg-white text-amber-700 shadow-xs border border-amber-300'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span className="truncate">Admin</span>
            </button>
          </div>

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
                APMC Administrator accounts are systematically provisioned by the State Agricultural Marketing Board to verified Mandi Inspectors.
              </p>
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2 py-2 px-5 rounded-xl text-xs font-bold"
              >
                <span>Proceed to Admin Login</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Registration Specific Fields */}
              {isRegister && (
                <div className="space-y-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                      {role === 'transporter' ? 'Driver / Transporter Full Name *' : 'Farmer Full Name *'}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={role === 'transporter' ? 'e.g. Suresh Parmar' : 'e.g. Mihir Jadav'}
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                    />
                  </label>

                  {role === 'farmer' ? (
                    <>
                      <div className="grid grid-cols-2 gap-2.5">
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            District *
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Surat, Mehsana"
                            value={form.district}
                            onChange={(e) => updateField('district', e.target.value)}
                            className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            Farm Land (Acres) *
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            Primary Crop Grown *
                          </span>
                          <select
                            value={form.mainCrop}
                            onChange={(e) => updateField('mainCrop', e.target.value)}
                            className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary bg-white"
                          >
                            <option value="Tomato">Tomato (Hybrid / Desi)</option>
                            <option value="Onion">Onion (Nashik Red)</option>
                            <option value="Potato">Potato (Jyoti / Pukhraj)</option>
                            <option value="Cotton">Cotton (Bt Cotton)</option>
                            <option value="Wheat">Wheat (Sharbati)</option>
                            <option value="Soybean">Soybean (Yellow)</option>
                            <option value="Rice">Rice (Basmati / Paddy)</option>
                            <option value="Maize">Maize (Corn)</option>
                            <option value="Mustard">Mustard (Sarson)</option>
                            <option value="Groundnut">Groundnut (Peanut)</option>
                            <option value="Cumin">Cumin (Jeera)</option>
                            <option value="Garlic">Garlic (Lasan)</option>
                            <option value="Other">Other Agricultural Crop</option>
                          </select>
                        </label>

                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            Ready Harvest (kg) / તૈયાર પાક (કિલો) *
                          </span>
                          <input
                            type="number"
                            required
                            min="10"
                            step="10"
                            placeholder="e.g. 500"
                            value={form.currentHarvestKg}
                            onChange={(e) => updateField('currentHarvestKg', e.target.value)}
                            className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary font-mono"
                          />
                        </label>
                      </div>
                    </>
                  ) : (
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
                            <option value="Tata 407 LPT">Tata 407 LPT</option>
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
                            placeholder="GJ-05-BX-4921"
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
                            className="w-full rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:border-primary"
                          />
                        </label>

                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            Operating Mandi *
                          </span>
                          <select
                            value={form.baseMandi}
                            onChange={(e) => updateField('baseMandi', e.target.value)}
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
                        placeholder="9876543210"
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-xl border border-border pl-10 pr-3.5 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </label>
                </div>
              )}

              {/* Admin 1-Click Credentials Helper */}
              {!isRegister && role === 'admin' && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0">
                    <p className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-700" />
                      <span>APMC Master Administrator</span>
                    </p>
                    <p className="text-[11px] text-amber-800 font-mono mt-0.5 truncate">
                      admin@harvestmitra.local • Admin@12345
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateField('email', 'admin@harvestmitra.local');
                      updateField('password', 'Admin@12345');
                      setError('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
                  >
                    ⚡ Auto-Fill
                  </button>
                </div>
              )}

              {/* Email / Identifier Field */}
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  {isRegister
                    ? 'Email Address *'
                    : role === 'admin'
                    ? 'APMC Admin Email *'
                    : 'Email Address or 10-Digit Mobile Number *'}
                </span>
                <input
                  type={isRegister || role === 'admin' ? 'email' : 'text'}
                  required
                  placeholder={
                    isRegister
                      ? 'farmer@example.com'
                      : role === 'admin'
                      ? 'admin@harvestmitra.local'
                      : 'e.g. mj@gmail.com or 9876543210'
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
                    ? 'Verifying with MySQL...'
                    : isRegister
                    ? role === 'transporter'
                      ? 'Register Transporter Fleet'
                      : 'Register Farmer Account'
                    : role === 'admin'
                    ? 'Login as APMC Admin'
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
