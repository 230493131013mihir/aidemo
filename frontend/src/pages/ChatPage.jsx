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


  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      {/* Photographic AI Assistant Banner */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-900/30 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/dashboard-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-emerald-950/80 to-slate-900/70 backdrop-blur-[1px]" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Voice & Multilingual AI Agronomist</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              Mitra AI Advisory Assistant
            </h1>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm">
              Ask about live APMC mandi prices, rainfall forecast, crop harvest timing, and shared truck pooling in natural language.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-tag bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Active & Multilingual</span>
            </span>
          </div>
        </div>
      </section>

      {/* Live ChatWindow */}
      <div className="w-full h-[680px] sm:h-[720px] flex flex-col">
        <ChatWindow contextData={demoFarmerContext} initialLanguage={language} />
      </div>
    </div>
  );
}
