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
  const farmerCrop = user?.FarmerProfile?.mainCrop || 'Tomato';
  const farmerDistrict = user?.FarmerProfile?.district || 'Pune';
  const quantityKg = Number(user?.FarmerProfile?.currentHarvestKg) || 500;

  const [livePrice, setLivePrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  useEffect(() => {
    async function loadLiveMandiPrice() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/market/prices?commodity=${encodeURIComponent(farmerCrop)}&limit=30`);
        const result = await response.json();

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          // Find matching market for user district, or fallback to first
          const matched = result.data.find(
            (p) => p.district?.toLowerCase() === farmerDistrict.toLowerCase() || p.market?.toLowerCase().includes(farmerDistrict.toLowerCase())
          ) || result.data[0];

          setLivePrice(matched);
        }
      } catch (err) {
        console.warn('Could not fetch live dashboard price, using fallback:', err.message);
      } finally {
        setLoadingPrice(false);
      }
    }

    loadLiveMandiPrice();
  }, [user, farmerCrop, farmerDistrict]);

  // Derived live market figures
  const currentPricePerKg = livePrice ? Number(livePrice.pricePerKg) : 22;
  const estimatedRevenue = Math.round(quantityKg * currentPricePerKg);
  const marketName = livePrice ? livePrice.market : `${farmerDistrict} APMC`;

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
            label={t('dashboard.stats.currentCrop')}
            value={farmerCrop}
            subtext={`${farmerDistrict} Agro-Zone`}
            color="text-primary bg-primary-50 border-primary/20"
          />

          {/* Stat 2: Harvest Quantity */}
          <StatCard
            icon={Scale}
            label={t('dashboard.stats.harvestQuantity')}
            value={`${quantityKg} kg`}
            subtext={`${(quantityKg / 100).toFixed(1)} Quintals Harvest Ready`}
            color="text-amber-700 bg-amber-50 border-amber-200"
          />

          {/* Stat 3: Live Market Price */}
          <StatCard
            icon={TrendingUp}
            label={t('dashboard.stats.marketPrice')}
            value={`₹${currentPricePerKg} / kg`}
            subtext={`${marketName} • Live Mandi`}
            badge="Live APMC"
            color="text-emerald-700 bg-emerald-50 border-emerald-200"
          />

          {/* Stat 4: Estimated Revenue */}
          <StatCard
            icon={Calculator}
            label={t('dashboard.stats.estimatedRevenue')}
            value={`₹${estimatedRevenue.toLocaleString('en-IN')}`}
            subtext={`Take-Home (${quantityKg} kg @ ₹${currentPricePerKg}/kg)`}
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
