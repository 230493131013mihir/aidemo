import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Calendar, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { dashboardDemoData } from '../../data/dashboardDemoData';

function HistoryTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface p-2.5 rounded-xl border border-border shadow-md text-xs space-y-1">
        <p className="font-bold text-text">{label}</p>
        <p className="text-primary font-extrabold">
          Est. Net: ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
        <p className="text-[10px] text-muted">Past Simulation Record</p>
      </div>
    );
  }
  return null;
}

export default function PlanningHistoryChart() {
  const { t } = useLanguage();

  const data = dashboardDemoData.planningHistory.map((item) => ({
    ...item,
    displayName: t(item.periodKey, item.period),
  }));

  return (
    <div className="card-harvest p-5 sm:p-6 bg-surface border-border flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="space-y-1 border-b border-border/70 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Calendar className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-base text-text">
              {t('dashboard.analytics.planningHistoryTitle')}
            </h3>
          </div>
          <span className="badge-tag bg-secondary text-primary-dark border border-border text-[10px]">
            {t('dashboard.demoData')}
          </span>
        </div>
        <p className="text-xs text-muted">
          {t('dashboard.analytics.planningHistorySubtitle')}
        </p>
      </div>

      {/* Recharts AreaChart */}
      <div className="w-full h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1b5e20" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1b5e20" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d4" opacity={0.6} />
            <XAxis 
              dataKey="displayName" 
              tick={{ fontSize: 11, fill: '#5e6f62' }}
              axisLine={{ stroke: '#e5e0d4' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#5e6f62' }}
              axisLine={{ stroke: '#e5e0d4' }}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<HistoryTooltip />} />
            <Area 
              type="monotone" 
              dataKey="estimatedNet" 
              stroke="#1b5e20" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#historyGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Note */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted pt-2 border-t border-border/60">
        <AlertCircle className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
        <span>{t('dashboard.analytics.planningHistoryNote')}</span>
      </div>
    </div>
  );
}
