import React from 'react';
import { 
  Sprout, 
  Scale, 
  TrendingUp, 
  Calculator 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { dashboardDemoData } from '../data/dashboardDemoData';

// Dashboard Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ProfileSummary from '../components/dashboard/ProfileSummary';
import StatCard from '../components/dashboard/StatCard';
import WeatherWidget from '../components/dashboard/WeatherWidget';
import MarketTrendChart from '../components/dashboard/MarketTrendChart';
import RevenueComparisonChart from '../components/dashboard/RevenueComparisonChart';
import PlanningHistoryChart from '../components/dashboard/PlanningHistoryChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import TransportSummary from '../components/dashboard/TransportSummary';
import MitraAssistantCard from '../components/dashboard/MitraAssistantCard';
import QuickActions from '../components/dashboard/QuickActions';

export default function DashboardPage() {
  const { t } = useLanguage();
  const stats = dashboardDemoData.stats;

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto pb-12">
      {/* 1. Dashboard Header */}
      <DashboardHeader />

      {/* 2. Farmer Profile Summary */}
      <ProfileSummary />

      {/* 3. 4 Key Statistics Cards */}
      <section aria-labelledby="dashboard-stats-heading" className="space-y-3">
        <h2 id="dashboard-stats-heading" className="sr-only">
          Harvest Key Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Current Crop */}
          <StatCard
            icon={Sprout}
            label={t('dashboard.stats.currentCrop')}
            value={t('dashboard.stats.currentCropValue', stats.crop)}
            subtext={stats.cropVariety}
            color="text-primary bg-primary-50 border-primary/20"
          />

          {/* Stat 2: Harvest Quantity */}
          <StatCard
            icon={Scale}
            label={t('dashboard.stats.harvestQuantity')}
            value={t('dashboard.stats.harvestQuantityValue', stats.quantity)}
            subtext={t('dashboard.stats.quantitySubtext')}
            color="text-amber-700 bg-amber-50 border-amber-200"
          />

          {/* Stat 3: Market Price */}
          <StatCard
            icon={TrendingUp}
            label={t('dashboard.stats.marketPrice')}
            value={stats.marketPrice}
            subtext={t('dashboard.stats.marketPriceSubtext')}
            badge={t('dashboard.demoData')}
            color="text-emerald-700 bg-emerald-50 border-emerald-200"
          />

          {/* Stat 4: Estimated Revenue */}
          <StatCard
            icon={Calculator}
            label={t('dashboard.stats.estimatedRevenue')}
            value={stats.estimatedRevenue}
            subtext={t('dashboard.stats.estimatedRevenueSubtext')}
            badge="Illustrative"
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
      <section aria-labelledby="dashboard-operations-heading" className="space-y-3">
        <h2 id="dashboard-operations-heading" className="sr-only">
          Recent Activity and Support
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RecentActivity />
          <TransportSummary />
          <MitraAssistantCard />
        </div>
      </section>

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
