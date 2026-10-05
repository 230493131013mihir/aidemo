import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell 
} from 'recharts';
import { Scale, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { dashboardDemoData } from '../../data/dashboardDemoData';

function RevenueTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface p-2.5 rounded-xl border border-border shadow-md text-xs space-y-1">
        <p className="font-bold text-text">{label}</p>
        <p className="text-primary font-extrabold">
          Est. Net: ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
        <p className="text-[10px] text-muted">Demonstration estimate</p>
      </div>
    );
  }
  return null;
}

export default function RevenueComparisonChart() {
  const { t } = useLanguage();

  const data = dashboardDemoData.revenueComparison.map((item) => ({
    ...item,
    displayName: t(item.optionKey, item.optionName),
  }));

  return (
    <div className="card-harvest p-5 sm:p-6 bg-surface border-border flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="space-y-1 border-b border-border/70 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary-50 text-primary border border-primary/20">
              <Scale className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-base text-text">
              {t('dashboard.analytics.revenueCompTitle')}
            </h3>
          </div>
          <span className="badge-tag bg-secondary text-primary-dark border border-border text-[10px]">
            {t('dashboard.demoData')}
          </span>
        </div>
        <p className="text-xs text-muted">
          {t('dashboard.analytics.revenueCompSubtitle')}
        </p>
      </div>

      {/* Recharts BarChart */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 15, left: 5, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d4" opacity={0.6} />
            <XAxis 
              dataKey="displayName" 
              tick={{ fontSize: 10, fill: '#5e6f62' }}
              axisLine={{ stroke: '#e5e0d4' }}
              tickLine={false}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#5e6f62' }}
              axisLine={{ stroke: '#e5e0d4' }}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Bar dataKey="netRevenue" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Disclaimer note */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted pt-2 border-t border-border/60">
        <AlertCircle className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
        <span>{t('dashboard.analytics.revenueCompNote')}</span>
      </div>
    </div>
  );
}
