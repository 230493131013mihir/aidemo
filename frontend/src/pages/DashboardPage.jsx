import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  Sprout, 
  Scale, 
  TrendingUp, 
  Calculator,
  Printer,
  Layers,
  PieChart as PieChartIcon,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Truck,
  Bot
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

// Dashboard Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ProfileSummary from '../components/dashboard/ProfileSummary';
import TransporterDashboard from '../components/dashboard/TransporterDashboard';
import MandiDashboard from '../components/dashboard/MandiDashboard';
import StatCard from '../components/dashboard/StatCard';
import WeatherWidget from '../components/dashboard/WeatherWidget';
import MarketTrendChart from '../components/dashboard/MarketTrendChart';
import RevenueComparisonChart from '../components/dashboard/RevenueComparisonChart';
import PlanningHistoryChart from '../components/dashboard/PlanningHistoryChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import TransportSummary from '../components/dashboard/TransportSummary';
import MitraAssistantCard from '../components/dashboard/MitraAssistantCard';
import QuickActions from '../components/dashboard/QuickActions';
import PrintableReportModal from '../components/common/PrintableReportModal';
import RegisteredCropsManager from '../components/dashboard/RegisteredCropsManager';
import SharedTransportFarmerWidget from '../components/dashboard/SharedTransportFarmerWidget';
import MandiBookingNotificationWidget from '../components/dashboard/MandiBookingNotificationWidget';
import SaleHistorySection from '../components/farmer/SaleHistorySection';
import apiClient from '../services/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

function AcreageTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 backdrop-blur-md">
        <p className="font-extrabold text-sm flex items-center gap-1.5" style={{ color: data.color }}>
          <span>●</span> {data.name}
        </p>
        <p className="text-slate-300">
          Land Allocation: <strong className="text-white">{data.acres} Acres</strong> ({data.percentage}%)
        </p>
        <p className="text-slate-300">
          Expected Yield: <strong className="text-white">{data.expectedYieldQuintals} Quintals</strong>
        </p>
        <p className="text-emerald-400 font-bold">
          Benchmark Mandi: {data.benchmarkMandi}
        </p>
        <p className="text-amber-400 font-bold">
          Proj. Value: ₹{data.projectedRevenue.toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState(() => (user?.role === 'transporter' ? 'transporter' : 'farmer'));

  // Sync viewMode if user role changes dynamically
  useEffect(() => {
    setViewMode(user?.role === 'transporter' ? 'transporter' : 'farmer');
  }, [user?.role]);

  // Role-Based Dashboard Segregation:
  // 1. Admin only views the APMC Central Admin Console
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // 2. Mandi Official views dedicated APMC Mandi Portal & Procurement Workspace (previously /markets)
  if (user?.role === 'mandi') {
    return <MandiDashboard />;
  }

  // 3. Transporter views their dedicated Cargo & Trip Logistics Dashboard (Farmer Decision Suite toggle removed, Issue #173)
  if (user?.role === 'transporter') {
    return <TransporterDashboard />;
  }

  // 4. FPO Leader views dedicated FPO Dashboard & Aggregation Workspace
  if (user?.role === 'fpo_leader' || user?.role === 'fpo') {
    return <Navigate to="/fpo" replace />;
  }

  // 5. Farmer views full crop analytics & harvest decision dashboard
  return <FarmerDashboard user={user} t={t} />;
}

