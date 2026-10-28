/**
 * ChatWindow.jsx
 * Mitra Assistant Multilingual Voice Chatbot UI
 * Supports Text + Voice (STT & TTS) for English, Hindi, Gujarati, Marathi
 * HarvestMitra AI - ISSUE-10
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  X,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import VoiceControls from './VoiceControls';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import KisanAIAssistant from './KisanAIAssistant';
import {
  SUPPORTED_LANGUAGES,
  speakMessage,
  stopSpeaking,
  isCurrentlySpeaking,
  isSpeechSynthesisSupported
} from '../../services/speechService';
import { sendChatMessage, getOrCreateSessionId } from '../../services/chatService';
import { useLanguage } from '../../context/LanguageContext';

const WELCOME_MESSAGES = {
  mr: {
    text: "नमस्कार! मी मित्रा असिस्टंट (Mitra Assistant) आहे. आपण मला महाराष्ट्र कृषी उत्पन्न बाजार समिती (APMC) बाजार भाव, आज पिकाची विक्री करावी की थांबावे, सामायिक वाहतूक (भाडे बचत), किंवा हवामानाचा अंदाज विचारू शकता.",
    disclaimer: "बाजार भाव आणि आकडेवारी महाराष्ट्र APMC डेटावर आधारित आहे."
  },
  hi: {
    text: "नमस्ते! मैं मित्रा असिस्टेंट (Mitra Assistant) हूं। आप मुझसे महाराष्ट्र व गुजरात मंडी भाव, आज फसल बेचें या रुकें, साझा परिवहन (भाड़ा बचत), या मौसम की जानकारी पूछ सकते हैं।",
    disclaimer: "मंडी के आंकड़े सत्यापित APMC डेटा पर आधारित हैं।"
  },
  gu: {
    text: "નમસ્તે! હું મિત્રા આસિસ્ટન્ટ (Mitra Assistant) છું. તમે મને એપીએમસી (APMC) બજાર ભાવ, આજે પાક વેચવો કે રાહ જોવી, શૅર્ડ ટ્રાન્સપોર્ટ (ભાડા બચત), અથવા હવામાન આગાહી પૂછી શકો છો.",
    disclaimer: "બજાર ભાવ અને આંકડા ગુજરાત/મહારાષ્ટ્ર APMC ડેટા પર આધારિત છે."
  },
  en: {
    text: "Namaste! I am Mitra Assistant. Ask me about Maharashtra & Gujarat APMC Mandi prices, whether you should sell today or hold, shared transport pooling, or weather forecasts.",
    disclaimer: "Mandi prices and forecasts are benchmarked to official APMC live records."
  }
};

const SUGGESTED_QUERIES = {
  mr: [
    "माझ्या टोमॅटोसाठी चांगला भाव कुठे मिळेल?",
    "हवामानाचा माझ्या काढणीवर काय परिणाम होईल?",
    "मला किती वाहतूक क्षमता (गाडी) लागेल?",
    "माझ्या अंदाजे नफ्याची गणना करा",
    "पीएम-किसान (PM-KISAN) योजना पात्रता व लाभ"
  ],
  hi: [
    "मुझे टमाटर का बेहतर भाव कहां मिलेगा?",
    "क्या मौसम मेरी कटाई को प्रभावित करेगा?",
    "मुझे कितनी परिवहन क्षमता की आवश्यकता है?",
    "मेरी अनुमानित कमाई की गणना करें",
    "पीएम-किसान (PM-KISAN) योजना पात्रता एवं लाभ"
  ],
  gu: [
    "મારા ટામેટાં માટે સારો ભાવ ક્યાં મળશે?",
    "શું હવામાન મારી લણણીને અસર કરશે?",
    "મને કેટલી વાહન ક્ષમતાની જરૂર પડશે?",
    "મારી અંદાજિત કમાણીની ગણતરી કરો",
    "પીએમ-કિસાન (PM-KISAN) યોજનાની પાત્રતા"
  ],
  en: [
    "Where can I get a better price for my tomatoes?",
    "Will the weather affect my harvest?",
    "How much transport capacity do I need?",
    "Calculate my estimated earnings.",
    "PM-KISAN eligibility & subsidy rules"
  ]
};

const TRANSPORTER_WELCOME_MESSAGES = {
  mr: {
    text: "नमस्कार ट्रान्सपोर्टर मित्र! मी मित्रा लॉजिस्टिक्स असिस्टंट (Mitra Logistics Assistant) आहे. आपण मला पुढील पिकअप, उर्वरित अंतर व वेळ, वाहनातील शिल्लक जागा, किंवा मार्गावरील हवामानाचा अंदाज विचारू शकता.",
    disclaimer: "माहिती आपल्या अधिकृत फेऱ्या, नोंदणीकृत वाहन व मार्गाच्या डेटावर आधारित आहे."
  },
  hi: {
    text: "नमस्ते ट्रांसपोर्टर साथी! मैं मित्रा लॉजिस्टिक्स असिस्टेंट (Mitra Logistics Assistant) हूं। आप मुझसे अगला पिकअप, गंतव्य, वाहन की शेष क्षमता, या रूट मौसम के बारे में पूछ सकते हैं।",
    disclaimer: "जानकारी आपकी अधिकृत यात्राओं एवं वाहन डेटा पर आधारित है।"
  },
  gu: {
    text: "નમસ્તે ટ્રાન્સપોર્ટર મિત્ર! હું મિત્રા લોજિસ્ટિક્સ આસિસ્ટન્ટ (Mitra Logistics Assistant) છું. તમે મને આગામી પીકઅપ, રૂટ અને વાહનની ક્ષમતા વિશે પૂછી શકો છો.",
    disclaimer: "માહિતી તમારા સત્તાવાર વાહન અને મુસાફરી ડેટા પર આધારિત છે."
  },
  en: {
    text: "Namaste Transporter Partner! I am Mitra Logistics Assistant. Ask me about your next pickup point, destination, total cargo weight, remaining vehicle payload capacity, or route weather.",
    disclaimer: "Answers are derived directly from your authorized trips, fleet and route records."
  }
};

const TRANSPORTER_SUGGESTED_QUERIES = {
  mr: [
    "माझे पुढील पिकअप कुठे आहे?",
    "माझे अंतिम गंतव्यस्थान (Destination) कुठे आहे?",
    "एकूण शेतीमाल (Cargo) वजन किती आहे?",
    "माझ्या वाहनात किती क्षमता शिल्लक आहे?",
    "मार्गावर पावसाचा अंदाज आहे का?",
    "पूर्ण झालेल्या फेऱ्यांचे भाडे किती जमा झाले?"
  ],
  hi: [
    "मेरा अगला पिकअप कहां है?",
    "मेरा गंतव्य APMC मंडी कहां है?",
    "कुल कृषि कार्गो वजन कितना है?",
    "मेरे वाहन में कितनी क्षमता शेष है?",
    "क्या मेरे रूट पर बारिश का पूर्वानुमान है?",
    "मेरी पूर्ण यात्राओं का कुल भाड़ा कितना है?"
  ],
  gu: [
    "મારું આગામી પીકઅપ ક્યાં છે?",
    "મારું અંતિમ સ્થળ ક્યાં છે?",
    "કુલ કાર્ગો વજન કેટલું છે?",
    "મારા વાહનમાં કેટલી ક્ષમતા બાકી છે?",
    "શું રૂટ પર વરસાદની આગાહી છે?",
    "મારી પૂર્ણ થયેલ મુસાફરીનું ભાડું કેટલું છે?"
  ],
  en: [
    "Where is my next pickup?",
    "Where is my destination?",
    "What is the total cargo weight?",
    "How much capacity remains in my assigned vehicle?",
    "Is rain forecast along my route?",
    "What are my confirmed fares for completed trips?"
  ]
};

export default function ChatWindow({
  isOpen = true,
  onClose = null,
  contextData = {},
  initialLanguage = null,
  isTransporter = false
}) {
  const { language: globalLanguage, setLanguage: setGlobalLanguage } = useLanguage?.() || {};

  // 1. Language state: restore from initialLanguage, globalLanguage, localStorage or default to 'mr'
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    try {
      const init = initialLanguage || globalLanguage;
      if (init && SUPPORTED_LANGUAGES[init]) return init;
      const saved = localStorage.getItem('mitraLanguage') || localStorage.getItem('harvestmitra_lang');
      return saved && SUPPORTED_LANGUAGES[saved] ? saved : 'mr';
    } catch (_) {
      return 'mr';
    }
  });

  // 2. Voice reply toggle: restore from localStorage (default ON for voice assistance)
  const [voiceAutoRead, setVoiceAutoRead] = useState(() => {
    try {
      const stored = localStorage.getItem('mitraVoiceEnabled');
      return stored !== null ? stored === 'true' : true;
    } catch (_) {
      return true;
    }
  });

  // 3. Messages list: initialized with welcome message in selected language
  const [messages, setMessages] = useState(() => {
    const welcomeMap = isTransporter ? TRANSPORTER_WELCOME_MESSAGES : WELCOME_MESSAGES;
    const welcome = welcomeMap[selectedLanguage] || welcomeMap.en;
    return [
      {
        id: 'welcome_' + Date.now(),
        sender: 'assistant',
        text: welcome.text,
        disclaimer: welcome.disclaimer,
        mode: 'fallback',
        timestamp: Date.now()
      }
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [apiErrorNotice, setApiErrorNotice] = useState(null);
  const [showKisanEarSettings, setShowKisanEarSettings] = useState(false);
  const messagesEndRef = useRef(null);

  // Clear chat messages on logout
  useEffect(() => {
    const handleLogout = () => {
      const welcome = WELCOME_MESSAGES[selectedLanguage] || WELCOME_MESSAGES.en;
      setMessages([
        {
          id: 'welcome_' + Date.now(),
          sender: 'assistant',
          text: welcome.text,
          disclaimer: welcome.disclaimer,
          mode: 'fallback',
          timestamp: Date.now()
        }
      ]);
    };
    window.addEventListener('harvestmitra:logout', handleLogout);
    return () => window.removeEventListener('harvestmitra:logout', handleLogout);
  }, [selectedLanguage]);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Global Wake-Word Event Listener ("Hey Mitra" / "नमस्ते मित्रा")
  useEffect(() => {
    const handleWakeWordEvent = (e) => {
      const { query } = e.detail || {};
      if (query && query.trim()) {
        handleSendMessage(query, true);
      }
    };

    window.addEventListener('harvestmitra:wake-word-triggered', handleWakeWordEvent);
    return () => {
      window.removeEventListener('harvestmitra:wake-word-triggered', handleWakeWordEvent);
    };
  }, [selectedLanguage, messages]);

  // Persist language change & update welcome message if no conversation yet
  const handleLanguageChange = (newLang) => {
    if (!newLang || !SUPPORTED_LANGUAGES[newLang]) return;
    setSelectedLanguage(newLang);
    try {
      localStorage.setItem('mitraLanguage', newLang);
      localStorage.setItem('harvestmitra_lang', newLang);
    } catch (_) {}
    if (setGlobalLanguage) {
      setGlobalLanguage(newLang);
    }
    // Clear any previous error notification banner
    setApiErrorNotice(null);
    // If speaking, stop on language change
    handleStopSpeaking();

    // If chat is fresh (only the initial welcome message),
    // update the welcome message to the newly selected language
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === 'assistant') {
        const welcome = WELCOME_MESSAGES[newLang] || WELCOME_MESSAGES.en;
        return [
          {
            id: 'welcome_' + Date.now(),
            sender: 'assistant',
            text: welcome.text,
            disclaimer: welcome.disclaimer,
            mode: 'fallback',
            timestamp: Date.now()
          }
        ];
      }
      return prev;
    });
  };

  // Sync when initialLanguage or globalLanguage changes from header/navbar
  useEffect(() => {
    const active = initialLanguage || globalLanguage;
    if (active && SUPPORTED_LANGUAGES[active] && active !== selectedLanguage) {
      handleLanguageChange(active);
    }
  }, [initialLanguage, globalLanguage]);

  // Persist voice toggle
  const handleToggleVoiceAutoRead = () => {
    const updated = !voiceAutoRead;
    setVoiceAutoRead(updated);
    try {
      localStorage.setItem('mitraVoiceEnabled', String(updated));
    } catch (_) {}
    if (!updated) {
      handleStopSpeaking();
    }
  };

  // Cleanup Web Speech when ChatWindow unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Stop speaking callback
  const handleStopSpeaking = () => {
    stopSpeaking();
    setSpeakingMessageId(null);
  };

  // Speak specific message
  const handleSpeakMessage = async (messageId, text) => {
    if (speakingMessageId === messageId) {
      handleStopSpeaking();
      return;
    }

    setSpeakingMessageId(messageId);
    await speakMessage(text, selectedLanguage, {
      onStart: () => {
        setSpeakingMessageId(messageId);
      },
      onEnd: () => {
        setSpeakingMessageId(null);
      },
      onError: (err) => {
        setSpeakingMessageId(null);
        if (err.type === 'NO_VOICE') {
          setApiErrorNotice(err.message);
        }
      }
    });
  };

  // Send message flow
  const handleSendMessage = async (textToSend, isVoiceOrigin = false) => {
    if (!textToSend.trim() || isLoading) return;

    setApiErrorNotice(null);
    handleStopSpeaking();

    const userMessageId = 'user_' + Date.now();
    const newUserMessage = {
      id: userMessageId,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Build conversation history payload
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const response = await sendChatMessage({
        message: textToSend,
        language: selectedLanguage, // Ensures 'mr' for Marathi, 'gu' for Gujarati, etc.
        sessionId: getOrCreateSessionId(),
        context: contextData,
        conversationHistory: history
      });

      const assistantMessageId = 'assistant_' + Date.now();
      const assistantMessage = {
        id: assistantMessageId,
        sender: 'assistant',
        text: response.message,
        disclaimer: response.source_disclaimer,
        mode: response.mode,
        provider: response.provider,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If user enabled voice output OR if spoken via voice, automatically read the reply aloud
      if (voiceAutoRead || isVoiceOrigin) {
        handleSpeakMessage(assistantMessageId, response.message);
      }
    } catch (err) {
      console.error('[ChatWindow API Error]:', err);
      const fallbackErrorMessage = {
        id: 'err_' + Date.now(),
        sender: 'assistant',
        text: 'Mitra Assistant is temporarily unavailable. Please try again in a few moments.',
        disclaimer: 'Connection error',
        mode: 'fallback',
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, fallbackErrorMessage]);
      setApiErrorNotice('Unable to reach server. Please ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset conversation to fresh state
  const handleResetChat = () => {
    handleStopSpeaking();
    const welcomeMap = isTransporter ? TRANSPORTER_WELCOME_MESSAGES : WELCOME_MESSAGES;
    const welcome = welcomeMap[selectedLanguage] || welcomeMap.en;
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        sender: 'assistant',
        text: welcome.text,
        disclaimer: welcome.disclaimer,
        mode: 'fallback',
        timestamp: Date.now()
      }
    ]);
    setApiErrorNotice(null);
  };

  const queryMap = isTransporter ? TRANSPORTER_SUGGESTED_QUERIES : SUGGESTED_QUERIES;
  const suggestions = queryMap[selectedLanguage] || queryMap.en;

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-gradient-to-b from-emerald-50/50 via-white to-stone-50 rounded-2xl shadow-xl border border-emerald-200/80 overflow-hidden font-sans">
      {/* 1. Header Bar */}
      <header className="px-4 py-3 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between shadow-md">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-emerald-400/30 flex items-center justify-center text-lg shadow-inner">
            {isTransporter ? '🚚' : '🌱'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1">
                {isTransporter ? 'Mitra Logistics Assistant' : 'Mitra Assistant'}
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80">
              {isTransporter ? 'Agricultural Fleet & Route Decision Support' : 'AI Farming & Mandi Decision Support'}
            </p>
          </div>
        </div>

        {/* Right: Controls (Voice toggle, Language, Reset, Close) */}
        <div className="flex items-center gap-2">
          {/* Voice Auto-Read & Continuous Wake-Word Toggle */}
          <VoiceControls
            voiceAutoRead={voiceAutoRead}
            onToggleVoiceAutoRead={handleToggleVoiceAutoRead}
            isSpeaking={Boolean(speakingMessageId)}
            onStopSpeaking={handleStopSpeaking}
            isContinuous={showKisanEarSettings}
            onToggleContinuous={() => setShowKisanEarSettings((prev) => !prev)}
          />

          {/* Multilingual Selector */}
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
            disabled={isLoading}
          />

          {/* Reset Conversation */}
          <button
            type="button"
            onClick={handleResetChat}
            className="p-1.5 rounded-lg text-emerald-200/80 hover:text-white hover:bg-emerald-700/40 transition-colors"
            title="Start new conversation"
            aria-label="Reset conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Optional Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200/80 hover:text-white hover:bg-emerald-700/40 transition-colors"
              title="Close chat"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Kisan AI Voice Assistant Continuous Ear & Sensitivity Drawer */}
      {showKisanEarSettings && (
        <div className="border-b border-emerald-300/40 bg-emerald-950/95 p-3 sm:p-4 animate-fadeIn">
          <KisanAIAssistant
            onSendMessage={handleSendMessage}
            initialLanguage={selectedLanguage}
          />
        </div>
      )}

      {/* Global Notice Banner if any */}
      {apiErrorNotice && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{apiErrorNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setApiErrorNotice(null)}
            className="text-red-500 hover:text-red-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Messages List Area */}
      <div
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 bg-gradient-to-b from-stone-50/40 to-white"
        aria-live="polite"
      >
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isSpeaking={speakingMessageId === msg.id}
            onSpeak={(text) => handleSpeakMessage(msg.id, text)}
            onStopSpeaking={handleStopSpeaking}
            ttsAvailable={isSpeechSynthesisSupported()}
          />
        ))}

        {/* Lightweight Typing Indicator while response is pending */}
        {isLoading && (
          <div className="flex items-center gap-2 mb-3 px-1 animate-fade-slide-up">
            <div className="w-6 h-6 rounded-full bg-teal-100 border border-teal-300 flex items-center justify-center text-xs shadow-2xs">
              🌱
            </div>
            <div className="bg-white border border-teal-200/80 rounded-2xl rounded-tl-sm px-3.5 py-2 flex items-center gap-2 shadow-2xs">
              <span className="text-xs text-teal-900 font-medium">Mitra is analyzing</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 typing-dot-1" />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 typing-dot-2" />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 typing-dot-3" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Suggestion Prompt Chips */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-stone-50/80 border-t border-emerald-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-emerald-900 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Try asking:
          </span>
          {suggestions.map((query, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(query)}
              disabled={isLoading}
              className="text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shadow-2xs active:scale-95"
            >
              {query}
            </button>
          ))}
        </div>
      )}

      {/* 4. Chat Input Composer with Microphone (STT) */}
      <ChatInput
        onSendMessage={handleSendMessage}
        selectedLanguage={selectedLanguage}
        isLoading={isLoading}
      />
    </div>
  );
}
