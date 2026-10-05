import React from 'react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  badge,
  color = 'text-primary bg-primary-50 border-primary/20',
}) {
  return (
    <div className="card-harvest p-5 bg-surface border-border flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="badge-tag bg-secondary text-muted border border-border text-[10px]">
              {badge}
            </span>
          )}
          <div className={`p-2 rounded-xl border ${color}`}>
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-muted flex items-center gap-1">
            <span>{subtext}</span>
          </p>
        )}
      </div>
    </div>
  );
}
