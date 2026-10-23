import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  MapPin,
  Phone,
  Layers,
  Globe,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
  Shield,
  Building,
  Sprout,
  Scale,
  Truck,
  IndianRupee,
  Navigation,
  ExternalLink,
  Award,
  Key,
  LogOut,
  Store,
  Calendar,
  Warehouse
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/common/LanguageSelector';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, updateProfile, logout } = useAuth();

  const userRole = user?.role || 'farmer';
  const farmerProfile = user?.FarmerProfile;
  const transporterProfile = user?.TransporterProfile;
  const mandiProfile = user?.MandiProfile;

  const initialFarmerCrops = (farmerProfile?.mainCrop || 'Tomato')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Unified form state handling all roles
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    // Farmer fields
    district: farmerProfile?.district || 'Pune',
    state: 'Maharashtra',
    village: farmerProfile?.village || '',
    farmSizeAcres: farmerProfile?.farmSizeAcres ? String(farmerProfile.farmSizeAcres) : '4.5',
    mainCrop: farmerProfile?.mainCrop || 'Tomato',
    selectedCrops: initialFarmerCrops.length > 0 ? initialFarmerCrops : ['Tomato'],
    currentHarvestKg: farmerProfile?.currentHarvestKg ? String(farmerProfile.currentHarvestKg) : '',
    preferredLanguage: farmerProfile?.preferredLanguage || 'mr',
    // Transporter fields
    vehicleType: transporterProfile?.vehicleType || 'Mahindra Bolero Maxi Truck',
    vehicleNumber: transporterProfile?.vehicleNumber || 'MH-12-TR-4921',
    capacityKg: transporterProfile?.capacityKg ? String(transporterProfile.capacityKg) : '2200',
    baseMandi: transporterProfile?.baseMandi || 'Pune APMC',
    ratePerKm: transporterProfile?.ratePerKm ? String(transporterProfile.ratePerKm) : '26',
    isAvailable: transporterProfile?.isAvailable ?? true,
    // Admin fields
    department: 'APMC Market Intelligence & Agricultural Standards Bureau',
    designation: 'Chief APMC Mandi Market Regulator',
    // Mandi Official fields
    mandiName: mandiProfile?.mandiName || 'Pune APMC',
    licenseNumber: mandiProfile?.licenseNumber || '',
    operatingDays: mandiProfile?.operatingDays || 'Mon-Sat',
    facilities: mandiProfile?.facilities || 'Cold Storage, Grading, Weighbridge',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync form when user changes
  useEffect(() => {
    if (user) {
      const crops = (user.FarmerProfile?.mainCrop || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      setForm((prev) => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        district: user.FarmerProfile?.district || prev.district,
        state: user.FarmerProfile?.state || prev.state,
        village: user.FarmerProfile?.village || prev.village,
        farmSizeAcres: user.FarmerProfile?.farmSizeAcres ? String(user.FarmerProfile.farmSizeAcres) : prev.farmSizeAcres,
        mainCrop: user.FarmerProfile?.mainCrop || prev.mainCrop,
        selectedCrops: crops.length > 0 ? crops : (prev.selectedCrops?.length ? prev.selectedCrops : ['Tomato']),
        currentHarvestKg: user.FarmerProfile?.currentHarvestKg ? String(user.FarmerProfile.currentHarvestKg) : prev.currentHarvestKg,
        preferredLanguage: user.FarmerProfile?.preferredLanguage || prev.preferredLanguage,
        vehicleType: user.TransporterProfile?.vehicleType || prev.vehicleType,
        vehicleNumber: user.TransporterProfile?.vehicleNumber || prev.vehicleNumber,
        capacityKg: user.TransporterProfile?.capacityKg ? String(user.TransporterProfile.capacityKg) : prev.capacityKg,
        baseMandi: user.TransporterProfile?.baseMandi || prev.baseMandi,
        ratePerKm: user.TransporterProfile?.ratePerKm ? String(user.TransporterProfile.ratePerKm) : prev.ratePerKm,
        isAvailable: user.TransporterProfile?.isAvailable ?? prev.isAvailable,
      }));
    }
  }, [user]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      if (userRole === 'mandi') {
        await updateProfile({
          name: form.name,
          phone: form.phone,
          mandiName: form.mandiName,
          licenseNumber: form.licenseNumber,
          operatingDays: form.operatingDays,
          facilities: form.facilities,
        });
        setSuccessMsg('Mandi Official APMC profile updated successfully in MySQL!');
      } else if (userRole === 'admin') {
        await updateProfile({
          name: form.name,
          phone: form.phone,
        });
        setSuccessMsg('Administrator credentials and contact info updated!');
      } else if (userRole === 'transporter') {
        await updateProfile({
          name: form.name,
          phone: form.phone,
          vehicleType: form.vehicleType,
          vehicleNumber: form.vehicleNumber,
          capacityKg: Number(form.capacityKg),
          baseMandi: form.baseMandi,
          ratePerKm: Number(form.ratePerKm),
          isAvailable: form.isAvailable,
        });
        setSuccessMsg('Transporter fleet profile and vehicle specs updated in MySQL!');
      } else {
        // Farmer
        const selectedList = form.selectedCrops?.length > 0 
          ? form.selectedCrops 
          : [form.mainCrop || 'Tomato'];
        const cropsToSave = selectedList.join(', ');

        // Create cleanQuantities containing ONLY the crops in form.selectedCrops
        let existingQuantities = {};
        const rawPQ = farmerProfile?.productQuantities || user?.farmerProfile?.productQuantities;
        if (typeof rawPQ === 'string') {
          try {
            existingQuantities = JSON.parse(rawPQ) || {};
          } catch {
            existingQuantities = {};
          }
        } else if (typeof rawPQ === 'object' && rawPQ !== null) {
          existingQuantities = rawPQ;
        }

        const cleanQuantities = {};
        selectedList.forEach((crop) => {
          const matchKey = Object.keys(existingQuantities).find(
            (k) => k.toLowerCase() === crop.toLowerCase()
          );
          if (matchKey && existingQuantities[matchKey]) {
            cleanQuantities[crop] = existingQuantities[matchKey];
          } else {
            cleanQuantities[crop] = { qty: 500, unit: 'kg' };
          }
        });

        await updateProfile({
          name: form.name,
          phone: form.phone,
          district: form.district,
          state: form.state,
          village: form.village,
          farmSizeAcres: Number(form.farmSizeAcres) || 1,
          mainCrop: cropsToSave,
          productQuantities: cleanQuantities,
          currentHarvestKg: form.currentHarvestKg ? Number(form.currentHarvestKg) : null,
          preferredLanguage: form.preferredLanguage,
        });
        setSuccessMsg('Farmer profile and ready harvest data updated successfully in MySQL!');
      }
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      {/* 1. ROLE-BASED PAGE HEADER */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            {userRole === 'admin' ? (
              <Shield className="w-4 h-4 text-purple-600" />
            ) : userRole === 'mandi' ? (
              <Store className="w-4 h-4 text-orange-600" />
            ) : userRole === 'transporter' ? (
              <Truck className="w-4 h-4 text-blue-600" />
            ) : (
              <User className="w-4 h-4 text-emerald-600" />
            )}
            <span>
              {userRole === 'admin'
                ? 'APMC Central Regulatory Authority'
                : userRole === 'mandi'
                ? 'APMC Mandi Official Profile'
                : userRole === 'transporter'
                ? 'Commercial Transport Fleet Profile'
                : 'Verified Farmer Agricultural Profile'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
            {userRole === 'admin'
              ? 'Administrator Profile & System Clearance'
              : userRole === 'mandi'
              ? 'Mandi Official Profile & APMC License'
              : userRole === 'transporter'
              ? 'Transporter & Fleet Vehicle Profile'
              : t('profile.title', 'Farmer Profile Settings')}
          </h1>

          <p className="text-sm text-muted mt-1">
            {userRole === 'admin'
              ? 'System access credentials, regulatory permissions, and APMC audit controls.'
              : userRole === 'mandi'
              ? 'Manage your APMC mandi details, license, operating schedule, and market facilities.'
              : userRole === 'transporter'
              ? 'Commercial vehicle specifications, payload limits, base mandi routes, and fare rates.'
              : 'Manage personal farmer credentials, ready harvest quantity, and APMC market location.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`badge-tag text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${
              userRole === 'admin'
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : userRole === 'mandi'
                ? 'bg-orange-50 text-orange-800 border-orange-200'
                : userRole === 'transporter'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{userRole.toUpperCase()} • MySQL Synced</span>
          </span>

          <button
            type="button"
            id="profile-sign-out-btn"
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors shadow-2xs"
            title="Sign out of HarvestMitra AI"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. FEEDBACK NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 text-sm flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* 3. ROLE-SPECIFIC VIEWS */}

      {/* ======================================================== */}
      {/* ROLE 1: ADMIN PROFILE (Official APMC Authority)           */}
      {/* ======================================================== */}
      {userRole === 'admin' && (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-harvest p-6 space-y-5 bg-white border border-border rounded-3xl shadow-sm">
              <div className="border-b border-border/80 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text">Administrator Credentials</h2>
                  <p className="text-xs text-muted">Authorized official details and regulatory jurisdiction</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                  Superuser Clearance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Official Admin Name *
                  </span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                    placeholder="e.g. APMC Administrator"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Direct Contact Phone
                  </span>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2.5 text-sm font-mono outline-none focus:border-primary"
                      placeholder="9999999991"
                    />
                  </div>
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Official APMC Email (Read-Only)
                </span>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'admin@harvestmitra.local'}
                  className="w-full rounded-xl border border-border/60 bg-slate-50 px-3.5 py-2.5 text-sm text-muted cursor-not-allowed font-mono"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Regulatory Division</span>
                  <p className="text-xs font-bold text-slate-800">APMC Mandi Price Benchmarking Bureau</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Jurisdiction</span>
                  <p className="text-xs font-bold text-slate-800">State Agricultural Marketing Board</p>
                </div>
              </div>
            </div>

            {/* Quick Action to APMC Admin Console */}
            <div className="card-harvest p-6 bg-gradient-to-br from-slate-900 to-purple-950 text-white rounded-3xl shadow-lg space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">APMC Central Regulatory Console</h3>
                  <p className="text-xs text-purple-200/80">Authorize daily rates, manage mandi entries, inspect transport dispatches</p>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs transition-colors shadow-md"
                >
                  <span>Open APMC Control Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating...' : 'Save Administrator Profile'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: System Permissions Badge */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-border shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-text flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Security Clearance</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-muted">
                <li className="flex items-center gap-2 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Daily Mandi Benchmark Rate Publishing</span>
                </li>
                <li className="flex items-center gap-2 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Farmer & Transporter Account Audits</span>
                </li>
                <li className="flex items-center gap-2 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Statewide Logistics Dispatch Monitoring</span>
                </li>
                <li className="flex items-center gap-2 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct MySQL Record Updates</span>
                </li>
              </ul>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* ROLE 2: TRANSPORTER PROFILE (Fleet & Commercial Logistics) */}
      {/* ======================================================== */}
      {userRole === 'transporter' && (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Driver Identity Card */}
            <div className="card-harvest p-6 space-y-5 bg-white border border-border rounded-3xl shadow-sm">
              <div className="border-b border-border/80 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text">Driver & Fleet Owner Identity</h2>
                  <p className="text-xs text-muted">Contact details presented to farmers when you accept cargo trips</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  Fleet Provider
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Driver / Owner Name *
                  </span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                    placeholder="e.g. Suresh Parmar"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Mobile Number (Shared with Farmers) *
                  </span>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2.5 text-sm font-mono outline-none focus:border-primary"
                      placeholder="9876543210"
                    />
                  </div>
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Registered Account Email
                </span>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'transporter@harvestmitra.local'}
                  className="w-full rounded-xl border border-border/60 bg-slate-50 px-3.5 py-2.5 text-sm text-muted cursor-not-allowed font-mono"
                />
              </label>
            </div>

            {/* Vehicle Fleet Specifications */}
            <div className="card-harvest p-6 space-y-5 bg-white border border-border rounded-3xl shadow-sm">
              <div className="border-b border-border/80 pb-3">
                <h2 className="text-lg font-bold text-text">Vehicle Fleet Specifications</h2>
                <p className="text-xs text-muted">
                  Used by our matching engine to calculate pooling capacity and route availability
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Vehicle Model *
                  </span>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => handleChange('vehicleType', e.target.value)}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary bg-white"
                  >
                    <option value="Mahindra Bolero Maxi Truck">Mahindra Bolero Maxi Truck</option>
                    <option value="Tata 407 LPT">Tata 407 LPT</option>
                    <option value="Eicher Pro 2049">Eicher Pro 2049</option>
                    <option value="Tata Ace Gold">Tata Ace Gold (Chota Hathi)</option>
                    <option value="Ashok Leyland Dost">Ashok Leyland Dost</option>
                    <option value="Tractor Trolley">Tractor Trolley</option>
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Registration Plate (e.g. GJ-05-BX-4921) *
                  </span>
                  <input
                    type="text"
                    required
                    value={form.vehicleNumber}
                    onChange={(e) => handleChange('vehicleNumber', e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-mono font-bold uppercase outline-none focus:border-primary"
                    placeholder="GJ-05-BX-4921"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Max Capacity (kg) *
                  </span>
                  <input
                    type="number"
                    required
                    min="500"
                    step="100"
                    value={form.capacityKg}
                    onChange={(e) => handleChange('capacityKg', e.target.value)}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-mono font-bold outline-none focus:border-primary"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Operating Base Mandi *
                  </span>
                  <select
                    value={form.baseMandi}
                    onChange={(e) => handleChange('baseMandi', e.target.value)}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary bg-white"
                  >
                    <option value="Surat APMC">Surat APMC</option>
                    <option value="Ahmedabad APMC">Ahmedabad APMC</option>
                    <option value="Rajkot APMC">Rajkot APMC</option>
                    <option value="Vadodara APMC">Vadodara APMC</option>
                    <option value="Mehsana APMC">Mehsana APMC</option>
                    <option value="Pune APMC">Pune APMC</option>
                    <option value="Nashik APMC">Nashik APMC</option>
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Freight Rate (₹ / km) *
                  </span>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    <input
                      type="number"
                      required
                      min="10"
                      step="1"
                      value={form.ratePerKm}
                      onChange={(e) => handleChange('ratePerKm', e.target.value)}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2.5 text-sm font-mono font-bold outline-none focus:border-primary"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Update Fleet Profile'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Transporter Dashboard Link & Quick Card */}
          <div className="space-y-6">
            <div className="card-harvest p-6 bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-3xl shadow-lg space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Cargo Dispatch Portal</h3>
                  <p className="text-xs text-blue-200/80">Manage assigned loads and view live transit timers</p>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  to="/transport"
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-md"
                >
                  <span>Open Logistics Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* ROLE 3: MANDI OFFICIAL PROFILE (APMC License & Facilities) */}
      {/* ======================================================== */}
      {userRole === 'mandi' && (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Mandi Official Identity Card */}
            <div className="card-harvest p-6 space-y-5 bg-white border border-border rounded-3xl shadow-sm">
              <div className="border-b border-border/80 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text">Mandi Official Identity</h2>
                  <p className="text-xs text-muted">Authorized APMC mandi official details and license information</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
                  APMC Licensed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Official Name *
                  </span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                    placeholder="e.g. Sayali Kulkarni"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Contact Phone *
                  </span>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2.5 text-sm font-mono outline-none focus:border-primary"
                      placeholder="9876543210"
                    />
                  </div>
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Official APMC Email (Read-Only)
                </span>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'mandi@harvestmitra.local'}
                  className="w-full rounded-xl border border-border/60 bg-slate-50 px-3.5 py-2.5 text-sm text-muted cursor-not-allowed font-mono"
                />
              </label>
            </div>

            {/* APMC Mandi Details */}
            <div className="card-harvest p-6 space-y-5 bg-white border border-border rounded-3xl shadow-sm">
              <div className="border-b border-border/80 pb-3">
                <h2 className="text-lg font-bold text-text">APMC Mandi Details & License</h2>
                <p className="text-xs text-muted">
                  Market yard registration, operating schedule, and available facilities
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Mandi Name *
                  </span>
                  <div className="relative">
                    <Store className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={form.mandiName}
                      onChange={(e) => handleChange('mandiName', e.target.value)}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                      placeholder="e.g. Pune APMC"
                    />
                  </div>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    APMC License Number *
                  </span>
                  <div className="relative">
                    <Award className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={form.licenseNumber}
                      onChange={(e) => handleChange('licenseNumber', e.target.value)}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2.5 text-sm font-mono font-bold uppercase outline-none focus:border-primary"
                      placeholder="e.g. APMC-MH-PUN-2024-0091"
                    />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Operating Days *
                  </span>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    <select
                      value={form.operatingDays}
                      onChange={(e) => handleChange('operatingDays', e.target.value)}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2.5 text-sm font-semibold outline-none focus:border-primary bg-white"
                    >
                      <option value="Mon-Sat">Mon-Sat (6 days)</option>
                      <option value="Mon-Fri">Mon-Fri (5 days)</option>
                      <option value="All Days">All Days (7 days)</option>
                      <option value="Tue-Sun">Tue-Sun (6 days)</option>
                    </select>
                  </div>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Market Facilities
                  </span>
                  <div className="relative">
                    <Warehouse className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={form.facilities}
                      onChange={(e) => handleChange('facilities', e.target.value)}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                      placeholder="e.g. Cold Storage, Grading, Weighbridge"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating...' : 'Save Mandi Profile'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Mandi Quick Info */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-orange-50/60 border border-orange-200/80 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-orange-950 flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-600" />
                <span>Mandi Snapshot</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-orange-200/50">
                  <span className="text-slate-600 font-medium">Mandi:</span>
                  <span className="font-bold text-slate-900">{form.mandiName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-orange-200/50">
                  <span className="text-slate-600 font-medium">License:</span>
                  <span className="font-mono font-bold text-orange-800">
                    {form.licenseNumber || 'Not Set'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-orange-200/50">
                  <span className="text-slate-600 font-medium">Operating:</span>
                  <span className="font-bold text-slate-900">{form.operatingDays}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600 font-medium">Facilities:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[150px] truncate">{form.facilities}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/markets"
                  className="w-full btn-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span>View Market Prices</span>
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-border shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-text flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-600" />
                <span>Mandi Permissions</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-muted">
                <li className="flex items-center gap-2 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Daily Arrival & Rate Entry</span>
                </li>
                <li className="flex items-center gap-2 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Trader & Commission Agent Management</span>
                </li>
                <li className="flex items-center gap-2 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Weighbridge & Gate Pass Issuance</span>
                </li>
                <li className="flex items-center gap-2 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>APMC Facility Management</span>
                </li>
              </ul>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* ROLE 4: FARMER PROFILE (Land, Crop & Harvest Details)      */}
      {/* ======================================================== */}
      {userRole === 'farmer' && (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Farmer Personal Information */}
            <div className="card-harvest p-6 space-y-5 bg-white border border-border rounded-3xl shadow-sm">
              <div className="border-b border-border/80 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text">Farmer Information</h2>
                  <p className="text-xs text-muted">Personal identity and verified contact</p>
                </div>
                <span className="text-xs text-muted font-mono">ID #{user?.id || 1}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Full Name *
                  </span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                    placeholder="e.g. Mihir Jadav"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Phone Number
                  </span>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2.5 text-sm font-mono outline-none focus:border-primary"
                      placeholder="9999999991"
                    />
                  </div>
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Account Email (Read-Only)
                </span>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'farmer@harvestmitra.local'}
                  className="w-full rounded-xl border border-border/60 bg-slate-50 px-3.5 py-2.5 text-sm text-muted cursor-not-allowed font-mono"
                />
              </label>
            </div>

            {/* Farm Land & Crop Specifications */}
            <div className="card-harvest p-6 space-y-5 bg-white border border-border rounded-3xl shadow-sm">
              <div className="border-b border-border/80 pb-3">
                <h2 className="text-lg font-bold text-text">Farm Land & Harvest Specifications</h2>
                <p className="text-xs text-muted">
                  Powers your dashboard crop prices, profit calculations, and transport matching
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    District / જિલ્લો / जिल्हा *
                  </span>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={form.district}
                      onChange={(e) => {
                        const dist = e.target.value;
                        const lower = dist.trim().toLowerCase();
                        let detectedState = form.state;
                        if (
                          lower.includes('pune') ||
                          lower.includes('nashik') ||
                          lower.includes('mumbai') ||
                          lower.includes('nagpur') ||
                          lower.includes('solapur') ||
                          lower.includes('kolhapur') ||
                          lower.includes('aurangabad') ||
                          lower.includes('sambhajinagar') ||
                          lower.includes('satara') ||
                          lower.includes('sangli') ||
                          lower.includes('jalgaon') ||
                          lower.includes('amravati') ||
                          lower.includes('nanded') ||
                          lower.includes('latur') ||
                          lower.includes('dhule') ||
                          lower.includes('ahmednagar')
                        ) {
                          detectedState = 'Maharashtra';
                        } else if (
                          lower.includes('surat') ||
                          lower.includes('ahmedabad') ||
                          lower.includes('rajkot') ||
                          lower.includes('vadodara') ||
                          lower.includes('bhavnagar') ||
                          lower.includes('jamnagar') ||
                          lower.includes('junagadh') ||
                          lower.includes('gandhinagar') ||
                          lower.includes('anand') ||
                          lower.includes('navsari') ||
                          lower.includes('morbi') ||
                          lower.includes('mehsana') ||
                          lower.includes('bharuch') ||
                          lower.includes('valsad') ||
                          lower.includes('kheda')
                        ) {
                          detectedState = 'Gujarat';
                        }
                        setForm((prev) => ({ ...prev, district: dist, state: detectedState }));
                      }}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                      placeholder="e.g. Pune, Nashik, Kolhapur"
                    />
                  </div>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    State / राज्य * (Fixed)
                  </span>
                  <select
                    value="Maharashtra"
                    disabled
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-semibold outline-none bg-slate-100 text-slate-700 cursor-not-allowed"
                  >
                    <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
                  </select>
                </label>
              </div>

              {/* Multi-Crop Cultivation Section */}
              <div className="space-y-2 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Crops Cultivated on Your Farm (Select All That Apply) *
                    </span>
                  </div>
                  <span className="text-xs text-emerald-800 font-bold bg-white px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                    {form.selectedCrops?.length || 0} Crops Selected
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Real farms cultivate multiple crops across seasons. Tap to toggle all your current crops:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    'Tomato', 'Onion', 'Potato', 'Cotton', 'Wheat', 
                    'Soybean', 'Rice', 'Maize', 'Mustard', 'Groundnut', 'Cumin', 'Garlic'
                  ].map((crop) => {
                    const isSelected = form.selectedCrops?.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => {
                          setForm((prev) => {
                            const exists = prev.selectedCrops?.includes(crop);
                            const next = exists
                              ? prev.selectedCrops.filter((c) => c !== crop)
                              : [...(prev.selectedCrops || []), crop];
                            return { ...prev, selectedCrops: next.length > 0 ? next : [crop] };
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs border border-emerald-700 scale-102'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{crop}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Farm Land (Acres) *
                  </span>
                  <div className="relative">
                    <Layers className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={form.farmSizeAcres}
                      onChange={(e) => handleChange('farmSizeAcres', e.target.value)}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                      placeholder="4.5"
                    />
                  </div>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Ready Harvest Quantity (kg)
                  </span>
                  <div className="relative">
                    <Scale className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    <input
                      type="number"
                      min="1"
                      step="10"
                      value={form.currentHarvestKg}
                      onChange={(e) => handleChange('currentHarvestKg', e.target.value)}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2.5 text-sm font-mono font-bold outline-none focus:border-primary"
                      placeholder="e.g. 1200"
                    />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Village / Taluka
                  </span>
                  <input
                    type="text"
                    value={form.village}
                    onChange={(e) => handleChange('village', e.target.value)}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="e.g. Haveli, Baramati, Olpad"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Preferred Language
                  </span>
                  <select
                    value={form.preferredLanguage}
                    onChange={(e) => handleChange('preferredLanguage', e.target.value)}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary bg-white"
                  >
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="en">English</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Update Farmer Profile'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Harvest Summary Badge for Farmer */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-primary" />
                <span>Harvest Snapshot</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-emerald-200/50">
                  <span className="text-slate-600 font-medium">Ready Crop:</span>
                  <span className="font-bold text-slate-900">{form.mainCrop}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-emerald-200/50">
                  <span className="text-slate-600 font-medium">Harvest Weight:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {form.currentHarvestKg} kg
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-emerald-200/50">
                  <span className="text-slate-600 font-medium">Land Holding:</span>
                  <span className="font-bold text-slate-900">{form.farmSizeAcres} Acres</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600 font-medium">Agro-Zone Mandi:</span>
                  <span className="font-bold text-slate-900">{form.district} APMC</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/dashboard"
                  className="w-full btn-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span>View Dashboard Analytics</span>
                </Link>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
