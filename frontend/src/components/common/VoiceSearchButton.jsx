import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function VoiceSearchButton({ onResult, className = '', id = 'voice-search-btn' }) {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
    };
  }, []);

  const toggleVoiceSearch = () => {
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please use Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript && onResult) {
        onResult(transcript);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (_) {
      setIsListening(false);
    }
  };

  return (
    <button
      id={id}
      type="button"
      onClick={toggleVoiceSearch}
      title={isListening ? "Listening... Click to Stop" : "Speak to Search"}
      aria-label="Speak to Search"
      className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
        isListening
          ? 'bg-red-500 text-white border-red-600 animate-pulse ring-2 ring-red-400/50'
          : 'bg-white hover:bg-slate-100 text-muted border-border hover:border-primary/40'
      } ${className}`}
    >
      {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-primary" />}
    </button>
  );
}
