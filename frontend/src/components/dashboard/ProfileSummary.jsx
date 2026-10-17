import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Globe, Sprout, Scale, Layers, Edit3, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function ProfileSummary() {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();

  // Strict role separation: Farmer profile summary should ONLY show to farmers
  if (user?.role && user?.role !== 'farmer') {
    return null;
  }

  const profile = user?.FarmerProfile;
  const farmerName = isAuthenticated && user?.name ? user.name : 'Registered Farmer';

  const location = profile?.district
    ? `${profile.district}${profile.state ? `, ${profile.state}` : ''}`
    : 'Not set';

  const farmSize = profile?.farmSizeAcres
    ? `${profile.farmSizeAcres} Acres`
    : 'Not set';

  const mainCrop = profile?.mainCrop || 'Not set';
  const cropsList = mainCrop !== 'Not set'
    ? mainCrop.split(',').map(c => c.trim()).filter(Boolean)
    : [];

  let quantitiesMap = {};
  if (typeof profile?.productQuantities === 'string') {
    try {
      quantitiesMap = JSON.parse(profile.productQuantities);
    } catch (e) {}
  } else if (typeof profile?.productQuantities === 'object' && profile?.productQuantities !== null) {
    quantitiesMap = profile.productQuantities;
  }

  const cropBreakdown = cropsList.map(crop => {
    const entry = quantitiesMap[crop];
    if (entry && entry.qty) {
      const val = Number(entry.qty) || 0;
      const kg = entry.unit === 'tonne' ? val * 1000 : val;
      return { crop, qty: kg, unit: 'kg' };
    }
    const fallbackTotal = Number(profile?.currentHarvestKg) || 500;
    return { crop, qty: Math.round(fallbackTotal / (cropsList.length || 1)), unit: 'kg' };
  });

  const totalHarvestKg = cropBreakdown.reduce((sum, c) => sum + c.qty, 0);
  const currentHarvest = cropBreakdown.length > 0
    ? cropBreakdown.map(c => `${c.crop}: ${c.qty} kg`).join(' • ')
    : profile?.currentHarvestKg ? `${profile.currentHarvestKg} kg` : 'Not set';

  const languageLabel = profile?.preferredLanguage === 'gu'
    ? 'Gujarati (ગુજરાતી)'
    : profile?.preferredLanguage === 'hi'
    ? 'Hindi (हिन्दी)'
    : profile?.preferredLanguage === 'mr'
    ? 'Marathi (मराठी)'
    : 'English';

  const profileItems = [
    {
      label: 'Location',
      value: location,
      icon: MapPin,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      label: profile?.mainCrop?.includes(',') ? 'Crops' : 'Main Crop',
      value: mainCrop,
      icon: Sprout,
      color: 'text-primary bg-primary-50 border-primary/20',
    },
    {
      label: cropBreakdown.length > 1 ? 'Harvest per Crop' : 'Harvest Ready',
      value: currentHarvest,
      subValue: cropBreakdown.length > 1 ? `Total: ${totalHarvestKg} kg` : null,
      breakdown: cropBreakdown,
      icon: Scale,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      label: 'Farm Size',
      value: farmSize,
      icon: Layers,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      label: 'Language',
      value: languageLabel,
      icon: Globe,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
  ];

  return (
    <div 
      className="rounded-3xl p-6 bg-gradient-to-br from-white via-emerald-50/20 to-slate-50 border border-emerald-900/10 shadow-md space-y-5 relative overflow-hidden"
      style={{
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* Decorative subtle ambient ring */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950/10 pb-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-primary text-white flex items-center justify-center font-bold text-xl shadow-md">
            🌾
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {t('dashboard.profile.cardTitle', 'Farmer Profile Summary')}
            </h2>
            <p className="text-xs text-slate-600 font-medium truncate">
              {farmerName} • {location}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-tag text-xs bg-emerald-100/70 text-emerald-900 border border-emerald-300/80 font-bold flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Verified Farmer Profile</span>
          </span>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark transition-all px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-primary/25 shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      {/* Grid of Profile Information */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3.5">
        {profileItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="min-w-0 p-3.5 rounded-2xl bg-white/90 border border-slate-200/90 flex flex-col justify-between space-y-2.5 hover:border-emerald-400/60 hover:shadow-md transition-all shadow-2xs backdrop-blur-sm"
              style={{ transform: 'perspective(1000px)' }}
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="min-w-0 truncate text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {item.label}
                </span>
                <div className={`p-1.5 rounded-xl border ${item.color} shadow-2xs`}>
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
              </div>
              {item.breakdown && item.breakdown.length > 1 ? (
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {item.breakdown.map((b, i) => (
                      <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold">
                        {b.crop}:&nbsp;<span className="font-extrabold text-amber-950">{b.qty} kg</span>
                      </span>
                    ))}
                  </div>
                  {item.subValue && (
                    <span className="text-[10px] text-slate-500 font-medium block">
                      {item.subValue}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs sm:text-sm font-black text-slate-900 break-words" title={item.value}>
                  {item.value}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
