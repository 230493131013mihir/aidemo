/**
 * App.jsx
 * HarvestMitra AI - Unified Web Application
 * Integrates ISSUE-09 (AI Layer), ISSUE-10 (Voice Chatbot), ISSUE-11 (Market Explorer & Weather Advisory)
 */

import React, { useState } from 'react';
import ChatWindow from './components/chatbot/ChatWindow';
import MarketPriceExplorer from './components/market/MarketPriceExplorer';
import WeatherAdvisoryWidget from './components/weather/WeatherAdvisoryWidget';
import LanguageSelector from './components/chatbot/LanguageSelector';
import {
  Sprout,
  Mic,
  Volume2,
  TrendingUp,
  CloudRain,
  MessageSquare,
  Layers,
  Sparkles,
  Calculator,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  SUPPORTED_LANGUAGES
} from './services/speechService';

const NAV_TABS = [
  { id: 'chat', label: { en: 'Mitra Assistant (Voice)', hi: 'मित्रा असिस्टेंट (वॉइस)', gu: 'મિત્ર આસિસ્ટન્ટ (વોઇસ)', mr: 'मित्रा असिस्टंट (व्हॉइस)' }, icon: MessageSquare },
  { id: 'market', label: { en: 'Market Price Explorer', hi: 'मंडी भाव एक्सप्लोरर', gu: 'મંડી ભાવ એક્સપ્લોરર', mr: 'बाजार भाव एक्सप्लोरर' }, icon: TrendingUp },
  { id: 'weather', label: { en: 'Weather & Rain Advisory', hi: 'मौसम व वर्षा परामर्श', gu: 'હવામાન અને વરસાદ સલાહ', mr: 'हवामान व पाऊस सल्लागार' }, icon: CloudRain }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');

  // Shared language state across all modules
  const [globalLanguage, setGlobalLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('mitraLanguage');
      return saved && SUPPORTED_LANGUAGES[saved] ? saved : 'en';
    } catch (_) {
      return 'en';
    }
  });

  const handleGlobalLanguageChange = (newLang) => {
    setGlobalLanguage(newLang);
    try {
      localStorage.setItem('mitraLanguage', newLang);
    } catch (_) {}
  };

  // Farmer Context
  const [activeContext, setActiveContext] = useState({
    farmer: {
      name: 'Ramesh Patel',
      location: 'Surat, Gujarat',
      farmSizeAcres: 4.5
    },
    crop: {
      name: 'Tomato',
      variety: 'Hybrid Desi',
      quantityKg: 500,
      harvestStage: 'Ready'
    },
    marketData: {
      currentMarket: {
        name: 'Surat APMC Mandi',
        pricePerKg: 20.0,
        unit: 'kg',
        sourceType: 'DEMO'
      }
    },
    calculations: {
      today: {
        grossRevenue: 10000,
        totalCost: 1500,
        netRevenue: 8500
      },
      alternativeMarket: {
        marketName: 'Navsari APMC',
        pricePerKg: 22.5,
        netRevenue: 9350
      }
    }
  });

  // Simulator Notice Modal
  const [simulatorNotice, setSimulatorNotice] = useState(null);

  const handleSelectMarketForSimulator = (marketItem) => {
    setSimulatorNotice({
      title: 'Market Pre-filled for Harvest Simulator',
      message: `Selected ${marketItem.market_name} with ${marketItem.crop_name} price at ₹${marketItem.price_per_kg}/kg. Injected into simulator parameters.`
    });
  };

  const handleNavigateToSimulator = () => {
    setSimulatorNotice({
      title: 'Reviewing Harvest Decision with Weather Advisory',
      message: 'Surat District has an active Rain Advisory (70% rain probability). Option 1 (Sell Today) carries lower perishability risk compared to holding in wet weather.'
    });
  };

  const sttAvailable = isSpeechRecognitionSupported();
  const ttsAvailable = isSpeechSynthesisSupported();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-900 to-emerald-900 text-stone-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="border-b border-emerald-800/50 bg-emerald-950/85 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-emerald-950 rounded-[10px] flex items-center justify-center">
              <Sprout className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                HarvestMitra AI
              </h1>
              <span className="hidden md:inline-flex items-center text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full">
                ISSUE-11 Integrated
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/80 hidden sm:block">
              Smart Decision & Logistics Platform for Indian Farmers
            </p>
          </div>
        </div>

        {/* Global Controls: STT/TTS Badges & Language Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Speech capability badges */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                sttAvailable ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
              title="STT Status"
            >
              <Mic className="w-3 h-3" />
              <span>STT: {sttAvailable ? 'Active' : 'Fallback'}</span>
            </span>

            <span
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                ttsAvailable ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
              title="TTS Status"
            >
              <Volume2 className="w-3 h-3" />
              <span>TTS: {ttsAvailable ? 'Active' : 'Fallback'}</span>
            </span>
          </div>

          {/* Global Language Selector */}
          <LanguageSelector
            selectedLanguage={globalLanguage}
            onLanguageChange={handleGlobalLanguageChange}
          />
        </div>
      </nav>

      {/* Module Navigation Tabs */}
      <div className="border-b border-emerald-800/40 bg-emerald-950/60 backdrop-blur-sm px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-2">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const labelText = tab.label[globalLanguage] || tab.label.en;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-emerald-200/70 hover:text-white hover:bg-emerald-900/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{labelText}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notice Banner if Simulator Action Clicked */}
      {simulatorNotice && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-3">
          <div className="p-3 bg-emerald-900/60 border border-emerald-600/50 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-white">{simulatorNotice.title}:</strong> {simulatorNotice.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSimulatorNotice(null)}
              className="text-emerald-400 hover:text-white p-1 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* TAB 1: Mitra Assistant Voice Chatbot */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 items-start">
            {/* Context Sidebar */}
            <div className="w-full lg:w-80 shrink-0 space-y-4 order-2 lg:order-1">
              <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-4 backdrop-blur-sm shadow-md">
                <div className="flex items-center gap-2 mb-3 text-emerald-300 font-semibold text-sm">
                  <Layers className="w-4 h-4" />
                  <span>Verified Backend Context</span>
                </div>
                <div className="space-y-2 text-xs text-emerald-100/90 divide-y divide-emerald-800/40">
                  <div className="pt-1 flex justify-between">
                    <span className="text-emerald-300/70">Farmer:</span>
                    <span className="font-medium">{activeContext.farmer.name}</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-emerald-300/70">Active Crop:</span>
                    <span className="font-semibold text-emerald-200">
                      {activeContext.crop.quantityKg} kg {activeContext.crop.name}
                    </span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-emerald-300/70">Surat APMC Mandi:</span>
                    <span className="font-medium text-emerald-300">₹20/kg [DEMO]</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-emerald-300/70">Calculated Net Revenue:</span>
                    <span className="font-semibold text-emerald-400">
                      ₹{activeContext.calculations.today.netRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4-Language Voice Test Guide */}
              <div className="bg-stone-900/50 border border-stone-700/40 rounded-2xl p-4 backdrop-blur-sm shadow-md">
                <div className="flex items-center gap-2 mb-2 text-stone-200 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Multilingual Voice Prompts</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded bg-emerald-950/60 border border-emerald-600/30 text-stone-300">
                    <strong className="text-emerald-300 block text-[10px]">मराठी (mr):</strong>
                    "माझ्याकडे 500 किलो टोमॅटो आहेत. आज विकावे का?"
                  </div>
                  <div className="p-2 rounded bg-stone-950/60 border border-stone-700/40 text-stone-300">
                    <strong className="text-emerald-300 block text-[10px]">ગુજરાતી (gu):</strong>
                    "મારી પાસે 500 કિલો ટામેટાં છે. આજે વેચવા જોઈએ?"
                  </div>
                  <div className="p-2 rounded bg-stone-950/60 border border-stone-700/40 text-stone-300">
                    <strong className="text-emerald-300 block text-[10px]">हिन्दी (hi):</strong>
                    "मेरे पास 500 किलो टमाटर हैं। क्या मुझे आज बेचने चाहिए?"
                  </div>
                  <div className="p-2 rounded bg-stone-950/60 border border-stone-700/40 text-stone-300">
                    <strong className="text-emerald-300 block text-[10px]">English (en):</strong>
                    "What is today's tomato rate in Surat?"
                  </div>
                </div>
              </div>
            </div>

            {/* ChatWindow */}
            <div className="flex-1 w-full order-1 lg:order-2 h-[680px] sm:h-[720px] flex flex-col">
              <ChatWindow contextData={activeContext} />
            </div>
          </div>
        )}

        {/* TAB 2: Market Price Explorer */}
        {activeTab === 'market' && (
          <div className="flex-1 w-full min-h-[680px] flex flex-col">
            <MarketPriceExplorer
              selectedLanguage={globalLanguage}
              onSelectMarketForSimulator={handleSelectMarketForSimulator}
            />
          </div>
        )}

        {/* TAB 3: Weather & Rain Advisory */}
        {activeTab === 'weather' && (
          <div className="flex-1 w-full min-h-[680px] flex flex-col max-w-4xl mx-auto">
            <WeatherAdvisoryWidget
              selectedLanguage={globalLanguage}
              onNavigateToSimulator={handleNavigateToSimulator}
            />
          </div>
        )}
      </main>
    </div>
  );
}
