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
import { Scale, Sparkles, TrendingUp, Award } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

function RevenueTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
        <p className="font-bold text-slate-300">{label}</p>
        <p className="text-emerald-400 font-extrabold text-sm">
          Net In-Hand: ₹{Number(payload[0].value).toLocaleString('en-IN')}
        </p>
        <p className="text-[10px] text-slate-400">{data.description || 'Calculated Revenue Strategy'}</p>
      </div>
    );
  }
  return null;
}

export default function RevenueComparisonChart({ crops = [], totalHarvestKg = 1500 }) {
  const { t } = useLanguage();

  // Dynamically calculate revenue comparison from real farmer crops
  const totalKg = crops.length 
    ? crops.reduce((sum, c) => sum + (Number(c.quantityKg) || 0), 0) || totalHarvestKg
    : totalHarvestKg;

  // Average live price per kg across registered crops
  const avgPricePerKg = crops.length
    ? crops.reduce((sum, c) => sum + (Number(c.pricePerKg) || 25), 0) / crops.length
    : 26;

  // 4 Dynamic Strategies calculated deterministically
  const localGross = Math.round(totalKg * (avgPricePerKg * 0.9));
  const localNet = Math.max(1000, localGross - 1200);

  const terminalGross = Math.round(totalKg * (avgPricePerKg * 1.25));
  const terminalNet = Math.max(1000, terminalGross - 3800);

  const coldStorageGross = Math.round(totalKg * 0.95 * (avgPricePerKg * 1.35));
  const coldStorageNet = Math.max(1000, coldStorageGross - 2400);

  const sharedTransportGross = terminalGross;
  const sharedTransportNet = Math.max(1000, sharedTransportGross - 1600); // 60% freight savings

  const dynamicData = [
    {
      name: 'Local Mandi',
      netRevenue: localNet,
      color: '#94a3b8',
      description: 'Immediate local village sale with standard middleman cut'
    },
    {
      name: 'Cold Storage Hold',
      netRevenue: coldStorageNet,
      color: '#3b82f6',
      description: 'Store for 21 days with 5% shrinkage buffer'
    },
    {
      name: 'Solo Regional APMC',
      netRevenue: terminalNet,
      color: '#f59e0b',
      description: 'Dispatch full load to high-spread Vashi/Pune terminal'
    },
    {
      name: 'Shared Pooling (Best)',
      netRevenue: sharedTransportNet,
      color: '#10b981',
      description: 'Direct high-spread mandi sale + shared mini-truck logistics'
    }
  ];

  const maxRevenue = Math.max(...dynamicData.map(d => d.netRevenue));
  const netAdvantage = sharedTransportNet - localNet;

  return (
    <div className="card-harvest p-5 sm:p-6 bg-surface border-border flex flex-col justify-between space-y-4 shadow-sm">
      {/* Header */}
      <div className="space-y-1 border-b border-border/70 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary-50 text-primary border border-primary/20">
              <Scale className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">
                {t('dashboard.analytics.revenueCompTitle', 'Net Realization Strategy Comparison')}
              </h3>
              <p className="text-xs text-muted">
                {t('dashboard.analytics.revenueCompSubtitle', 'Dynamic mathematical simulation for your active harvest')} ({totalKg.toLocaleString('en-IN')} kg)
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black self-start sm:self-auto">
            +₹{netAdvantage.toLocaleString('en-IN')} Max Gain
          </span>
        </div>
      </div>

      {/* Recharts BarChart */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dynamicData} margin={{ top: 15, right: 15, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d4" opacity={0.6} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
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
              {dynamicData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dynamic Summary Note */}
      <div className="flex items-center justify-between text-[11px] text-muted pt-2 border-t border-border/60">
        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
          <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Winning Strategy: Shared Pooling delivers +{Math.round((netAdvantage / (localNet || 1)) * 100)}% extra profit in pocket.</span>
        </div>
      </div>
    </div>
  );
}
