import React from 'react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  items,
  subtext,
  badge,
  color = 'text-primary bg-primary-50 border-primary/20',
}) {
  return (
    <div 
      className="group relative min-w-0 p-5 rounded-3xl bg-white border border-slate-200/90 flex flex-col justify-between space-y-3 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 overflow-hidden"
      style={{
        transform: 'perspective(1000px)',
        boxShadow: '0 4px 15px -2px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Subtle hover gradient highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 via-emerald-50/0 to-emerald-50/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Top Row: Icon on left, Badge on right */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className={`p-2.5 rounded-2xl border ${color} shrink-0 shadow-2xs group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
        {badge && (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold tracking-wide uppercase shrink-0 shadow-2xs">
            {badge}
          </span>
        )}
      </div>

      {/* Label and Big Value or Breakdown Items */}
      <div className="relative z-10 space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">
          {label}
        </span>

        {items && items.length > 0 ? (
          <div className="space-y-1 pt-0.5">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs sm:text-sm font-bold bg-slate-50/80 px-2.5 py-1 rounded-xl border border-slate-200/60">
                <span className="text-slate-600 truncate">{it.label}</span>
                <span className="text-slate-900 font-mono font-black ml-2 shrink-0">{it.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
            {value}
          </p>
        )}

        {subtext && (
          <p className="text-xs text-slate-500 flex items-center gap-1 truncate pt-0.5 font-medium">
            <span>{subtext}</span>
          </p>
        )}
      </div>
    </div>
  );
}

