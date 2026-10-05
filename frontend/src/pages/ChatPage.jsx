import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ChatWindow from '../components/chatbot/ChatWindow';

export default function ChatPage() {
  const { t, language } = useLanguage();

  const demoFarmerContext = {
    farmer: {
      name: 'Ramesh Patel',
      district: 'Surat',
      state: 'Gujarat',
      crop: 'Tomato',
      yieldKg: 500,
      preferredLanguage: language || 'gu'
    },
    crop: {
      name: 'Tomato',
      shelfLifeDays: 5
    },
    localMarket: {
      name: 'Surat APMC',
      pricePerKg: 18.5,
      distanceKm: 0,
      transportCost: 1200
    },
    regionalMarket: {
      name: 'Ahmedabad APMC',
      pricePerKg: 23.0,
      distanceKm: 260,
      transportCost: 2800,
      sharedTransportCost: 1400
    },
    weather: {
      district: 'Surat',
      rainProbability: 70,
      condition: 'Rain expected',
      advisory: 'Harvest tomatoes promptly to prevent perishability losses'
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4" aria-hidden="true" />
            <span>Voice & Text AI Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
            {t('chat.title')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t('chat.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-tag bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Active & Multilingual</span>
          </span>
        </div>
      </div>

      {/* Live ChatWindow */}
      <div className="w-full h-[680px] sm:h-[720px] flex flex-col">
        <ChatWindow contextData={demoFarmerContext} />
      </div>
    </div>
  );
}
