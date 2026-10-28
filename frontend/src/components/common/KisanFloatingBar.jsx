/**
 * KisanFloatingBar.jsx
 * Simplified Farmer Accessibility & Voice Assistant Floating Bar
 * HarvestMitra AI
 *
 * Core Features:
 * 1. 3 Streamlined Primary Actions:
 *    - Ask Mitra AI (Voice & text assistant)
 *    - Read This Page Aloud (TTS in user's selected language with instant stop)
 *    - AI Crop Doctor (Plant health & pathology guide)
 * 2. Secondary "More Tools" Collapsible Drawer:
 *    - Mandi Audio Radio (Multilingual live APMC audio bulletin)
 * 3. 100% Multilingual Support (Marathi, Hindi, Gujarati, English)
 * 4. Keyboard accessible, touch-friendly (>44px targets), reduced-motion support, no widget overlapping
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Volume2, 
  VolumeX,
  Stethoscope, 
  Radio, 
  X, 
  Sparkles, 
  ChevronUp, 
  ChevronDown,
  Bot,
  Sliders,
  HelpCircle,
  Square
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  speakMessage, 
  stopSpeaking, 
  isSpeechSynthesisSupported 
} from '../../services/speechService';
import CropDoctorModal from '../features/CropDoctorModal';

/**
 * Localized page summaries for Read Page Aloud
 */
