import React, { useEffect, useState } from 'react';
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
  Building,
  Sprout,
  Scale,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/common/LanguageSelector';

export default function ProfilePage() {
  const { t, currentLanguageMeta } = useLanguage();
  const { user, updateProfile } = useAuth();

  const profile = user?.FarmerProfile;

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    district: profile?.district || 'Surat',
    state: profile?.state || 'Gujarat',
    village: profile?.village || '',
    farmSizeAcres: profile?.farmSizeAcres ? String(profile.farmSizeAcres) : '4.5',
    mainCrop: profile?.mainCrop || 'Tomato',
    currentHarvestKg: profile?.currentHarvestKg ? String(profile.currentHarvestKg) : '500',
    preferredLanguage: profile?.preferredLanguage || 'gu',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync form when user changes
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        district: user.FarmerProfile?.district || 'Surat',
        state: user.FarmerProfile?.state || 'Gujarat',
        village: user.FarmerProfile?.village || '',
        farmSizeAcres: user.FarmerProfile?.farmSizeAcres
          ? String(user.FarmerProfile.farmSizeAcres)
          : '4.5',
        mainCrop: user.FarmerProfile?.mainCrop || 'Tomato',
        currentHarvestKg: user.FarmerProfile?.currentHarvestKg
          ? String(user.FarmerProfile.currentHarvestKg)
          : '500',
        preferredLanguage: user.FarmerProfile?.preferredLanguage || 'gu',
      });
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
      await updateProfile({
        name: form.name,
        phone: form.phone,
        district: form.district,
        state: form.state,
        village: form.village,
        farmSizeAcres: Number(form.farmSizeAcres),
        mainCrop: form.mainCrop,
        currentHarvestKg: Number(form.currentHarvestKg),
        preferredLanguage: form.preferredLanguage,
      });
      setSuccessMsg('Farmer profile updated successfully in MySQL!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <User className="w-4 h-4" aria-hidden="true" />
            <span>Real Farmer Account & Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
            {t('profile.title')}
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage your personal farmer credentials, farm land size, and APMC market location.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-tag bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>MySQL Synced</span>
          </span>
        </div>
      </div>

      {/* Feedback Alerts */}
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

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Location Details Form (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-harvest p-6 space-y-5 bg-white">
            <div className="border-b border-border/80 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text">Farmer Information</h2>
                <p className="text-xs text-muted">Personal identity and verified contact</p>
              </div>
              <span className="text-xs text-muted">ID #{user?.id || 1}</span>
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
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="e.g. Mihir Jadav"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Phone Number
                </span>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full rounded-lg border border-border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary"
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
                className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2.5 text-sm text-muted cursor-not-allowed"
              />
            </label>
          </div>

          {/* Farm Details Card */}
          <div className="card-harvest p-6 space-y-5 bg-white">
            <div className="border-b border-border/80 pb-3">
              <h2 className="text-lg font-bold text-text">Farm Land & Location</h2>
              <p className="text-xs text-muted">
                Used to match nearest APMC mandis and calculate transport distances
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  District *
                </span>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={form.district}
                    onChange={(e) => handleChange('district', e.target.value)}
                    className="w-full rounded-lg border border-border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="e.g. Surat, Rajkot, Mehsana"
                  />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  State
                </span>
                <div className="relative">
                  <Building className="w-4 h-4 text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full rounded-lg border border-border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="Gujarat"
                  />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Village / Taluka
                </span>
                <input
                  type="text"
                  value={form.village}
                  onChange={(e) => handleChange('village', e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="e.g. Olpad"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Total Farm Size (Acres)
                </span>
                <div className="relative">
                  <Layers className="w-4 h-4 text-muted absolute left-3 top-3" />
                  <input
                    type="number"
                    step="0.1"
                    value={form.farmSizeAcres}
                    onChange={(e) => handleChange('farmSizeAcres', e.target.value)}
                    className="w-full rounded-lg border border-border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="4.5"
                  />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Primary Crop Grown
                </span>
                <div className="relative">
                  <Sprout className="w-4 h-4 text-muted absolute left-3 top-3" />
                  <select
                    value={form.mainCrop}
                    onChange={(e) => handleChange('mainCrop', e.target.value)}
                    className="w-full rounded-lg border border-border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary bg-white"
                  >
                    <option value="Tomato">Tomato (Hybrid / Desi)</option>
                    <option value="Onion">Onion (Nashik Red)</option>
                    <option value="Potato">Potato (Jyoti / Pukhraj)</option>
                    <option value="Cotton">Cotton (Bt Cotton)</option>
                    <option value="Wheat">Wheat (Sharbati / Lokwan)</option>
                    <option value="Soybean">Soybean (Yellow)</option>
                    <option value="Rice">Rice (Basmati / Paddy)</option>
                    <option value="Maize">Maize (Corn)</option>
                    <option value="Mustard">Mustard (Sarson)</option>
                    <option value="Groundnut">Groundnut (Peanut)</option>
                    <option value="Cumin">Cumin (Jeera)</option>
                    <option value="Garlic">Garlic (Lasan)</option>
                    <option value="Chilli">Green / Red Chilli</option>
                    <option value="Banana">Banana (G9)</option>
                    <option value="Other Produce">Other Farm Produce</option>
                  </select>
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Current Ready Harvest (kg)
                </span>
                <div className="relative">
                  <Scale className="w-4 h-4 text-muted absolute left-3 top-3" />
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={form.currentHarvestKg}
                    onChange={(e) => handleChange('currentHarvestKg', e.target.value)}
                    className="w-full rounded-lg border border-border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="500"
                  />
                </div>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2 px-6 py-2.5"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences & Active Session Info */}
        <div className="space-y-6">
          {/* Active Language Setting */}
          <div className="card-harvest p-6 space-y-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-text">
                  {t('nav.language')} Preferences
                </h3>
                <p className="text-xs text-muted">
                  Active: {currentLanguageMeta.nativeName} ({currentLanguageMeta.label})
                </p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                {t('common.selectLanguage')}
              </p>
              <LanguageSelector variant="segmented" className="w-full justify-between" />
            </div>
          </div>

          {/* Account Role Card */}
          <div className="card-harvest p-6 space-y-3 bg-white">
            <h3 className="font-bold text-sm text-text">Account Privileges</h3>
            <div className="p-3 rounded-lg bg-secondary/60 border border-border/80 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Account Type:</span>
                <span className="font-bold text-text uppercase">{user?.role || 'FARMER'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Market Access:</span>
                <span className="font-bold text-emerald-700">Full Real-Time APMC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Transport Pool:</span>
                <span className="font-bold text-primary">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
