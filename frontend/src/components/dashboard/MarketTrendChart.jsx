import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { dashboardDemoData } from '../../data/dashboardDemoData';

function PriceTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface p-2.5 rounded-xl border border-border shadow-md text-xs space-y-1">
        <p className="font-bold text-text">{label}</p>
        <p className="text-primary font-extrabold">
          ₹{payload[0].value} / kg
        </p>
        <p className="text-[10px] text-muted">Demo APMC Rate</p>
      </div>
    );
  }
  return null;
}

export default function MarketTrendChart() {
  const { t } = useLanguage();

  const data = dashboardDemoData.priceTrends.map((pt) => ({
    ...pt,
    displayName: t(pt.dayKey, pt.day),
  }));

  return (
    <div className="card-harvest p-5 sm:p-6 bg-surface border-border flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="space-y-1 border-b border-border/70 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-base text-text">
              {t('dashboard.analytics.priceTrendTitle')}
            </h3>
          </div>
          <span className="badge-tag bg-secondary text-primary-dark border border-border text-[10px]">
            {t('dashboard.demoData')}
          </span>
        </div>
        <p className="text-xs text-muted">
          {t('dashboard.analytics.priceTrendSubtitle')}
        </p>
      </div>

      {/* Recharts LineChart */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d4" opacity={0.6} />
            <XAxis 
              dataKey="displayName" 
              tick={{ fontSize: 11, fill: '#5e6f62' }}
              axisLine={{ stroke: '#e5e0d4' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#5e6f62' }}
              domain={[20, 40]}
              axisLine={{ stroke: '#e5e0d4' }}
              tickLine={false}
              unit="₹"
            />
            <Tooltip content={<PriceTooltip />} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#1b5e20" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#1b5e20', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Disclaimer note */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted pt-2 border-t border-border/60">
        <AlertCircle className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
        <span>{t('dashboard.analytics.priceTrendNote')}</span>
      </div>
    </div>
  );
}
