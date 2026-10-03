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
import {
  SUPPORTED_LANGUAGES,
  speakMessage,
  stopSpeaking,
  isCurrentlySpeaking,
  isSpeechSynthesisSupported
} from '../../services/speechService';
import { sendChatMessage, getOrCreateSessionId } from '../../services/chatService';

const WELCOME_MESSAGES = {
  en: {
    text: "Namaste! I am Mitra Assistant. Ask me about APMC Mandi prices, whether you should sell today or hold, shared transport pooling, or weather forecasts.",
    disclaimer: "Demonstration data mode active."
  },
  hi: {
    text: "नमस्ते! मैं मित्रा असिस्टेंट (Mitra Assistant) हूं। आप मुझसे मंडी भाव, आज फसल बेचें या रुकें, साझा परिवहन (भाड़ा बचत), या मौसम की जानकारी पूछ सकते हैं।",
    disclaimer: "मंडी के आंकड़े डेमो डेटा पर आधारित हैं।"
  },
  gu: {
    text: "નમસ્તે! હું મિત્ર આસિસ્ટન્ટ (Mitra Assistant) છું. તમે મને મંડી ભાવ, આજે વેચવું કે રાહ જોવી, સહિયારા વાહનનું ભાડું બચાવવા, અથવા હવામાન વિશે પૂછી શકો છો.",
    disclaimer: "બજારના આંકડા ડેમો સેમ્પલ ડેટા આધારિત છે."
  },
  mr: {
    text: "नमस्कार! मी मित्रा असिस्टंट (Mitra Assistant) आहे. आपण मला बाजार भाव, आज पिकाची विक्री करावी की थांबावे, सामायिक वाहतूक (भाडे बचत), किंवा हवामानाचा अंदाज विचारू शकता.",
    disclaimer: "बाजार भाव आणि आकडेवारी डेमो सॅम्पल डेटावर आधारित आहे."
  }
};

const SUGGESTED_QUERIES = {
  en: [
    "What is today's tomato rate?",
    "I have 500 kg tomatoes. Should I sell today?",
    "How can I save on shared transport?"
  ],
  hi: [
    "आज टमाटर का मंडी भाव क्या है?",
    "मेरे पास 500 किलो टमाटर हैं। क्या मुझे आज बेचने चाहिए?",
    "साझा वाहन से भाड़ा कैसे बचाएं?"
  ],
  gu: [
    "આજે ટામેટાંનો ભાવ શું છે?",
    "મારી પાસે 500 કિલો ટામેટાં છે. આજે વેચવા જોઈએ?",
    "સહિયારા વાહન દ્વારા ભાડું કેવી રીતે બચાવી શકાય?"
  ],
  mr: [
    "आज टोमॅटोचा भाव काय आहे?",
    "माझ्याकडे 500 किलो टोमॅटो आहेत. आज विकावे का?",
    "सामायिक वाहनाने वाहतूक खर्च कसा वाचवावा?"
  ]
};

export default function ChatWindow({
  isOpen = true,
  onClose = null,
  contextData = {}
}) {
  // 1. Language state: restore from localStorage or default to 'en'
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('mitraLanguage');
      return saved && SUPPORTED_LANGUAGES[saved] ? saved : 'en';
    } catch (_) {
      return 'en';
    }
  });

  // 2. Voice reply toggle: restore from localStorage (default OFF)
  const [voiceAutoRead, setVoiceAutoRead] = useState(() => {
    try {
      return localStorage.getItem('mitraVoiceEnabled') === 'true';
    } catch (_) {
      return false;
    }
  });

  // 3. Messages list: initialized with welcome message in selected language
  const [messages, setMessages] = useState(() => {
    const welcome = WELCOME_MESSAGES[selectedLanguage] || WELCOME_MESSAGES.en;
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
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Persist language change
  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    try {
      localStorage.setItem('mitraLanguage', newLang);
    } catch (_) {}
    // If speaking, stop on language change
    handleStopSpeaking();
  };

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
  const handleSendMessage = async (textToSend) => {
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

      // If user enabled voice output, automatically read the reply in selected language
      if (voiceAutoRead) {
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
    setApiErrorNotice(null);
  };

  const suggestions = SUGGESTED_QUERIES[selectedLanguage] || SUGGESTED_QUERIES.en;

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-gradient-to-b from-emerald-50/50 via-white to-stone-50 rounded-2xl shadow-xl border border-emerald-200/80 overflow-hidden font-sans">
      {/* 1. Header Bar */}
      <header className="px-4 py-3 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between shadow-md">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-emerald-400/30 flex items-center justify-center text-lg shadow-inner">
            🌱
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1">
                Mitra Assistant
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80">
              AI Farming & Mandi Decision Support
            </p>
          </div>
        </div>

        {/* Right: Controls (Voice toggle, Language, Reset, Close) */}
        <div className="flex items-center gap-2">
          {/* Voice Auto-Read Toggle */}
          <VoiceControls
            voiceAutoRead={voiceAutoRead}
            onToggleVoiceAutoRead={handleToggleVoiceAutoRead}
            isSpeaking={Boolean(speakingMessageId)}
            onStopSpeaking={handleStopSpeaking}
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

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 mb-3 px-1 text-emerald-800 text-xs font-medium animate-pulse">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">
              🌱
            </div>
            <span>Mitra is analyzing market data...</span>
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
