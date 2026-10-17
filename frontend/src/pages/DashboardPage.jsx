import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Sprout, 
  Scale, 
  TrendingUp, 
  Calculator 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dashboardDemoData } from '../data/dashboardDemoData';

// Dashboard Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ProfileSummary from '../components/dashboard/ProfileSummary';
import TransporterDashboard from '../components/dashboard/TransporterDashboard';
import StatCard from '../components/dashboard/StatCard';
import WeatherWidget from '../components/dashboard/WeatherWidget';
import MarketTrendChart from '../components/dashboard/MarketTrendChart';
import RevenueComparisonChart from '../components/dashboard/RevenueComparisonChart';
import PlanningHistoryChart from '../components/dashboard/PlanningHistoryChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import TransportSummary from '../components/dashboard/TransportSummary';
import MitraAssistantCard from '../components/dashboard/MitraAssistantCard';
import QuickActions from '../components/dashboard/QuickActions';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Role-Based Dashboard Segregation:
  // 1. Admin only views the APMC Central Admin Console
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // 2. Transporter views their dedicated Cargo & Trip Logistics Dashboard
  if (user?.role === 'transporter') {
    return <TransporterDashboard />;
  }

  // 3. Farmer views full crop analytics & harvest decision dashboard
  const profile = user?.FarmerProfile;
  const farmerCrop = profile?.mainCrop || 'Tomato';
  const farmerDistrict = profile?.district || 'Pune';

  // Parse multi-crop list and product quantities map
  const cropsList = farmerCrop !== 'Not set'
    ? farmerCrop.split(',').map(c => c.trim()).filter(Boolean)
    : ['Tomato'];

  let quantitiesMap = {};
  if (typeof profile?.productQuantities === 'string') {
    try {
      quantitiesMap = JSON.parse(profile.productQuantities);
    } catch (e) {}
  } else if (typeof profile?.productQuantities === 'object' && profile?.productQuantities !== null) {
    quantitiesMap = profile.productQuantities;
  }

  // Calculate per-crop harvest breakdown
  const cropHarvestBreakdown = cropsList.map(crop => {
    const entry = quantitiesMap[crop];
    if (entry && entry.qty) {
      const val = Number(entry.qty) || 0;
      const kg = entry.unit === 'tonne' ? val * 1000 : val;
      return { crop, qty: kg };
    }
    const fallbackTotal = Number(profile?.currentHarvestKg) || 500;
    return { crop, qty: Math.round(fallbackTotal / (cropsList.length || 1)) };
  });

  const totalQuantityKg = cropHarvestBreakdown.reduce((sum, c) => sum + c.qty, 0);

  // Live prices per crop map: { [crop]: { pricePerKg, market } }
  const [livePricesMap, setLivePricesMap] = useState({});
  const [loadingPrice, setLoadingPrice] = useState(true);

  useEffect(() => {
    async function loadLiveMandiPrices() {
      try {
        const prices = {};
        await Promise.all(
          cropsList.map(async (crop) => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/market/prices?commodity=${encodeURIComponent(crop)}&state=Maharashtra&limit=30`);
              const json = await res.json();
              if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                const fDist = String(farmerDistrict || 'Pune').toLowerCase();
                const matched = json.data.find(
                  (p) => (p.district ? String(p.district).toLowerCase() === fDist : false) ||
                         (p.market_name ? String(p.market_name).toLowerCase().includes(fDist) : false) ||
                         (p.market ? String(p.market).toLowerCase().includes(fDist) : false)
                ) || json.data[0];

                const rate = Number(matched.price_per_kg || matched.pricePerKg || matched.modal_price || matched.modalPrice) || 28;
                const mkt = matched.market_name || matched.market || `${farmerDistrict} APMC`;
                prices[crop] = { pricePerKg: rate, market: mkt };
              } else {
                const defaultRate = crop.toLowerCase().includes('cotton') ? 75.65
                  : crop.toLowerCase().includes('wheat') ? 29.55
                  : crop.toLowerCase().includes('onion') ? 24.50
                  : crop.toLowerCase().includes('potato') ? 18.00
                  : crop.toLowerCase().includes('soybean') ? 48.00
                  : 28.00;
                prices[crop] = { pricePerKg: defaultRate, market: `${farmerDistrict} APMC` };
              }
            } catch (err) {
              const defaultRate = crop.toLowerCase().includes('cotton') ? 75.65
                : crop.toLowerCase().includes('wheat') ? 29.55
                : 28.00;
              prices[crop] = { pricePerKg: defaultRate, market: `${farmerDistrict} APMC` };
            }
          })
        );
        setLivePricesMap(prices);
      } catch (err) {
        console.warn('Could not fetch live dashboard prices:', err.message);
      } finally {
        setLoadingPrice(false);
      }
    }

    loadLiveMandiPrices();
  }, [user, farmerCrop, farmerDistrict]);

  // Compute per-crop revenue and total
  let totalEstimatedRevenue = 0;
  const revenueBreakdown = cropHarvestBreakdown.map(({ crop, qty }) => {
    const rate = livePricesMap[crop]?.pricePerKg || 28;
    const rev = Math.round(qty * rate);
    totalEstimatedRevenue += rev;
    return { crop, qty, rate, revenue: rev };
  });

  const primaryMarketName = Object.values(livePricesMap)[0]?.market || `${farmerDistrict} APMC`;
  const isMultiCrop = cropHarvestBreakdown.length > 1;

  // Multi-crop StatCard items
  const harvestItems = isMultiCrop
    ? cropHarvestBreakdown.map(c => ({
        label: c.crop,
        value: `${c.qty.toLocaleString('en-IN')} kg`
      }))
    : null;

  const priceItems = isMultiCrop
    ? cropsList.map(c => ({
        label: c,
        value: `₹${(livePricesMap[c]?.pricePerKg || 28).toFixed(2)} / kg`
      }))
    : null;

  const revenueItems = isMultiCrop
    ? revenueBreakdown.map(r => ({
        label: `${r.crop} (${r.qty} kg)`,
        value: `₹${r.revenue.toLocaleString('en-IN')}`
      }))
    : null;

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto pb-12">
      {/* 1. Dashboard Header */}
      <DashboardHeader />

      {/* 2. Farmer Profile Summary */}
      <ProfileSummary />

      {/* 3. 4 Key Statistics Cards (100% Dynamic) */}
      <section aria-labelledby="dashboard-stats-heading" className="space-y-3">
        <h2 id="dashboard-stats-heading" className="sr-only">
          Harvest Key Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Current Crop */}
          <StatCard
            icon={Sprout}
            label={isMultiCrop ? "Current Crops" : t('dashboard.stats.currentCrop')}
            value={farmerCrop}
            subtext={`${farmerDistrict} Agro-Zone (${cropHarvestBreakdown.length} Active Crops)`}
            color="text-primary bg-primary-50 border-primary/20"
          />

          {/* Stat 2: Harvest Quantity */}
          <StatCard
            icon={Scale}
            label={isMultiCrop ? "Harvest per Crop" : t('dashboard.stats.harvestQuantity')}
            value={`${totalQuantityKg.toLocaleString('en-IN')} kg`}
            items={harvestItems}
            subtext={isMultiCrop ? `Total: ${totalQuantityKg.toLocaleString('en-IN')} kg (${(totalQuantityKg / 100).toFixed(1)} Qtl)` : `${(totalQuantityKg / 100).toFixed(1)} Quintals Harvest Ready`}
            color="text-amber-700 bg-amber-50 border-amber-200"
          />

          {/* Stat 3: Live Market Price */}
          <StatCard
            icon={TrendingUp}
            label={isMultiCrop ? "Live Market Prices" : t('dashboard.stats.marketPrice')}
            value={isMultiCrop ? `₹${(revenueBreakdown[0]?.rate || 28).toFixed(2)} / kg` : `₹${(livePricesMap[cropsList[0]]?.pricePerKg || 28).toFixed(2)} / kg`}
            items={priceItems}
            subtext={`${primaryMarketName} • Live Mandi Rates`}
            badge="Live APMC"
            color="text-emerald-700 bg-emerald-50 border-emerald-200"
          />

          {/* Stat 4: Estimated Revenue */}
          <StatCard
            icon={Calculator}
            label={t('dashboard.stats.estimatedRevenue')}
            value={`₹${totalEstimatedRevenue.toLocaleString('en-IN')}`}
            items={revenueItems}
            subtext={isMultiCrop ? `Total Take-Home across ${cropsList.length} crops` : `Take-Home (${totalQuantityKg} kg @ ₹${livePricesMap[cropsList[0]]?.pricePerKg || 28}/kg)`}
            badge="Live Calculation"
            color="text-blue-700 bg-blue-50 border-blue-200"
          />
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
          <MarketTrendChart />
          <RevenueComparisonChart />
        </div>
      </section>

      {/* 6. Harvest Planning History */}
      <section aria-labelledby="dashboard-planning-history-heading">
        <h2 id="dashboard-planning-history-heading" className="sr-only">
          Planning History
        </h2>
        <PlanningHistoryChart />
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
    </div>
  );
}
