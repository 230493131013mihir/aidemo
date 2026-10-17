import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function TextToSpeechButton({ text, className = '', id = 'tts-button' }) {
  const { language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text-to-speech audio playback is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text: strip markdown symbols and multiple spaces
    const cleanText = String(text || '')
      .replace(/[*_#`~[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Optional voice selection if available
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang === utterance.lang || v.lang.startsWith(utterance.lang.slice(0, 2)));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    try {
      window.speechSynthesis.speak(utterance);
    } catch (_) {
      setIsSpeaking(false);
    }
  };

  return (
    <button
      id={id}
      type="button"
      onClick={handleToggleSpeak}
      title={isSpeaking ? "Stop Reading Aloud" : "Read Aloud in Your Language (Audio)"}
      aria-label={isSpeaking ? "Stop Reading Aloud" : "Read Scheme Details Aloud"}
      className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
        isSpeaking
          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md animate-pulse ring-2 ring-emerald-400/50'
          : 'bg-white hover:bg-emerald-50 text-emerald-700 border-border hover:border-emerald-300 shadow-xs'
      } ${className}`}
    >
      {isSpeaking ? (
        <VolumeX className="w-4 h-4 text-white" />
      ) : (
        <Volume2 className="w-4 h-4 text-emerald-700" />
      )}
    </button>
  );
}