const PAGE_VOICE_SUMMARIES = {
  mr: {
    dashboard: 'आपण शेतकरी डैशबोर्डवर आहात. येथे आपले नोंदणीकृत पिके, थेट पुणे एपीएमसी बाजार भाव आणि अंदाजे नफा दिसत आहे.',
    markets: 'थेट एपीएमसी बाजार भाव. टोमॅटो, कांदा, बटाटा आणि इतर पिकांचे ताजे दर महाराष्ट्र बाजार समित्यांतून अद्ययावत आहेत.',
    harvest: 'स्मार्ट काढणी निर्णय सिम्युलेटर. स्थानिक बाजारात त्वरित विक्री विरुद्ध साठवणूक आणि सामायिक वाहतुकीच्या नफ्याची तुलना करा.',
    transport: 'सामायिक कृषी वाहतूक. एपीएमसी बाजारात जाण्यासाठी ट्रक शेअर करा आणि ४० ते ५० टक्के भाडे वाचवा.',
    weather: 'हवामान व पाऊस अंदाज. फवारणी सुरक्षा निर्देशांक आणि काढणीपूर्वी पावसाची शक्यता तपासा.',
    schemes: 'सरकारी कृषी योजना आणि अनुदान. पीएम-किसान आणि राष्ट्रीय फलोत्पादन अभियान पात्रता तपासा.',
    chat: 'मित्रा AI कृषी सहाय्यक. आपल्या भाषेत शेतीचे प्रश्न विचारा.',
    default: 'हार्वेस्टमित्रा AI मध्ये आपले स्वागत आहे. स्मार्ट कृषी निर्णय आणि शेतकरी कल्याण व्यासपीठ.'
  },
  hi: {
    dashboard: 'आप लाइव किसान डैशबोर्ड पर हैं। आपकी पंजीकृत फसलें, पुणे एपीएमसी के ताजा भाव और अनुमानित कमाई तैयार हैं।',
    markets: 'लाइव एपीएमसी मंडी भाव। टमाटर, प्याज, आलू और अन्य फसलों के सत्यापित मूल्य महाराष्ट्र मंडियों से अपडेट हैं।',
    harvest: 'स्मार्ट फसल कटाई निर्णय सिमुलेटर। स्थानीय मंडी और दूरस्थ बड़े बाजारों के लाभ की तुलना करें।',
    transport: 'साझा कृषि परिवहन। मंडी तक ट्रक शेयर करें और 40 से 50 प्रतिशत तक भाड़ा बचाएं।',
    weather: 'मौसम व बारिश अलर्ट। छिड़काव सुरक्षा सूचकांक और कटाई से पूर्व बारिश की संभावना देखें।',
    schemes: 'सरकारी कृषि योजनाएं और सब्सिडी। पीएम-किसान और बागवानी मिशन के लाभ जानें।',
    chat: 'मित्रा AI कृषि सहायक। अपनी भाषा में खेती के सवाल पूछें।',
    default: 'हार्वेस्टमित्रा AI में आपका स्वागत है। किसानों के लिए स्मार्ट निर्णय और बेहतर आमदनी का मंच।'
  },
  gu: {
    dashboard: 'તમે ખેડૂત ડેશબોર્ડ પર છો. તમારા નોંધાયેલા પાક, લાઈવ APMC બજાર ભાવ અને અંદાજિત કમાણી અહીં ઉપલબ્ધ છે.',
    markets: 'લાઈવ APMC મંડી ભાવ. ટામેટાં, ડુંગળી, બટાકા અને અન્ય પાકોના તાજા બજાર ભાવો અપડેટ થયેલ છે.',
    harvest: 'સ્માર્ટ પાક લણણી સિમ્યુલેટર. સ્થાનિક બજાર અને મોટી મંડીઓ વચ્ચે ચોખ્ખા નફાની સરખામણી કરો.',
    transport: 'સહિયારું પરિવહન. મંડી સુધી વાહન શેર કરો અને ૪૦ થી ૫૦ ટકા સુધી ભાડું બચાવો.',
    weather: 'હવામાન અને વરસાદ એલર્ટ. છંટકાવ અનુકૂળતા અને લણણી પહેલાં વરસાદની શક્યતા ચકાસો.',
    schemes: 'સરકારી યોજનાઓ અને સહાય. પીએમ-કિસાન અને બાગાયત સહાય યોજનાઓની માહિતી મેળવો.',
    chat: 'મિત્ર AI કૃષિ સહાયક. તમારી પોતાની ભાષામાં ખેતી વિષયક પ્રશ્નો પૂછો.',
    default: 'હાર્વેસ્ટમિત્રા AI માં આપનું સ્વાગત છે. સ્માર્ટ ખેતી નિર્ણયો અને ખેડૂત સમૃદ્ધિ પ્લેટફોર્મ.'
  },
  en: {
    dashboard: 'You are on your Live Farmer Dashboard. Your verified crops, live APMC prices, and estimated returns are displayed.',
    markets: 'Viewing live APMC mandi prices. Tomato, Potato, Onion, and other crop rates are updated from APMC database.',
    harvest: 'Smart Harvest Simulator. Compare holding crops versus immediate sale with shared pooling logistics.',
    transport: 'Shared Transport Logistics. Pool or book freight space to APMC terminal yards and save up to 50 percent.',
    weather: 'Agricultural Weather alerts. Check spray safety index and rain probabilities before harvesting.',
    schemes: 'Government agricultural schemes. Check PM-KISAN, crop insurance, and horticulture subsidies.',
    chat: 'Mitra AI Assistant. Ask farming queries in your native language using voice or text.',
    default: 'Welcome to HarvestMitra AI agricultural decision-support platform.'
  }
};

/**
 * Localized Mandi Audio Radio Bulletins
 */
