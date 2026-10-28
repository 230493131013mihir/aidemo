import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/chatbot/ChatWindow';

export default function ChatPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const profile = user?.FarmerProfile;
  const demoFarmerContext = {
    farmer: {
      name: user?.name || 'Varun Patil',
      district: profile?.district || 'Pune',
      state: profile?.state || 'Maharashtra',
      crop: profile?.mainCrop || 'Tomato',
      yieldKg: profile?.currentHarvestKg || 500,
      preferredLanguage: profile?.preferredLanguage || language || 'mr'
    },
    crop: {
      name: profile?.mainCrop || 'Tomato',
      shelfLifeDays: 5
    },
    localMarket: {
      name: `${profile?.district || 'Pune'} APMC`,
      pricePerKg: 28.5,
      distanceKm: 0,
      transportCost: 1200
    },
    regionalMarket: {
      name: 'Mumbai Vashi APMC',
      pricePerKg: 34.0,
      distanceKm: 148,
      transportCost: 2800,
      sharedTransportCost: 1400
    },
    weather: {
      district: profile?.district || 'Pune',
      rainProbability: 35,
      condition: 'Favorable Weather',
      advisory: 'Low rain risk across Maharashtra. Good window for harvesting and transport planning.'
    }
  };


  const isTransporter = user?.role === 'transporter';

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      {/* Module Hero Banner — Deep Green / Teal with Soft AI Glow */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-teal-700/50 text-white animate-fade-slide-up ai-glow-subtle">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/dashboard-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-teal-950/88 to-emerald-950/80 backdrop-blur-[1px]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Bot className="w-3.5 h-3.5 text-teal-400" />
              <span>{isTransporter ? 'Multilingual Logistics AI Dispatcher' : 'Voice & Multilingual AI Agronomist'}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {isTransporter ? 'Mitra Logistics Assistant' : 'Mitra AI Advisory Assistant'}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100 font-medium leading-relaxed drop-shadow-xs">
              {isTransporter
                ? 'Ask about your next pickup point, route corridors, remaining vehicle payload capacity, active trips, and highway weather.'
                : 'Your 24/7 agricultural assistant for mandi rates, crop health, and government schemes.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-tag bg-teal-500/20 text-teal-200 border border-teal-400/40 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-teal-300 animate-pulse" aria-hidden="true" />
              <span>{isTransporter ? 'Logistics Assistant Active' : 'Mitra AI Active & Multilingual'}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Live ChatWindow */}
      <div className="w-full h-[680px] sm:h-[720px] flex flex-col">
        <ChatWindow 
          contextData={isTransporter ? { transporter: { id: user?.id, name: user?.name, phone: user?.phone } } : demoFarmerContext} 
          initialLanguage={language}
          isTransporter={isTransporter}
        />
      </div>
    </div>
  );
}
