import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Calculator, 
  Truck, 
  Bot, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Scale, 
  MapPin, 
  Mic 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerActionCards({ 
  primaryCrop = 'Tomato', 
  primaryPrice = 28.50, 
  marketName = 'Pune APMC', 
  verifiedDate = 'Today',
  estimatedProceeds = 35138,
  quantityKg = 1500
}) {
  const { t, language } = useLanguage();

  return (
    <section aria-label="Main Farmer Actions" className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div>
          <h2 className="farmer-section-heading">
            {language === 'mr' ? 'महत्त्वाच्या कृती' : language === 'hi' ? 'मुख्य कार्य' : language === 'gu' ? 'મુખ્ય કાર્યો' : 'What would you like to do?'}
          </h2>
          <p className="farmer-subtext mt-0.5">
            {language === 'mr' 
              ? 'आपल्या पिकासाठी सर्वोत्तम दर, वाहतूक आणि सल्ला मिळवा' 
              : language === 'hi' 
              ? 'अपनी फसल के लिए सर्वोत्तम दाम, परिवहन और सलाह पाएं'
              : 'Choose an action to manage your crops, transport, or market decisions'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* CARD 1: Check Market Prices (Emerald / Teal) */}
        <div className="farmer-action-card border-emerald-300 bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/30 hover:border-emerald-500 card-hover-elevate animate-fade-slide-up animate-stagger-1 focus-within:ring-2 focus-within:ring-emerald-500/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
                <TrendingUp className="w-6 h-6 text-emerald-700" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Source</span>
              </span>
            </div>

            <div>
              <h3 className="farmer-card-heading text-slate-900">
                1. Check Market Prices
              </h3>
              <p className="farmer-body text-slate-600 mt-1">
                See current daily mandi prices for {primaryCrop} and other commodities.
              </p>
            </div>

            {/* Price Preview Highlight */}
            <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-100/80 flex items-center justify-between shadow-2xs">
              <div>
                <span className="farmer-subtext block text-slate-500">{marketName}</span>
                <span className="farmer-price-value text-emerald-800 font-bold block mt-0.5">
                  ₹{Number(primaryPrice).toFixed(2)} <span className="text-sm font-semibold text-slate-600">/ kg</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{verifiedDate}</span>
                </span>
                <span className="text-xs text-emerald-700 font-semibold block mt-0.5">APMC Daily Feed</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-emerald-100/60">
            <Link
              to="/markets"
              id="action-card-view-prices"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base transition-colors shadow-xs btn-press"
            >
              <span>View Prices</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* CARD 2: Where Should I Sell? (Blue / Indigo) */}
        <div className="farmer-action-card border-blue-300 bg-gradient-to-br from-white via-blue-50/25 to-indigo-50/30 hover:border-blue-500 card-hover-elevate animate-fade-slide-up animate-stagger-2 focus-within:ring-2 focus-within:ring-blue-500/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shadow-xs">
                <Calculator className="w-6 h-6 text-blue-700" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                <Scale className="w-4 h-4 text-blue-600" />
                <span>Net Earnings Estimate</span>
              </span>
            </div>

            <div>
              <h3 className="farmer-card-heading text-slate-900">
                2. Where Should I Sell?
              </h3>
              <p className="farmer-body text-slate-600 mt-1">
                Compare local vs regional mandis to see your take-home earnings after transport and fees.
              </p>
            </div>

            {/* Earnings Estimate Preview */}
            <div className="p-3.5 rounded-2xl bg-white/80 border border-blue-100/80 flex items-center justify-between shadow-2xs">
              <div>
                <span className="farmer-subtext block text-slate-500">Estimated Take-Home</span>
                <span className="farmer-price-value text-blue-800 font-bold block mt-0.5">
                  ₹{estimatedProceeds.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700 block">For {quantityKg.toLocaleString('en-IN')} kg</span>
                <span className="text-xs text-slate-500 block mt-0.5">After freight & cess</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-blue-100/60">
            <Link
              to="/harvest"
              id="action-card-compare-mandis"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-base transition-colors shadow-xs btn-press"
            >
              <span>Compare Mandis</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* CARD 3: Find Transport (Warm Amber / Orange) */}
        <div className="farmer-action-card border-amber-300 bg-gradient-to-br from-white via-amber-50/25 to-orange-50/30 hover:border-amber-500 card-hover-elevate animate-fade-slide-up animate-stagger-3 focus-within:ring-2 focus-within:ring-amber-500/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-xs">
                <Truck className="w-6 h-6 text-amber-700" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                <span>Verified Vehicles</span>
              </span>
            </div>

            <div>
              <h3 className="farmer-card-heading text-slate-900">
                3. Find Transport
              </h3>
              <p className="farmer-body text-slate-600 mt-1">
                Book verified trucks with transparent per-quintal rates and shared capacity savings.
              </p>
            </div>

            {/* Transport Availability Preview */}
            <div className="p-3.5 rounded-2xl bg-white/80 border border-amber-100/80 flex items-center justify-between shadow-2xs">
              <div>
                <span className="farmer-subtext block text-slate-500">Available Corridor</span>
                <span className="font-bold text-base text-slate-900 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Farm to {marketName}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 block">
                  ~40% Shared Savings
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">Verified Drivers</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-amber-100/60">
            <Link
              to="/transport"
              id="action-card-find-transport"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-base transition-colors shadow-xs btn-press"
            >
              <span>Find Transport</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* CARD 4: Ask Mitra AI (Deep Green / Teal with Soft AI Glow) */}
        <div className="farmer-action-card border-teal-300 bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/40 hover:border-teal-500 card-hover-elevate animate-fade-slide-up animate-stagger-4 ai-glow-subtle focus-within:ring-2 focus-within:ring-teal-500/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-6 h-6 text-teal-700" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold">
                <Mic className="w-3.5 h-3.5 text-teal-600" />
                <span>Voice & Text AI</span>
              </span>
            </div>

            <div>
              <h3 className="farmer-card-heading text-slate-900">
                4. Ask Mitra AI
              </h3>
              <p className="farmer-body text-slate-600 mt-1">
                Ask questions in Marathi, Hindi, Gujarati, or English about crop prices, timing, or diseases.
              </p>
            </div>

            {/* AI Prompt Example */}
            <div className="p-3.5 rounded-2xl bg-white/80 border border-teal-100/80 shadow-2xs">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">Example Question:</span>
              <p className="text-sm font-semibold text-slate-800 italic mt-1">
                &ldquo;Where can I get a better price for my tomatoes today?&rdquo;
              </p>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-teal-100/60">
            <Link
              to="/chat"
              id="action-card-ask-mitra"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-base transition-colors shadow-xs btn-press"
            >
              <Mic className="w-5 h-5" aria-hidden="true" />
              <span>Ask Mitra AI</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
