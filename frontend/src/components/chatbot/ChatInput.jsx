/**
 * ChatInput.jsx
 * Multilingual Text & Voice Message Composer
 * HarvestMitra AI - ISSUE-10
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Loader2, AlertCircle, X } from 'lucide-react';
import {
  isSpeechRecognitionSupported,
  startRecognition,
  stopRecognition
} from '../../services/speechService';

export const LOCALIZED_LABELS = {
  en: {
    placeholder: 'Ask Mitra about mandi prices, harvest decisions, transport...',
    send: 'Send',
    speak: 'Voice input (speak)',
    listening: 'Listening... speak now',
    processing: 'Processing...',
    stopListening: 'Stop microphone',
    noSupport: "Voice input isn't supported in this browser. You can type your message."
  },
  hi: {
    placeholder: 'मंडी भाव, फसल कटाई का समय, या साझा वाहन के बारे में पूछें...',
    send: 'भेजें',
    speak: 'बोलें (वॉइस इनपुट)',
    listening: 'सुन रहा है... बोलिए',
    processing: 'प्रोसेस हो रहा है...',
    stopListening: 'माइक रोकें',
    noSupport: 'इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। आप लिखकर पूछ सकते हैं।'
  },
  gu: {
    placeholder: 'મંડી ભાવ, લણણીનો નિર્ણય, અથવા સહિયારા વાહન વિશે પૂછો...',
    send: 'મોકલો',
    speak: 'બોલો (અવાજ ઇનપુટ)',
    listening: 'સાંભળી રહ્યું છે... બોલો',
    processing: 'પ્રક્રિયા ચાલુ છે...',
    stopListening: 'માઇક બંધ કરો',
    noSupport: 'આ બ્રાઉઝરમાં વોઇસ ઇનપુટ સપોર્ટ કરતું નથી. તમે લખીને સંદેશ મોકલી શકો છો.'
  },
  mr: {
    placeholder: 'बाजार भाव, काढणीचा सल्ला, किंवा सामायिक वाहतुकीबद्दल विचारा...',
    send: 'पाठवा',
    speak: 'बोला (आवाज इनपुट)',
    listening: 'ऐकत आहे... बोला',
    processing: 'प्रक्रिया सुरू आहे...',
    stopListening: 'माइक थांबवा',
    noSupport: 'या ब्राउझरमध्ये व्हॉइस इनपुट समर्थित नाही. आपण टाइप करून विचारू शकता.'
  }
};

export default function ChatInput({
  onSendMessage,
  selectedLanguage = 'en',
  isLoading = false
}) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceNotice, setVoiceNotice] = useState(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const labels = LOCALIZED_LABELS[selectedLanguage] || LOCALIZED_LABELS.en;
  const isSttSupported = isSpeechRecognitionSupported();

  // Cleanup recognition on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopRecognition();
    };
  }, []);

  // When language changes while listening, restart recognition in the new language
  useEffect(() => {
    if (isListening) {
      stopVoiceInput();
      startVoiceInput();
    }
  }, [selectedLanguage]);

  const handleStartVoice = () => {
    if (!isSttSupported) {
      setVoiceNotice(labels.noSupport);
      return;
    }

    if (isListening) {
      stopVoiceInput();
      return;
    }

    startVoiceInput();
  };

  const startVoiceInput = () => {
    setVoiceNotice(null);
    setInterimText('');

    const controller = startRecognition({
      language: selectedLanguage,
      onStart: () => {
        setIsListening(true);
      },
      onInterimResult: (interim) => {
        setInterimText(interim);
      },
      onFinalResult: (final) => {
        setInputText((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${final}` : final;
        });
        setInterimText('');
      },
      onError: (err) => {
        setIsListening(false);
        setInterimText('');
        setVoiceNotice(err.message);
      },
      onEnd: ({ hasResults }) => {
        setIsListening(false);
        setInterimText('');
      }
    });

    recognitionRef.current = controller;
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopRecognition();
    setIsListening(false);
    setInterimText('');
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    if (isListening) {
      stopVoiceInput();
    }

    onSendMessage(trimmed);
    setInputText('');
    setInterimText('');
    setVoiceNotice(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e) => {
    setInputText(e.target.value);
    // Auto-grow height up to max
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="border-t border-emerald-100 bg-white p-3 sm:p-4 rounded-b-2xl shadow-inner">
      {/* Voice Notification / Error Banner */}
      {voiceNotice && (
        <div className="mb-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start justify-between gap-2 animate-fadeIn">
          <div className="flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{voiceNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setVoiceNotice(null)}
            className="text-amber-500 hover:text-amber-800 p-0.5"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Listening Status Indicator */}
      {isListening && (
        <div className="mb-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
            <span className="font-semibold">{labels.listening}</span>
            {interimText && (
              <span className="italic text-gray-600 truncate max-w-[200px] sm:max-w-[320px]">
                "{interimText}"
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={stopVoiceInput}
            className="px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 text-red-800 font-medium text-[11px] transition-colors"
          >
            {labels.stopListening}
          </button>
        </div>
      )}

      {/* Composer Input Bar */}
      <div className="flex items-end gap-2 bg-gray-50 border border-emerald-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl p-1.5 transition-all">
        {/* Text Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={labels.placeholder}
          aria-label="Type your message"
          className="flex-1 bg-transparent px-2.5 py-1.5 text-sm sm:text-base text-gray-800 placeholder-gray-400 resize-none focus:outline-none max-h-28 overflow-y-auto leading-relaxed"
          style={{ minHeight: '38px' }}
        />

        {/* Microphone Button */}
        <button
          type="button"
          onClick={handleStartVoice}
          disabled={isLoading}
          className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
            isListening
              ? 'bg-red-600 text-white animate-bounce shadow-md hover:bg-red-700'
              : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95'
          }`}
          aria-label={isListening ? labels.stopListening : labels.speak}
          title={isListening ? labels.stopListening : labels.speak}
        >
          {isListening ? (
            <MicOff className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-emerald-700" />
          )}
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputText.trim() || isLoading}
          className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
            !inputText.trim() || isLoading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow active:scale-95'
          }`}
          aria-label={labels.send}
          title={labels.send}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400 px-1">
        <span>Enter to send • Shift+Enter for newline</span>
        <span>Supports Voice & Text</span>
      </div>
    </div>
  );
}
