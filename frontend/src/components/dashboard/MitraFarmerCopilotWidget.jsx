import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  Mic, 
  MicOff,
  TrendingUp, 
  Calculator, 
  Truck, 
  ShieldCheck, 
  CloudSun, 
  Stethoscope, 
  Landmark,
  Send,
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  startRecognition, 
  stopRecognition, 
  isSpeechRecognitionSupported 
} from '../../services/speechService';

const COPILOT_QUESTIONS = [
  {
    id: 'sell-smart',
    icon: TrendingUp,
    accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-400/40 text-emerald-200',
    iconColor: 'text-emerald-300',
    queries: {
      mr: 'माझे पीक मी कुठे विकावे?',
      en: 'Where should I sell my crop?',
      hi: 'मैं अपनी फसल कहाँ बेचूँ?',
      gu: 'મારું પાક હું ક્યાં વેચું?'
    },
    subtext: {
      mr: 'थेट APMC भाव व निव्वळ नफा तुलना',
      en: 'Compare Mandis & Net Realization',
      hi: 'मंडी भाव व शुद्ध लाभ तुलना',
      gu: 'બજાર ભાવ અને નફાની સરખામણી'
    }
  },
  {
    id: 'calc-profit',
    icon: Calculator,
    accent: 'from-amber-500/20 to-orange-500/10 border-amber-400/40 text-amber-200',
    iconColor: 'text-amber-300',
    queries: {
      mr: 'माझा अंदाजित नफा मोजा.',
      en: 'Calculate my estimated profit.',
      hi: 'मेरा अनुमानित मुनाफा कैलकुलेट करें।',
      gu: 'મારો અંદાજિત નફો ગણો.'
    },
    subtext: {
      mr: 'वाहतूक खर्च वजा करून निव्वळ नफा',
      en: 'Deduct freight & calculate net return',
      hi: 'भाड़ा घटाकर शुद्ध लाभ गणना',
      gu: 'પરિવહન ખર્ચ બાદ કરી ચોખ્ખો નફો'
    }
  },
  {
    id: 'find-transport',
    icon: Truck,
    accent: 'from-blue-500/20 to-indigo-500/10 border-blue-400/40 text-blue-200',
    iconColor: 'text-blue-300',
    queries: {
      mr: 'माझ्या शेतीमालासाठी वाहतूक शोधा.',
      en: 'Find transport for my harvest.',
      hi: 'मेरी फसल के लिए ट्रांसपोर्ट खोजें।',
      gu: 'મારા પાક માટે પરિવહન શોધો.'
    },
    subtext: {
      mr: 'नोंदणीकृत सामायिक वाहने व भाडे',
      en: 'Verified vehicles & shared pooling fares',
      hi: 'सत्यापित वाहन व साझा भाड़ा',
      gu: 'ચકાસાયેલ વાહન અને શૅર્ડ ભાડું'
    }
  },
  {
    id: 'booking-status',
    icon: ShieldCheck,
    accent: 'from-purple-500/20 to-pink-500/10 border-purple-400/40 text-purple-200',
    iconColor: 'text-purple-300',
    queries: {
      mr: 'माझ्या बुकिंगची सद्यस्थिती तपासा.',
      en: 'Check my booking status.',
      hi: 'मेरी बुकिंग का स्टेटस चेक करें।',
      gu: 'મારી બુકિંગ સ્થિતિ તપાસો.'
    },
    subtext: {
      mr: 'वाहतूकदार स्वीकृती व खरेदी ऑफर्स',
      en: 'Transporter acceptance & buyer offers',
      hi: 'ट्रांसपोर्टर स्वीकृति व खरीद प्रस्ताव',
      gu: 'ટ્રાન્સપોર્ટર સ્વીકૃતિ અને ઑફર્સ'
    }
  },
  {
    id: 'weather-risk',
    icon: CloudSun,
    accent: 'from-sky-500/20 to-cyan-500/10 border-sky-400/40 text-sky-200',
    iconColor: 'text-sky-300',
    queries: {
      mr: 'हवामानाचा धोका काय आहे?',
      en: 'What is the weather risk?',
      hi: 'मौसम का क्या जोखिम है?',
      gu: 'હવામાનનું જોખમ શું છે?'
    },
    subtext: {
      mr: 'पावसाचा अंदाज व सुरक्षित काढणी',
      en: 'Precipitation probability & harvest safety',
      hi: 'बारिश पूर्वानुमान व सुरक्षित कटाई',
      gu: 'વરસાદની આગાહી અને સુરક્ષિત કાપણી'
    }
  },
  {
    id: 'crop-problem',
    icon: Stethoscope,
    accent: 'from-rose-500/20 to-red-500/10 border-rose-400/40 text-rose-200',
    iconColor: 'text-rose-300',
    queries: {
      mr: 'पिकावरील रोगाची किंवा समस्येची माहिती द्या.',
      en: 'Help me understand a crop problem.',
      hi: 'फसल की समस्या और बीमारी समझने में मदद करें।',
      gu: 'પાકના રોગ અને સમસ્યા વિશે જણાવો.'
    },
    subtext: {
      mr: 'जैविक व प्रमाणित रासायनिक उपाय',
      en: 'Organic remedies & certified treatments',
      hi: 'जैविक व प्रमाणित रासायनिक उपचार',
      gu: 'જૈવિક અને પ્રમાણિત રાસાયણિક ઉપાય'
    }
  },
  {
    id: 'govt-scheme',
    icon: Landmark,
    accent: 'from-emerald-600/20 to-amber-600/10 border-emerald-400/40 text-emerald-200',
    iconColor: 'text-amber-300',
    queries: {
      mr: 'माझ्यासाठी उपयुक्त सरकारी योजना शोधा.',
      en: 'Find a relevant government scheme.',
      hi: 'मेरे लिए उपयुक्त सरकारी योजना खोजें।',
      gu: 'મારા માટે યોગ્ય સરકારી યોજના શોધો.'
    },
    subtext: {
      mr: 'पीएम-किसान, पीक विमा व सिंचन अनुदान',
      en: 'PM-KISAN, crop insurance & subsidies',
      hi: 'पीएम-किसान, फसल बीमा व सिंचाई अनुदान',
      gu: 'પીએમ કિસાન, પાક વીમો અને સબસિડી'
    }
  }
];

