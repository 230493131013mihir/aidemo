import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, UserPlus, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function GuestModeBanner() {
  const { isGuest, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  // Only show if in guest mode and not authenticated
  if (!isGuest || isAuthenticated || dismissed) {
    return null;
  }

  const messageByLang = {
    gu: '🌾 તમે અતિથિ મોડ (Guest Mode) માં ઉપયોગ કરી રહ્યા છો. તમામ સિમ્યુલેટર, મંડી ભાવ અને સરકારી યોજનાઓ સંપૂર્ણ સક્રિય છે.',
    hi: '🌾 आप अतिथि मोड (Guest Mode) में उपयोग कर रहे हैं। सभी फसल कैलकुलेटर, मंडी भाव और सरकारी योजनाएं पूर्णतः सक्रिय हैं।',
    mr: '🌾 तुम्ही अतिथी मोड (Guest Mode) मध्ये वापरत आहात. सर्व पीक कॅल्क्युलेटर, बाजार भाव आणि सरकारी योजना पूर्णपणे सक्रिय आहेत.',
    en: '🌾 You are exploring in Universal Guest Mode. All simulators, live Mandi rates, and government scheme matchers are fully interactive.'
  };

  const actionByLang = {
    gu: 'ખાતું બનાવો (સેવ કરવા માટે)',
    hi: 'खाता बनाएं (सेव करने हेतु)',
    mr: 'खाते तयार करा (जतन करण्यासाठी)',
    en: 'Create Free Account to Save'
  };

  const msg = messageByLang[language] || messageByLang.en;
  const actionText = actionByLang[language] || actionByLang.en;

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white px-4 py-2.5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs z-30 transition-all">
      <div className="flex items-center gap-2.5 text-center sm:text-left">
        <span className="p-1.5 rounded-lg bg-white/20 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        </span>
        <span className="font-medium leading-tight">
          {msg}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/register"
          className="px-3 py-1.5 rounded-xl bg-white text-emerald-900 font-extrabold hover:bg-emerald-50 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{actionText}</span>
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title="Dismiss"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