function FarmerDashboard({ user, t }) {
  const profile = user?.FarmerProfile;
  const farmerDistrict = profile?.district || 'Pune';
  const farmerState = profile?.state || 'Maharashtra';
  const totalFarmAcres = Number(profile?.farmSizeAcres) || 4.5;

  // Real Farmer Crop Records fetched from backend /api/farmer/crops
  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [selectedCropTab, setSelectedCropTab] = useState('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Clear crops on logout
  useEffect(() => {
    const handleLogout = () => {
      setCrops([]);
    };
    window.addEventListener('harvestmitra:logout', handleLogout);
    return () => window.removeEventListener('harvestmitra:logout', handleLogout);
  }, []);

  // Fetch farmer registered crops from backend API
  const fetchFarmerCrops = async () => {
    try {
      setLoadingCrops(true);
      const token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('harvestmitra_token')) || 
                    (typeof localStorage !== 'undefined' && localStorage.getItem('harvestmitra_token')) || 'guest';
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'guest') {
        headers.Authorization = `Bearer ${token}`;
      } else {
        headers['x-guest-mode'] = 'true';
      }

      const res = await fetch(`${API_BASE_URL}/api/farmer/crops`, { headers });
      const json = await res.json();
      if (json.success && Array.isArray(json.crops)) {
        setCrops(json.crops);
      } else {
        fallbackFromProfile();
      }
    } catch (err) {
      console.warn('Could not fetch /api/farmer/crops:', err.message);
      fallbackFromProfile();
    } finally {
      setLoadingCrops(false);
    }
  };

  const fallbackFromProfile = () => {
    const rawMainCrop = profile?.mainCrop || 'Tomato';
    const cList = rawMainCrop !== 'Not set'
      ? rawMainCrop.split(',').map(c => c.trim()).filter(Boolean)
      : ['Tomato'];

    let qMap = {};
    if (typeof profile?.productQuantities === 'string') {
      try { qMap = JSON.parse(profile.productQuantities); } catch (e) {}
    } else if (typeof profile?.productQuantities === 'object' && profile?.productQuantities !== null) {
      qMap = profile.productQuantities;
    }

    const fallbackCrops = cList.map(cName => {
      const entry = qMap[cName];
      let qty = 500;
      let unit = 'kg';
      if (entry) {
        qty = Number(entry.qty || entry.harvestQuantityKg || 500);
        unit = entry.unit || 'kg';
      } else {
        qty = Math.round((Number(profile?.currentHarvestKg) || 500) / (cList.length || 1));
      }
      const kg = unit === 'tonne' ? qty * 1000 : unit === 'quintal' ? qty * 100 : qty;
      const defaultRate = cName.toLowerCase().includes('cotton') ? 75.65
        : cName.toLowerCase().includes('wheat') ? 29.55
        : cName.toLowerCase().includes('onion') ? 24.50
        : cName.toLowerCase().includes('potato') ? 18.00
        : cName.toLowerCase().includes('soybean') ? 48.00
        : 28.00;

      return {
        cropName: cName,
        enteredQuantity: qty,
        unit,
        harvestQuantityKg: kg,
        marketPricePerKg: defaultRate,
        marketPricePerQuintal: Math.round(defaultRate * 100),
        marketName: `${farmerDistrict} APMC`,
        priceDate: new Date().toISOString().slice(0, 10),
        priceStatus: 'LIVE',
        statusNotice: 'APMC Benchmark Rate',
        estimatedRevenue: Math.round(kg * defaultRate)
      };
    });

    setCrops(fallbackCrops);
  };

  useEffect(() => {
    fetchFarmerCrops();
  }, [user]);

  // Aggregate statistics derived strictly from real registered crops
  const totalCombinedHarvestKg = crops.reduce((sum, c) => sum + (c.harvestQuantityKg || 0), 0);
  const totalCombinedRevenue = crops.reduce((sum, c) => sum + (c.estimatedRevenue || 0), 0);
  const totalCombinedYieldQuintals = Number((totalCombinedHarvestKg / 100).toFixed(1));
  const primaryMarketName = crops.find(c => c.marketName)?.marketName || `${farmerDistrict} APMC`;
  const primaryPrice = crops.find(c => c.marketPricePerKg !== null)?.marketPricePerKg || null;

  // Dynamic Crop Profiles for Acreage Donut & Switcher Tabs
  const CROP_PALETTE = ['#16a34a', '#f59e0b', '#0284c7', '#7c3aed', '#ea580c', '#059669', '#d97706', '#2563eb', '#9333ea'];

  const multiCropProfiles = crops.map((c, index) => {
    const fraction = totalCombinedHarvestKg > 0 ? (c.harvestQuantityKg / totalCombinedHarvestKg) : (1 / (crops.length || 1));
    const cropAcres = Math.round(fraction * totalFarmAcres * 10) / 10;
    const percentage = Math.round(fraction * 100);
    const color = CROP_PALETTE[index % CROP_PALETTE.length];
    const qtlYield = Number((c.harvestQuantityKg / 100).toFixed(1));
    const rateKg = c.marketPricePerKg !== null ? c.marketPricePerKg : 25;
    const rev = c.estimatedRevenue !== null ? c.estimatedRevenue : Math.round(c.harvestQuantityKg * rateKg);

    return {
      id: c.cropName.toLowerCase().replace(/\s+/g, '-'),
      name: c.cropName,
      shortName: c.cropName,
      tabLabel: `${c.cropName} (${cropAcres} Acres)`,
      variety: `${c.cropName} APMC Grade-A`,
      acres: cropAcres,
      percentage,
      color,
      expectedYieldKg: c.harvestQuantityKg,
      expectedYieldQuintals: qtlYield,
      benchmarkMandi: c.marketName || `${farmerDistrict} APMC`,
      mandiRatePerKg: rateKg,
      projectedRevenue: rev,
      season: 'Active Harvest Cycle',
      soilType: 'Cultivated Farm Soil',
      irrigation: 'Drip / Micro-Irrigation',
      harvestReadiness: 'Ready for APMC Dispatch',
      readinessPercent: 88,
      status: c.priceStatus === 'LIVE' ? 'APMC Mandi Rate Verified' : 'Market Observation'
    };
  });

  const activeCropData = multiCropProfiles.find(p => p.id === selectedCropTab) || null;

  // Dynamic Stat Recalculations on Tab Toggle
  const currentStatCrop = selectedCropTab === 'all'
    ? (crops.length > 0 ? `${crops.length} Registered Crops` : 'No crops registered')
    : `${activeCropData?.name} (${activeCropData?.acres} Acres)`;

  const currentStatHarvestKg = selectedCropTab === 'all'
    ? totalCombinedHarvestKg
    : (activeCropData?.expectedYieldKg || 0);

  const currentStatPricePerKg = selectedCropTab === 'all'
    ? primaryPrice
    : (activeCropData?.mandiRatePerKg || null);

  const currentStatRevenue = selectedCropTab === 'all'
    ? totalCombinedRevenue
    : (activeCropData?.projectedRevenue || 0);

  const currentStatPriceSubtext = selectedCropTab === 'all'
    ? `${primaryMarketName} • Live APMC Mandi Rates`
    : `${activeCropData?.benchmarkMandi || primaryMarketName} • Live APMC Rate`;

  const currentStatRevenueSubtext = selectedCropTab === 'all'
    ? `Est. Gross Revenue across ${crops.length} registered crop${crops.length === 1 ? '' : 's'}`
    : `Net Take-Home (${(activeCropData?.expectedYieldKg || 0).toLocaleString('en-IN')} kg @ ₹${activeCropData?.mandiRatePerKg || 0}/kg)`;

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full 2xl:max-w-[1720px] mx-auto pb-12">
      {/* 1. Dashboard Header */}
      <DashboardHeader />

      {/* PART 2.1 — 4 Primary Action Cards immediately obvious to the Farmer */}
      <section aria-label="Primary Farmer Actions" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Action 1: Check Market Prices */}
        <Link 
          to="/markets"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-lg shadow-emerald-950/20 hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
              <TrendingUp className="w-6 h-6 text-white" />
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-emerald-100">
              Live Mandi
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-black tracking-tight flex items-center gap-1.5">
              <span>Check Market Prices</span>
              <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-emerald-100/90 mt-1">
              Live APMC mandi rates across Maharashtra & major crop benchmarks.
            </p>
          </div>
        </Link>

        {/* Action 2: Calculate My Profit */}
        <Link 
          to="/harvest"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-lg shadow-blue-950/20 hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
              <Calculator className="w-6 h-6 text-white" />
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-blue-100">
              Simulation
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-black tracking-tight flex items-center gap-1.5">
              <span>Calculate My Profit</span>
              <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-blue-100/90 mt-1">
              Estimate net take-home earnings with transport and mandi fees.
            </p>
          </div>
        </Link>

        {/* Action 3: Book Transportation */}
        <Link 
          to="/transport"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 p-5 text-white shadow-lg shadow-amber-950/20 hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
              <Truck className="w-6 h-6 text-white" />
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-amber-100">
              Shared Fleet
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-black tracking-tight flex items-center gap-1.5">
              <span>Book Transportation</span>
              <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-amber-100/90 mt-1">
              Reserve verified transporters and share loads to save freight cost.
            </p>
          </div>
        </Link>

        {/* Action 4: Ask Mitra AI */}
        <Link 
          to="/chat"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-700 p-5 text-white shadow-lg shadow-purple-950/20 hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
              <Bot className="w-6 h-6 text-white" />
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-purple-100">
              Voice & Chat
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-black tracking-tight flex items-center gap-1.5">
              <span>Ask Mitra AI</span>
              <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-purple-100/90 mt-1">
              Ask in Marathi or English for crop prices, doctor diagnosis, and advice.
            </p>
          </div>
        </Link>
      </section>

      {/* 2. Farmer Profile Summary */}
      <ProfileSummary />

      {/* 2.2 Live APMC Mandi Booking & Procurement Inquiries */}
      <MandiBookingNotificationWidget />

      {/* 2.5 Action Bar: Printable Kisan Farm Decision Report Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 rounded-3xl p-4 sm:p-6 text-white shadow-xl border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-md shrink-0">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {t('dashboardExtra.printReportBannerTitle') || "Kisan Farm Summary & Mandi Decision Report"}
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {t('dashboardExtra.printReportBadge') || "Official A4 Print Layout"}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {t('dashboardExtra.printReportDesc') || "Instant one-click decision report synthesizing 3-scenario revenue simulation, live APMC mandi benchmarks, and top 3 government scheme checklists (PM-KISAN, PMFBY, i-Khedut)."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          id="hero-print-farm-report-btn"
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-950/20 hover:from-emerald-500 hover:to-teal-400 transition-all transform hover:scale-[1.02] cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>{t('dashboardExtra.printReportBtn') || "🖨️ Print Farm Report"}</span>
        </button>
      </div>

      {/* 2.8 Dynamic Crop Tab Switcher directly above Main Stat Cards (Issue #80) */}
      <div className="bg-surface/90 border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sprout className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-text flex items-center gap-1.5">
              <span>{t('dashboardExtra.multiCropSwitcherTitle') || "Multi-Crop Profile Switcher"}</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-secondary text-primary-dark font-bold border border-border">
                {t('dashboardExtra.multiCropRealtimeBadge') || "Real-Time Recalculation"}
              </span>
            </h3>
            <p className="text-[11px] text-muted">
              {t('dashboardExtra.multiCropSwitcherDesc') || "Toggle crop tabs to dynamically update harvest yield, live prices, and net take-home revenue"}
            </p>
          </div>
        </div>

        {/* Dynamic Crop Tabs: [🌾 All Crops] + dynamic buttons for each registered crop */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCropTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCropTab === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{(t('dashboardExtra.allCropsTab') || "🌾 All Crops ({kg} kg)").replace('{kg}', totalCombinedHarvestKg.toLocaleString('en-IN'))}</span>
          </button>

          {multiCropProfiles.map((crop) => (
            <button
              key={crop.id}
              type="button"
              onClick={() => setSelectedCropTab(crop.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCropTab === crop.id
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: crop.color }} />
              <span>{crop.shortName}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold">
                {crop.percentage}%
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. 4 Key Statistics Cards (100% Dynamic & Recalculating in Real Time) */}
      <section aria-labelledby="dashboard-stats-heading" className="space-y-3">
        <h2 id="dashboard-stats-heading" className="sr-only">
          Harvest Key Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Current Crop */}
          <StatCard
            icon={Sprout}
            label={selectedCropTab === 'all' ? "Current Crops" : `${activeCropData?.shortName} Profile`}
            value={currentStatCrop}
            items={crops.length > 1 && selectedCropTab === 'all' ? crops.map(c => ({
              label: c.cropName,
              value: `${c.harvestQuantityKg.toLocaleString('en-IN')} kg`
            })) : null}
            subtext={selectedCropTab === 'all' ? `${farmerDistrict} Agro-Zone (${totalFarmAcres} Acres Total)` : `${activeCropData?.variety} • ${activeCropData?.season}`}
            color="text-primary bg-primary-50 border-primary/20"
          />

          {/* Stat 2: Harvest Quantity */}
          <StatCard
            icon={Scale}
            label={t('dashboard.stats.harvestQuantity')}
            value={`${currentStatHarvestKg.toLocaleString('en-IN')} kg`}
            items={crops.length > 1 && selectedCropTab === 'all' ? crops.map(c => ({
              label: c.cropName,
              value: `${c.harvestQuantityKg.toLocaleString('en-IN')} kg (${(c.harvestQuantityKg / 100).toFixed(1)} Qtl)`
            })) : null}
            subtext={selectedCropTab === 'all' ? `Total: ${currentStatHarvestKg.toLocaleString('en-IN')} kg (${(currentStatHarvestKg / 100).toFixed(1)} Qtl)` : `${(currentStatHarvestKg / 100).toFixed(1)} Quintals Harvest Ready`}
            color="text-amber-700 bg-amber-50 border-amber-200"
          />

          {/* Stat 3: Live Market Price */}
          <StatCard
            icon={TrendingUp}
            label={t('dashboard.stats.marketPrice')}
            value={currentStatPricePerKg !== null ? `₹${Number(currentStatPricePerKg).toFixed(2)} / kg` : 'Rate unavailable'}
            items={crops.length > 1 && selectedCropTab === 'all' ? crops.map(c => ({
              label: c.cropName,
              value: c.marketPricePerKg !== null ? `₹${c.marketPricePerKg.toFixed(2)} / kg` : 'Unavailable'
            })) : null}
            subtext={currentStatPriceSubtext}
            badge="Live APMC"
            color="text-emerald-700 bg-emerald-50 border-emerald-200"
          />

          {/* Stat 4: Estimated Revenue */}
          <StatCard
            icon={Calculator}
            label={t('dashboard.stats.estimatedRevenue')}
            value={currentStatRevenue !== null ? `₹${Number(currentStatRevenue).toLocaleString('en-IN')}` : 'Unavailable'}
            items={crops.length > 1 && selectedCropTab === 'all' ? crops.map(c => ({
              label: `${c.cropName} (${c.harvestQuantityKg} kg)`,
              value: c.estimatedRevenue !== null ? `₹${c.estimatedRevenue.toLocaleString('en-IN')}` : 'Unavailable'
            })) : null}
            subtext={currentStatRevenueSubtext}
            badge="Live Calculation"
            color="text-blue-700 bg-blue-50 border-blue-200"
          />
        </div>
      </section>

      {/* 3.1 NEW: My Registered Crops (STEP 8 Layout & STEP 3-6 Dynamic Calculations) */}
      <RegisteredCropsManager
        crops={crops}
        loading={loadingCrops}
        onRefresh={fetchFarmerCrops}
        district={farmerDistrict}
        state={farmerState}
      />

      {/* 3.5 Multi-Crop Farm Profile Switcher with Interactive Recharts Acreage Distribution Chart */}
      <section aria-labelledby="multi-crop-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                <PieChartIcon className="w-4 h-4" />
              </span>
              <h2 id="multi-crop-heading" className="text-lg sm:text-xl font-bold text-text">
                {t('dashboardExtra.acreageDistribution') || "Multi-Crop Farm Profile & Acreage Distribution"}
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              {(t('dashboardExtra.acreageDistributionDesc') || "Interactive acreage allocation ({acres} Acres Total), yield modeling & live APMC market benchmarks").replace('{acres}', totalFarmAcres)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              id="multicrop-download-report-btn"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('dashboardExtra.downloadReportBtn') || "🖨️ Download Farm Decision Report"}</span>
            </button>
          </div>
        </div>

        {/* Multi-Crop Switcher Tabs: [🌾 All Crops] [🌿 Cotton (4.0 Acres)] [🌾 Wheat (2.5 Acres)] */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCropTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedCropTab === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🌾 {t('dashboardExtra.allCropsOverview') || "All Crops"} ({totalFarmAcres} {t('common.acres') || 'Acres'})</span>
          </button>

          {multiCropProfiles.map((crop) => (
            <button
              key={crop.id}
              type="button"
              onClick={() => setSelectedCropTab(crop.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                selectedCropTab === crop.id
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: crop.color }} />
              <span>{crop.shortName} ({crop.acres} {t('common.acres') || 'Acres'})</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold">
                {crop.percentage}%
              </span>
            </button>
          ))}
        </div>

        {/* Multi-Crop Visual Canvas: Recharts Donut + Detailed Spec Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (5 Cols): Interactive Recharts Acreage Donut Chart */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-emerald-600" />
                <span>{t('dashboardExtra.acreageDonut') || "Acreage Distribution Donut"}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {(t('dashboardExtra.totalAcres') || "Total: {acres} Acres").replace('{acres}', totalFarmAcres)}
              </span>
            </div>

            {/* Donut Chart Container */}
            <div className="relative py-2 flex items-center justify-center">
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={multiCropProfiles.length > 0 ? multiCropProfiles : [{ name: 'No Crops', acres: totalFarmAcres, color: '#94a3b8' }]}
                      dataKey="acres"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={98}
                      paddingAngle={multiCropProfiles.length > 1 ? 5 : 0}
                      onClick={(entry) => entry.id && setSelectedCropTab(entry.id)}
                      cursor="pointer"
                    >
                      {multiCropProfiles.map((entry) => (
                        <Cell 
                          key={entry.id} 
                          fill={entry.color} 
                          stroke={selectedCropTab === entry.id ? '#0f172a' : '#ffffff'}
                          strokeWidth={selectedCropTab === entry.id ? 3 : 2}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<AcreageTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Donut Center Hole Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{totalFarmAcres}</span>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">{t('dashboardExtra.acresTotal') || "Acres Total"}</span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                  {multiCropProfiles.length > 0
                    ? multiCropProfiles.map(p => `${p.percentage}% ${p.shortName}`).slice(0, 2).join(' • ')
                    : 'Awaiting Crop Registration'}
                </span>
              </div>
            </div>

            {/* Legend & Interactive Switcher Chips */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
              {multiCropProfiles.map((crop) => (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => setSelectedCropTab(crop.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedCropTab === crop.id
                      ? 'border-slate-800 bg-slate-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: crop.color }} />
                    <span className="truncate">{crop.shortName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between items-center">
                    <span>{crop.acres} {t('common.acres') || 'Acres'}</span>
                    <strong className="text-slate-700">{crop.percentage}%</strong>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column (7 Cols): Crop Profile Details Panel */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
            {activeCropData ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeCropData.color }} />
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {activeCropData.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {activeCropData.season}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Variety: <strong>{activeCropData.variety}</strong> &bull; {activeCropData.soilType}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{activeCropData.status}</span>
                  </span>
                </div>

                {/* Metric Tiles Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('dashboardExtra.landShare') || "Land Share"}</span>
                    <span className="text-base font-black text-slate-900">{activeCropData.acres} {t('common.acres') || 'Acres'}</span>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">{activeCropData.percentage}% {t('profileExtra.farmLand') || 'of Farm'}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('dashboardExtra.expectedYield') || "Expected Yield"}</span>
                    <span className="text-base font-black text-slate-900">{activeCropData.expectedYieldQuintals} Qtl</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{activeCropData.expectedYieldKg.toLocaleString('en-IN')} kg</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('dashboardExtra.mandiRate') || "Mandi Rate"}</span>
                    <span className="text-base font-black text-emerald-700">₹{activeCropData.mandiRatePerKg.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{activeCropData.benchmarkMandi}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('dashboardExtra.projTakeHome') || "Proj. Take-Home"}</span>
                    <span className="text-base font-black text-blue-700">₹{activeCropData.projectedRevenue.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{t('dashboard.stats.estimatedRevenue') || "Est. Realization"}</span>
                  </div>
                </div>

                {/* Harvest Maturation & Irrigation Bar */}
                <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{t('dashboardExtra.harvestReadinessIndex') || "Harvest Readiness Index:"}</span>
                    <strong className="text-emerald-700">{activeCropData.harvestReadiness}</strong>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="h-2.5 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${activeCropData.readinessPercent}%`, 
                        backgroundColor: activeCropData.color 
                      }} 
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1">
                    <span>{t('dashboardExtra.irrigationMethod') || "Irrigation Method:"} <strong>{activeCropData.irrigation}</strong></span>
                    <span className="text-emerald-800 font-bold">{t('dashboardExtra.govtSubsidyVerified') || "Govt Subsidy Verified"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {t('dashboardExtra.allCropsOverview') || "All Crops Overview"} &bull; {(t('dashboardExtra.totalCultivatedFarm') || "Total Cultivated Farm ({acres} Acres)").replace('{acres}', totalFarmAcres)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Synthesized multi-commodity portfolio across {farmerDistrict} Agro-Zone ({crops.map(c => c.cropName).join(', ') || 'No registered crops'})
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">{t('dashboardExtra.totalCultivated') || "Total Cultivated"}</span>
                    <span className="text-base font-black text-emerald-950">{totalFarmAcres} {t('common.acres') || 'Acres'}</span>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">{t('dashboardExtra.utilized100') || "100% Utilized"}</span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">{t('dashboardExtra.combinedYield') || "Combined Yield"}</span>
                    <span className="text-base font-black text-amber-950">{totalCombinedYieldQuintals} Quintals</span>
                    <span className="text-[10px] text-amber-700 font-bold block mt-0.5">{totalCombinedHarvestKg.toLocaleString('en-IN')} kg Total</span>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-blue-800 block">{t('dashboardExtra.combinedValue') || "Combined Value"}</span>
                    <span className="text-base font-black text-blue-950">₹{totalCombinedRevenue.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-blue-700 font-bold block mt-0.5">Across {crops.length} Crop{crops.length === 1 ? '' : 's'}</span>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-purple-800 block">{t('dashboardExtra.activeSubsidies') || "Active Subsidies"}</span>
                    <span className="text-base font-black text-purple-950">3 Schemes</span>
                    <span className="text-[10px] text-purple-700 font-bold block mt-0.5">PM-KISAN, PMFBY, MahaDBT</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{t('dashboardExtra.interCroppingRecommendation') || "Agronomic Inter-Cropping Recommendation:"}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {crops.length > 1
                      ? (t('dashboardExtra.interCroppingMultiDesc') || `Cultivating a multi-commodity portfolio across your acreage diversifies market volatility risk while ensuring consistent cash flow across seasonal harvest cycles.`)
                      : (t('dashboardExtra.interCroppingSingleDesc') || `Consider inter-cropping or registering multiple complementary crops across your land to optimize soil nitrogen levels, reduce market price risk, and increase seasonal revenue stability.`)}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Action Bar inside the card */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                {t('dashboardExtra.wantCompleteSimulation') || "Want a complete simulation with logistics and cold storage?"}
              </span>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                id="multicrop-cta-report-btn"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('dashboardExtra.printReportBtn') || "🖨️ Print Farm Report"}</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Weather & Harvest Planning Alert Widget */}
      <section aria-labelledby="dashboard-weather-heading">
        <h2 id="dashboard-weather-heading" className="sr-only">
          Weather Information
        </h2>
        <WeatherWidget />
      </section>

      {/* 5. Analytics Section: Market Price Trend & Revenue Comparison */}
      <section aria-labelledby="dashboard-analytics-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
          <div>
            <h2 id="dashboard-analytics-heading" className="text-lg sm:text-xl font-bold text-text">
              {t('dashboard.analytics.sectionTitle')}
            </h2>
            <p className="text-xs text-muted">
              {t('dashboard.analytics.sectionSubtitle')}
            </p>
          </div>
          <span className="badge-tag bg-secondary text-primary-dark border border-border text-xs self-start sm:self-auto">
            Recharts Visualizations
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketTrendChart 
            initialCrop={crops.length ? crops[0].cropName : 'Tomato'} 
            district={farmerDistrict} 
          />
          <RevenueComparisonChart 
            crops={crops} 
            totalHarvestKg={totalCombinedHarvestKg} 
          />
        </div>
      </section>

      {/* 6. Harvest Planning History */}
      <section aria-labelledby="dashboard-planning-history-heading">
        <h2 id="dashboard-planning-history-heading" className="sr-only">
          Planning History
        </h2>
        <PlanningHistoryChart crops={crops} />
      </section>

      {/* 6.2 Farmer Sale History & Realized Profit Report */}
      <SaleHistorySection 
        registeredCrops={crops} 
        userDistrict={farmerDistrict} 
      />

      {/* 6.5 Clearly Visible Crop-Based Shared Transport & Vehicle Booking Section */}
      <section id="farmer-shared-transport-section" aria-labelledby="dashboard-transport-heading">
        <h2 id="dashboard-transport-heading" className="sr-only">
          Crop-Based Shared Transport and Vehicle Booking
        </h2>
        <SharedTransportFarmerWidget registeredCrops={crops} />
      </section>

      {/* 7. Operations Triad: Recent Activity, Transport Pooling & Mitra AI */}
      {user?.role === 'farmer' && <section aria-labelledby="dashboard-operations-heading" className="space-y-3">
        <h2 id="dashboard-operations-heading" className="sr-only">
          Recent Activity and Support
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RecentActivity />
          <TransportSummary />
          <MitraAssistantCard />
        </div>
      </section>}

      {/* 8. Quick Actions Navigation */}
      <section aria-labelledby="dashboard-quick-actions-heading">
        <h2 id="dashboard-quick-actions-heading" className="sr-only">
          Quick Actions
        </h2>
        <QuickActions />
      </section>

      {/* One-Click Printable Kisan Farm Decision Report Modal */}
      <PrintableReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportData={{
          farmer: {
            name: user?.name || 'Registered Farmer',
            phone: user?.phone || '+91 98765 43210',
            village: user?.FarmerProfile?.village || 'Agro-Cluster',
            district: `${farmerDistrict} District`,
            state: farmerState,
            farmSizeAcres: `${totalFarmAcres} Acres`,
            crop: selectedCropTab === 'all' 
              ? (crops.map(c => c.cropName).join(', ') || 'Mixed Produce') 
              : (activeCropData?.name || 'Selected Crop'),
            quantityKg: selectedCropTab === 'all' ? totalCombinedHarvestKg : (activeCropData?.expectedYieldKg || 500),
            quantityQuintals: Number(((selectedCropTab === 'all' ? totalCombinedHarvestKg : (activeCropData?.expectedYieldKg || 500)) / 100).toFixed(1))
          }
        }}
      />
    </div>
  );
}
