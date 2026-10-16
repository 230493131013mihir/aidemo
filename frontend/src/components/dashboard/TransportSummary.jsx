import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, Users, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function TransportSummary() {
  const { t } = useLanguage();
  const transport = { destination: 'Available APMC routes' };

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-700/40 text-white flex flex-col justify-between space-y-4">
      {/* Background Photographic Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
        style={{ backgroundImage: `url('/images/transport-hero.jpg')` }}
      />
      {/* Dark Slate & Navy Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/85 to-blue-950/75 backdrop-blur-[0.5px]" />
      <div className="absolute inset-0 bg-radial-at-t from-blue-500/10 via-transparent to-black/40 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
              <Truck className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="font-black text-base text-white">
              {t('dashboard.transport.title')}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold backdrop-blur-md">
            Live availability
          </span>
        </div>

        {/* Info Details in Glassmorphic Capsule */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-2 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-300">{t('dashboard.transport.destinationLabel')}:</span>
              <span className="font-black text-white">{transport.destination}</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Users className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              <span className="text-slate-300">Transport:</span>
              <span className="font-bold text-emerald-300">Book verified registered vehicles</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
            Book transport and track your own confirmed requests in the Shared Transport section.
          </p>
        </div>

        {/* Action */}
        <div className="pt-2 border-t border-white/15">
          <Link
            to="/transport"
            id="btn-dashboard-view-transport"
            className="w-full text-xs py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <span>{t('dashboard.transport.buttonView')}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