export default function MitraFarmerCopilotWidget() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [customQuery, setCustomQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimVoice, setInterimVoice] = useState('');
  const [voiceError, setVoiceError] = useState(null);

  const activeLang = language || 'mr';

  const handleOpenQuery = (queryText) => {
    if (!queryText || !queryText.trim()) return;
    navigate(`/chat?prompt=${encodeURIComponent(queryText.trim())}`);
  };

  const handleVoiceToggle = () => {
    setVoiceError(null);
    if (isListening) {
      stopRecognition();
      setIsListening(false);
      setInterimVoice('');
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setVoiceError(activeLang === 'mr' ? 'या ब्राऊजरमध्ये व्हॉईस सपोर्ट उपलब्ध नाही.' : 'Voice input not supported in this browser.');
      return;
    }

    setIsListening(true);
    setInterimVoice('');

    startRecognition({
      language: activeLang,
      continuous: false,
      onStart: () => setIsListening(true),
      onInterimResult: (text) => setInterimVoice(text),
      onFinalResult: (finalText) => {
        setIsListening(false);
        setInterimVoice('');
        if (finalText && finalText.trim()) {
          handleOpenQuery(finalText.trim());
        }
      },
      onError: (err) => {
        setIsListening(false);
        setInterimVoice('');
        if (err?.code !== 'aborted') {
          setVoiceError(err?.message || 'Voice input error.');
        }
      },
      onEnd: () => {
        setIsListening(false);
        setInterimVoice('');
      }
    });
  };

  return (
    <section 
      aria-label="Mitra AI Farmer Copilot"
      className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-600/40 text-white transition-all duration-300 hover:border-emerald-500/60"
    >
      {/* Background Photographic Image & Gradients */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url('/images/dashboard-hero.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/96 via-emerald-950/90 to-teal-950/85 backdrop-blur-[1px]" />
      <div className="absolute inset-0 bg-radial-at-t from-emerald-400/15 via-transparent to-black/50 pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 p-5 sm:p-7 space-y-6">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 border border-emerald-300/40">
              <Bot className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
                  Mitra AI Farmer Copilot
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Action Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200/90 font-medium mt-0.5">
                {activeLang === 'mr' 
                  ? 'शेतकरी मित्र: विचारणा करा → प्रत्यक्ष डेटा पडताळणी → सोपा हिशोब → त्वरित कृती पर्याय.' 
                  : 'Ask → Check Real Mandi Data → Simple Profit & Logistics Calculation → One-Click Action.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-300 border border-emerald-400/30 text-xs font-bold backdrop-blur-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>4 Languages & Voice</span>
            </span>
          </div>
        </div>

        {/* Integrated Quick-Ask Console (Voice + Text) */}
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-2.5 sm:p-3 backdrop-blur-md shadow-inner flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={isListening ? (interimVoice || 'Listening / ऐकत आहे...') : customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleOpenQuery(customQuery);
              }}
              placeholder={
                activeLang === 'mr'
                  ? 'येथे प्रश्न विचारा (उदा. ५०० किलो टोमॅटो कुठे विकू? किंवा नफा मोजा)...'
                  : 'Ask Mitra Copilot (e.g., Where should I sell my crop? Calculate profit)...'
              }
              className={`w-full bg-slate-950/60 text-white placeholder-slate-400 text-xs sm:text-sm rounded-xl px-4 py-2.5 border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400/50 ${
                isListening ? 'border-amber-400 animate-pulse text-amber-200' : 'border-white/10'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                isListening
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 animate-bounce'
                  : 'bg-emerald-600/80 hover:bg-emerald-500 text-white border border-emerald-400/40'
              }`}
              title="Voice Input (बोलून विचारा)"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-300" />}
              <span>{isListening ? (activeLang === 'mr' ? 'थांबवा' : 'Stop') : (activeLang === 'mr' ? 'बोला' : 'Voice')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenQuery(customQuery)}
              disabled={!customQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              <span>{activeLang === 'mr' ? 'विचारा' : 'Ask'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {voiceError && (
          <p className="text-xs text-amber-300 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-xl">
            ⚠️ {voiceError}
          </p>
        )}

        {/* 7 Core Suggested Question Pills (Large, readable, 1-click action) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-300/90 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{activeLang === 'mr' ? 'महत्त्वाचे शेतकरी प्रश्न (एका क्लिकवर कृती):' : 'Key Suggested Questions (One-Click Action):'}</span>
            </p>
            <span className="text-[11px] text-slate-400 font-medium">
              {activeLang === 'mr' ? 'कोणत्याही पर्यायावर क्लिक करा' : 'Click any question to launch'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
            {COPILOT_QUESTIONS.map((item) => {
              const IconComponent = item.icon;
              const question = item.queries[activeLang] || item.queries.en;
              const subtext = item.subtext[activeLang] || item.subtext.en;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenQuery(question)}
                  className={`text-left p-3.5 rounded-2xl bg-gradient-to-br ${item.accent} border backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95 group flex flex-col justify-between space-y-2 cursor-pointer`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-8 h-8 rounded-xl bg-slate-950/50 border border-white/10 flex items-center justify-center shrink-0 ${item.iconColor}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-white leading-snug group-hover:text-emerald-200 transition-colors">
                      {question}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-medium mt-1">
                      {subtext}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