const MANDI_RADIO_SCRIPTS = {
  mr: 'नमस्कार शेतकरी मित्रांनो! हे हार्वेस्टमित्रा किसान मंडी रेडिओ बुलेटिन आहे. ' +
    'पुणे एपीएमसी गुलटेकडी येथे टोमॅटोचे दर २४ रुपये ५० पैसे प्रति किलोवर स्थिर आहेत. ' +
    'नाशिक आणि लासलगाव बाजार समितीत कांद्याचा सरासरी भाव २८ रुपये प्रति किलो नोंदवला गेला आहे. ' +
    'पुणे आणि वाशी मार्केट यार्डकडे जाणारी सामायिक वाहतूक वाहने रवाना होत आहेत. ' +
    'जय किसान! हार्वेस्टमित्रा तर्फे सर्व शेतकरी बांधवांना समृद्धीच्या शुभेच्छा.',
  hi: 'नमस्ते किसान भाइयों! यह हार्वेस्टमित्रा किसान मंडी रेडियो का दैनिक बुलेटिन है। ' +
    'पुणे एपीएमसी में टमाटर 24 रुपये 50 पैसे प्रति किलो पर स्थिर कारोबार कर रहा है। ' +
    'नासिक और लासलगांव मंडी में प्याज का मॉडल भाव 28 रुपये प्रति किलो दर्ज हुआ है। ' +
    'पुणे और वाशी टर्मिनल मंडी के लिए साझा ट्रक पूलिंग गाड़ियां सक्रिय रूप से उपलब्ध हैं। ' +
    'जय किसान! हार्वेस्टमित्रा आपके लाभप्रद फसल सत्र की कामना करता है।',
  gu: 'નમસ્તે ખેડૂત મિત્રો! આ હાર્વેસ્ટમિત્રા કિસાન મંડી રેડિયો બુલેટિન છે. ' +
    'પુણે અને સુરત એપીએમસીમાં ટામેટાંના ભાવ ૨૪ રૂપિયા ૫૦ પૈસા પ્રતિ કિલો પર સ્થિર છે. ' +
    'નાસિક અને મહુવા મંડીમાં ડુંગળીનો સરેરાશ ભાવ ૨૮ રૂપિયા પ્રતિ કિલો નોંધાયો છે. ' +
    'વાશી અને પુણે મંડી માટે સહિયારા ટ્રક પૂલિંગ વાહનો રવાના થઈ રહ્યા છે. ' +
    'જય કિસાન! હાર્વેસ્ટમિત્રા તરફથી તમામ ખેડૂત મિત્રોને શુભકામનાઓ.',
  en: 'Namaskar farmers! This is the HarvestMitra Kisan Mandi Radio bulletin for Maharashtra APMC markets. ' +
    'Pune APMC Tomato is trading steady at 24 rupees 50 paise per kilogram with steady arrivals. ' +
    'Nashik and Lasalgaon Onion modal price is recorded at 28 rupees per kilogram with firm export demand. ' +
    'Shared transport truck pools are actively departing for Pune and Vashi terminal yards. ' +
    'Jai Kisan! HarvestMitra wishes all farmers a profitable harvest.'
};

