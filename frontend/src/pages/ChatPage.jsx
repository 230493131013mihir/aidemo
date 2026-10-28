import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Sparkles, Stethoscope } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/chatbot/ChatWindow';
import CropDoctorModal from '../components/features/CropDoctorModal';

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || searchParams.get('q') || searchParams.get('query') || null;
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [doctorModalOpen, setDoctorModalOpen] = useState(searchParams.get('tab') === 'doctor');

  useEffect(() => {
    if (searchParams.get('tab') === 'doctor') {
      setDoctorModalOpen(true);
    }
  }, [searchParams]);

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
    <div className="space-y-6 w-full max-w-full 2xl:max-w-[1600px] mx-auto py-4 sm:py-6 px-2 sm:px-4">
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
              <span>{isTransporter ? t('chat.transporterBadge', 'Multilingual Logistics AI Dispatcher') : t('chat.farmerBadge', 'Voice & Multilingual AI Agronomist')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {isTransporter ? t('chat.transporterTitle', 'Mitra Logistics Assistant') : t('chat.title', 'Mitra AI Advisory Assistant')}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100 font-medium leading-relaxed drop-shadow-xs">
              {isTransporter
                ? t('chat.transporterSubtitle', 'Ask about your next pickup point, route corridors, remaining vehicle payload capacity, active trips, and highway weather.')
                : t('chat.subtitle', 'Your 24/7 agricultural assistant for live APMC mandi prices, crop health, rainfall forecast, and government schemes.')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isTransporter && (
              <button
                type="button"
                onClick={() => setDoctorModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition-all backdrop-blur-md border border-white/30"
              >
                <Stethoscope className="w-3.5 h-3.5 text-emerald-200" />
                <span>{t('cropDoctor.title', 'AI Crop Doctor')}</span>
              </button>
            )}
            <span className="badge-tag bg-teal-500/20 text-teal-200 border border-teal-400/40 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-teal-300 animate-pulse" aria-hidden="true" />
              <span>{isTransporter ? t('chat.transporterActiveStatus', 'Logistics Assistant Active') : t('chat.activeStatus', 'Active & Multilingual')}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Crop Doctor Modal */}
      <CropDoctorModal
        isOpen={doctorModalOpen}
        onClose={() => {
          setDoctorModalOpen(false);
          if (searchParams.get('tab') === 'doctor') {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('tab');
            setSearchParams(nextParams, { replace: true });
          }
        }}
      />

      {/* Live ChatWindow */}
      <div className="w-full h-[calc(100vh-16rem)] min-h-[640px] max-h-[850px] flex flex-col">
        <ChatWindow 
          contextData={isTransporter ? { transporter: { id: user?.id, name: user?.name, phone: user?.phone } } : demoFarmerContext} 
          initialLanguage={language}
          isTransporter={isTransporter}
          initialPrompt={initialPrompt}
        />
      </div>
    </div>
  );
}
