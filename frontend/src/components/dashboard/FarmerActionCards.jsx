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
        {/* CARD 1: Check Market Prices */}
        <div className="farmer-action-card border-emerald-200/80 bg-white hover:border-emerald-500">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
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
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
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

          <div className="pt-4 mt-2 border-t border-slate-100">
            <Link
              to="/markets"
              id="action-card-view-prices"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base transition-colors shadow-xs"
            >
              <span>View Prices</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* CARD 2: Where Should I Sell? */}
        <div className="farmer-action-card border-blue-200/80 bg-white hover:border-blue-500">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
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
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
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

          <div className="pt-4 mt-2 border-t border-slate-100">
            <Link
              to="/harvest"
              id="action-card-compare-mandis"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-base transition-colors shadow-xs"
            >
              <span>Compare Mandis</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* CARD 3: Find Transport */}
        <div className="farmer-action-card border-amber-200/80 bg-white hover:border-amber-500">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
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
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="farmer-subtext block text-slate-500">Available Corridor</span>
                <span className="font-bold text-base text-slate-900 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Farm to {marketName}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 block">
                  ~40% Shared Savings
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">Verified Drivers</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            <Link
              to="/transport"
              id="action-card-find-transport"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-base transition-colors shadow-xs"
            >
              <span>Find Transport</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* CARD 4: Ask Mitra AI */}
        <div className="farmer-action-card border-purple-200/80 bg-white hover:border-purple-500">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Bot className="w-6 h-6 text-purple-700" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold">
                <Mic className="w-3.5 h-3.5 text-purple-600" />
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
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">Example Question:</span>
              <p className="text-sm font-semibold text-slate-800 italic mt-1">
                &ldquo;Where can I get a better price for my tomatoes today?&rdquo;
              </p>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            <Link
              to="/chat"
              id="action-card-ask-mitra"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-base transition-colors shadow-xs"
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