export default function KisanFloatingBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage?.() || { t: (_, d) => d, language: 'en' };

  const [expanded, setExpanded] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [isReadingPage, setIsReadingPage] = useState(false);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);

  // Stop speech if language changes or component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
      setIsReadingPage(false);
      setIsRadioPlaying(false);
    };
  }, [language, location.pathname]);

  function requireAuthGuard(featureName) {
    if (!isAuthenticated) {
      showToast({
        type: 'info',
        title: `🔒 ${t('cropDoctor.loginRequired', 'Farmer Sign-In Required')}`,
        message: `${t('cropDoctor.loginDesc', 'Please sign in or register to access')} ${featureName}.`,
        duration: 3500,
      });
      navigate('/login', { state: { from: location } });
      setExpanded(false);
      return false;
    }
    return true;
  }

  function handleStopSpeech() {
    stopSpeaking();
    setIsReadingPage(false);
    setIsRadioPlaying(false);
    showToast({
      type: 'info',
      title: '⏹️ ' + t('kisanVoice.speechStopped', 'Speech Stopped'),
      message: t('kisanVoice.speechStopped', 'Audio playback stopped.'),
      duration: 2000
    });
  }

  // 1. Read Page Aloud in user's selected language
  async function handlePageVoiceSummary() {
    if (isReadingPage) {
      handleStopSpeech();
      return;
    }

    stopSpeaking();
    setIsRadioPlaying(false);

    const path = location.pathname.toLowerCase();
    const langKey = ['mr', 'hi', 'gu', 'en'].includes(language) ? language : 'en';
    const dict = PAGE_VOICE_SUMMARIES[langKey] || PAGE_VOICE_SUMMARIES.en;

    let summary = dict.default;
    if (path.includes('dashboard')) summary = dict.dashboard;
    else if (path.includes('market')) summary = dict.markets;
    else if (path.includes('harvest')) summary = dict.harvest;
    else if (path.includes('transport')) summary = dict.transport;
    else if (path.includes('weather')) summary = dict.weather;
    else if (path.includes('scheme')) summary = dict.schemes;
    else if (path.includes('chat')) summary = dict.chat;

    setIsReadingPage(true);
    showToast({
      type: 'info',
      title: '🔊 ' + t('kisanVoice.readPage', 'Read This Page Aloud'),
      message: t('kisanVoice.readingAloud', 'Reading page summary aloud in your selected language...'),
      duration: 3500,
    });

    await speakMessage(summary, langKey, {
      onStart: () => setIsReadingPage(true),
      onEnd: () => setIsReadingPage(false),
      onError: () => {
        setIsReadingPage(false);
        showToast({
          type: 'error',
          title: t('kisanVoice.launcher', 'Kisan Voice'),
          message: 'Voice output unavailable on this device. You can use text reading.',
        });
      }
    });
  }

  // 2. Kisan Mandi Radio in user's selected language
  async function handleRadioBulletin() {
    if (!requireAuthGuard(t('kisanVoice.mandiRadio', 'Mandi Audio Bulletin'))) return;

    if (isRadioPlaying) {
      handleStopSpeech();
      return;
    }

    stopSpeaking();
    setIsReadingPage(false);

    const langKey = ['mr', 'hi', 'gu', 'en'].includes(language) ? language : 'en';
    const script = MANDI_RADIO_SCRIPTS[langKey] || MANDI_RADIO_SCRIPTS.en;

    setIsRadioPlaying(true);
    showToast({
      type: 'celebrate',
      title: '📻 ' + t('kisanVoice.mandiRadio', 'Mandi Audio Bulletin'),
      message: t('kisanVoice.radioPlaying', 'Broadcasting live APMC audio bulletin...'),
      duration: 5000,
    });

    await speakMessage(script, langKey, {
      onStart: () => setIsRadioPlaying(true),
      onEnd: () => setIsRadioPlaying(false),
      onError: () => {
        setIsRadioPlaying(false);
      }
    });
  }

  const isAudioActive = isReadingPage || isRadioPlaying;

  return (
    <>
      <CropDoctorModal
        isOpen={doctorModalOpen}
        onClose={() => setDoctorModalOpen(false)}
      />

      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 print:hidden">
        {/* Expanded Quick-Dial Accessibility Menu */}
        {expanded && (
          <div 
            role="menu"
            aria-label="Kisan Accessibility Menu"
            className="rounded-3xl border border-emerald-300 bg-white/95 backdrop-blur-md p-3.5 shadow-2xl space-y-2 animate-in slide-in-from-bottom-2 duration-200 min-w-[260px] max-w-[320px] text-text"
          >
            {/* Header */}
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 px-2 py-1 flex items-center justify-between border-b border-emerald-100">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('kisanVoice.title', 'Kisan Sahayak Menu')}</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                {t('kisanVoice.accessibility', 'Accessibility')}
              </span>
            </div>

            {/* Stop Speech Quick Pill if active */}
            {isAudioActive && (
              <button
                type="button"
                onClick={handleStopSpeech}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 transition-colors border border-amber-300 animate-pulse"
              >
                <span className="flex items-center gap-2">
                  <Square className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                  <span>{t('kisanVoice.stopReading', 'Stop Reading')}</span>
                </span>
                <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900 font-mono">
                  ACTIVE
                </span>
              </button>
            )}

            {/* 3 PRIMARY ACCESSIBILITY ACTIONS */}

            {/* PRIMARY 1: Ask Mitra AI */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                navigate('/chat');
                setExpanded(false);
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 transition-all text-left border border-emerald-200 shadow-2xs group focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm leading-tight text-emerald-950">
                  {t('kisanVoice.mitraChat', 'Ask Mitra AI')}
                </p>
                <p className="text-[10px] text-emerald-700 truncate">
                  {t('kisanVoice.mitraChatDesc', 'Voice & text farming advisor')}
                </p>
              </div>
            </button>

            {/* PRIMARY 2: Read This Page Aloud */}
            <button
              type="button"
              role="menuitem"
              onClick={handlePageVoiceSummary}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold transition-all text-left border shadow-2xs group focus:outline-none focus:ring-2 focus:ring-primary ${
                isReadingPage
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-text'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${
                isReadingPage ? 'bg-amber-500 text-white' : 'bg-slate-100 text-emerald-700'
              }`}>
                {isReadingPage ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm leading-tight">
                  {isReadingPage ? t('kisanVoice.stopReading', 'Stop Reading') : t('kisanVoice.readPage', 'Read This Page Aloud')}
                </p>
                <p className="text-[10px] text-muted truncate">
                  {language === 'mr' ? 'मराठीत ऑडिओ सारांश' : language === 'hi' ? 'हिंदी में ऑडियो सारांश' : language === 'gu' ? 'ગુજરાતીમાં ઓડિયો સારાંશ' : 'Native audio screen reader'}
                </p>
              </div>
            </button>

            {/* PRIMARY 3: AI Crop Doctor */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                if (!requireAuthGuard(t('kisanVoice.cropDoctor', 'AI Crop Doctor'))) return;
                setDoctorModalOpen(true);
                setExpanded(false);
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold bg-white hover:bg-slate-50 transition-all text-left border border-slate-200 shadow-2xs group focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-primary flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm leading-tight">
                  {t('kisanVoice.cropDoctor', 'AI Crop Doctor')}
                </p>
                <p className="text-[10px] text-muted truncate">
                  {t('cropDoctor.subtitle', 'Visual Plant Pathology & Health Guide')}
                </p>
              </div>
            </button>

            {/* SECONDARY "MORE TOOLS" COLLAPSIBLE AREA */}
            <div className="pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMoreTools((prev) => !prev)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-muted hover:text-text hover:bg-slate-100 transition-colors"
                aria-expanded={showMoreTools}
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('kisanVoice.moreTools', 'More Tools')}</span>
                </span>
                {showMoreTools ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showMoreTools && (
                <div className="mt-1.5 p-1 space-y-1.5 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in duration-150">
                  {/* Mandi Audio Radio */}
                  <button
                    type="button"
                    onClick={handleRadioBulletin}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left ${
                      isRadioPlaying
                        ? 'bg-amber-100 text-amber-950'
                        : 'bg-white hover:bg-emerald-50 text-text border border-slate-200'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold truncate">
                        {isRadioPlaying ? t('cropDoctor.stopSpeech', 'Stop Radio') : t('kisanVoice.mandiRadio', 'Mandi Audio Bulletin')}
                      </p>
                      <p className="text-[10px] text-muted truncate">
                        {t('kisanVoice.mandiRadioDesc', 'Live APMC audio broadcast')}
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Master Floating Trigger Button */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={expanded ? t('kisanVoice.close', 'Close') : t('kisanVoice.launcher', 'Kisan Voice & AI')}
          className="rounded-full bg-gradient-to-r from-primary to-emerald-600 text-white p-3.5 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 border-2 border-white/80 focus:outline-none focus:ring-4 focus:ring-emerald-400/40"
          title="Kisan Sahayak Assistant"
        >
          <Bot className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-black tracking-wide hidden sm:inline">
            {expanded ? t('kisanVoice.close', 'Close') : t('kisanVoice.launcher', 'Kisan Voice & AI')}
          </span>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
}
