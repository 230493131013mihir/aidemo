import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Calculator, 
  Truck, 
  Bot, 
  ArrowRight, 
  ShieldCheck, 
  Scale, 
  Mic,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerActionCards() {
  const { language } = useLanguage();

  const cards = [
    {
      id: 'action-card-view-prices',
      to: '/markets',
      title: language === 'mr' ? 'बाजार भाव' 
           : language === 'hi' ? 'मंडी भाव' 
           : language === 'gu' ? 'બજાર ભાવ' 
           : 'Market Prices',
      badge: language === 'mr' ? 'थेट APMC' 
           : language === 'hi' ? 'लाइव APMC' 
           : language === 'gu' ? 'લાઈવ APMC' 
           : 'Live APMC Rates',
      subtitle: language === 'mr' ? 'दैनिक कृषी उत्पन्न बाजार समिती दर, चढ-उतार आणि कल पहा.' 
              : language === 'hi' ? 'दैनिक APMC मंडी दर, मूल्य रुझान और तेजी-मंदी देखें।' 
              : language === 'gu' ? 'દૈનિક APMC બજાર ભાવ, ભાવમાં ફેરફાર અને વલણો જુઓ.' 
              : 'Browse real-time APMC mandi prices and commodity trends.',
      actionText: language === 'mr' ? 'दर पहा' 
                : language === 'hi' ? 'भाव देखें' 
                : language === 'gu' ? 'ભાવ જુઓ' 
                : 'View Prices',
      icon: TrendingUp,
      badgeIcon: ShieldCheck,
      color: {
        border: 'border-emerald-200/90 hover:border-emerald-500',
        bg: 'bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20',
        iconBg: 'bg-emerald-100 text-emerald-800',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        badgeIconColor: 'text-emerald-600',
        textAccent: 'text-emerald-700',
        focusRing: 'focus-visible:ring-emerald-500',
        arrowColor: 'text-emerald-700'
      }
    },
    {
      id: 'action-card-compare-mandis',
      to: '/harvest',
      title: language === 'mr' ? 'सर्वोत्तम बाजार शोधा' 
           : language === 'hi' ? 'सर्वोत्तम मंडी खोजें' 
           : language === 'gu' ? 'શ્રેષ્ઠ માર્કેટ શોધો' 
           : 'Find Best Mandi',
      badge: language === 'mr' ? 'नफा कॅल्क्युलेटर' 
           : language === 'hi' ? 'मुनाफा कैलकुलेटर' 
           : language === 'gu' ? 'નફો કેલ્ક્યુલેટર' 
           : 'Net Profit Analyzer',
      subtitle: language === 'mr' ? 'वाहतूक खर्च वजा जाता कमाल नफा मिळवण्यासाठी बाजार समित्यांची तुलना करा.' 
              : language === 'hi' ? 'परिवहन और शुल्क घटाकर अधिकतम शुद्ध आय के लिए मंडियों की तुलना करें।' 
              : language === 'gu' ? 'વાહનવ્યવહાર ખર્ચ બાદ કરી મહત્તમ નફો મેળવવા બજારોની સરખામણી કરો.' 
              : 'Compare regional mandis to maximize take-home earnings after freight.',
      actionText: language === 'mr' ? 'तुलना करा' 
                : language === 'hi' ? 'तुलना करें' 
                : language === 'gu' ? 'સરખામણી કરો' 
                : 'Compare Mandis',
      icon: Calculator,
      badgeIcon: Scale,
      color: {
        border: 'border-blue-200/90 hover:border-blue-500',
        bg: 'bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20',
        iconBg: 'bg-blue-100 text-blue-800',
        badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
        badgeIconColor: 'text-blue-600',
        textAccent: 'text-blue-700',
        focusRing: 'focus-visible:ring-blue-500',
        arrowColor: 'text-blue-700'
      }
    },
    {
      id: 'action-card-find-transport',
      to: '/transport',
      title: language === 'mr' ? 'वाहतूक शोधा' 
           : language === 'hi' ? 'परिवहन खोजें' 
           : language === 'gu' ? 'પરિવહન શોધો' 
           : 'Find Transport',
      badge: language === 'mr' ? 'शेअर्ड बचत' 
           : language === 'hi' ? 'साझा बचत' 
           : language === 'gu' ? 'શેર્ડ બચત' 
           : 'Shared Pooling',
      subtitle: language === 'mr' ? 'सत्यापित वाहने बुक करा आणि शेअर्ड वाहतुकीने ५०% पर्यंत बचत करा.' 
              : language === 'hi' ? 'सत्यापित ट्रक बुक करें और साझा माल ढुलाई से 50% तक बचत करें।' 
              : language === 'gu' ? 'ચકાસાયેલ વાહનો બુક કરો અને શેર્ડ ભાડા દ્વારા 50% સુધી બચત કરો.' 
              : 'Book verified trucks with shared capacity pooling to cut freight costs.',
      actionText: language === 'mr' ? 'वाहतूक बुक करा' 
                : language === 'hi' ? 'परिवहन बुक करें' 
                : language === 'gu' ? 'પરિવહન બુક કરો' 
                : 'Find Transport',
      icon: Truck,
      badgeIcon: ShieldCheck,
      color: {
        border: 'border-amber-200/90 hover:border-amber-500',
        bg: 'bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20',
        iconBg: 'bg-amber-100 text-amber-900',
        badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
        badgeIconColor: 'text-amber-700',
        textAccent: 'text-amber-800',
        focusRing: 'focus-visible:ring-amber-500',
        arrowColor: 'text-amber-700'
      }
    },
    {
      id: 'action-card-ask-mitra',
      to: '/chat',
      title: language === 'mr' ? 'मित्रा AI ला विचारा' 
           : language === 'hi' ? 'मित्रा AI से पूछें' 
           : language === 'gu' ? 'મિત્રા AI ને પૂછો' 
           : 'Ask Mitra AI',
      badge: language === 'mr' ? 'आवाज व मजकूर' 
           : language === 'hi' ? 'आवाज़ और टेक्स्ट' 
           : language === 'gu' ? 'અવાજ અને લખાણ' 
           : 'Voice & Text AI',
      subtitle: language === 'mr' ? 'पिके, हवामान आणि रोगांबद्दल आपल्या भाषेत तत्काळ सल्ला मिळवा.' 
              : language === 'hi' ? 'फसलों, मौसम और बीमारियों के बारे में अपनी भाषा में सलाह पाएं।' 
              : language === 'gu' ? 'પાક, હવામાન અને રોગો અંગે તમારી ભાષામાં સલાહ મેળવો.' 
              : 'Voice & text guidance in your language for prices, crops and advisory.',
      actionText: language === 'mr' ? 'मित्राला विचारा' 
                : language === 'hi' ? 'मित्रा से पूछें' 
                : language === 'gu' ? 'મિત્રાને પૂછો' 
                : 'Ask Mitra AI',
      icon: Bot,
      badgeIcon: Mic,
      color: {
        border: 'border-teal-200/90 hover:border-teal-500',
        bg: 'bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/20',
        iconBg: 'bg-teal-100 text-teal-800',
        badgeBg: 'bg-teal-50 text-teal-900 border-teal-200',
        badgeIconColor: 'text-teal-600',
        textAccent: 'text-teal-700',
        focusRing: 'focus-visible:ring-teal-500',
        arrowColor: 'text-teal-700'
      }
    }
  ];

  return (
    <section aria-label="Main Farmer Actions" className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div>
          <h2 className="farmer-section-heading">
            {language === 'mr' ? 'महत्त्वाच्या कृती' : language === 'hi' ? 'मुख्य कार्य' : language === 'gu' ? 'મુખ્ય કાર્યો' : 'What would you like to do?'}
          </h2>
          <p className="farmer-subtext mt-0.5 text-xs sm:text-sm text-slate-500">
            {language === 'mr' 
              ? 'आपल्या पिकासाठी सर्वोत्तम दर, वाहतूक आणि सल्ला मिळवण्यासाठी खालील पर्यायांवर क्लिक करा' 
              : language === 'hi' 
              ? 'अपनी फसल के लिए सर्वोत्तम दाम, परिवहन और सलाह पाने के लिए नीचे क्लिक करें'
              : 'Click any card below to navigate directly to market prices, mandi comparison, transport, or AI assistance'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {cards.map((card, idx) => {
          const IconComponent = card.icon;
          const BadgeIcon = card.badgeIcon;
          return (
            <Link
              key={card.id}
              to={card.to}
              id={card.id}
              role="link"
              tabIndex={0}
              aria-label={`${card.title} - ${card.subtitle}`}
              className={`farmer-action-card group cursor-pointer block p-5 rounded-2xl border transition-all duration-200 card-hover-elevate shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 no-underline select-none animate-fade-slide-up animate-stagger-${idx + 1} ${card.color.border} ${card.color.bg} ${card.color.focusRing}`}
            >
              <div className="flex flex-col justify-between h-full space-y-4">
                {/* Top Row: Icon + Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-xs transition-transform duration-200 group-hover:scale-105 ${card.color.iconBg}`}>
                    <IconComponent className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${card.color.badgeBg}`}>
                    <BadgeIcon className={`w-3.5 h-3.5 ${card.color.badgeIconColor}`} aria-hidden="true" />
                    <span>{card.badge}</span>
                  </span>
                </div>

                {/* Middle: Title & Subtitle */}
                <div className="space-y-1.5 flex-1">
                  <h3 className="farmer-card-heading text-slate-900 group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{card.title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>

                {/* Bottom: Visual Action Link Indicator (Entire card is clickable Link) */}
                <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className={`${card.color.textAccent}`}>
                    {card.actionText}
                  </span>
                  <div className={`flex items-center gap-1 ${card.color.arrowColor} transition-transform duration-200 group-hover:translate-x-1.5`}>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
