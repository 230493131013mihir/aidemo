import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FeatureCard({ 
  icon: Icon, 
  title, 
  desc, 
  link, 
  badge, 
  color = 'text-primary bg-primary/10 border-primary/20',
  exploreText = 'Explore Module'
}) {
  return (
    <Link
      to={link}
      className="card-harvest p-6 flex flex-col justify-between group hover:border-primary/50 hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-110 ${color}`}>
            <Icon className="w-6 h-6" aria-hidden="true" />
          </div>
          {badge && (
            <span className="badge-tag bg-secondary text-muted border border-border text-[11px]">
              {badge}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-lg text-text group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            {desc}
          </p>
        </div>
      </div>

      <div className="pt-6 mt-4 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
        <span>{exploreText}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" aria-hidden="true" />
      </div>
    </Link>
  );
}
