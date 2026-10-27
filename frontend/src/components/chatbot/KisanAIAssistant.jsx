/**
 * KisanAIAssistant.jsx
 * Multilingual Kisan AI Voice Assistant with Continuous Listening & Wake-Word Trigger
 * Supports "Hey Mitra" / "नमस्ते मित्रा" / "हे मित्रा" voice activation
 * Features speech sensitivity controls (Low, Medium, High) for rural farm & noisy APMC mandi environments
 * Languages: Marathi (mr), Hindi (hi), English (en)
 * HarvestMitra AI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Zap,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  SUPPORTED_LANGUAGES,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakMessage,
  stopSpeaking
} from '../../services/speechService';

import {
  WAKE_WORD_PATTERNS,
  SENSITIVITY_CONFIGS,
  matchWakeWord
} from '../../services/kisanVoiceService';

export { WAKE_WORD_PATTERNS, SENSITIVITY_CONFIGS, matchWakeWord };

/**
 * Play a synthesized friendly audio chime via Web Audio API
 * Provides instant feedback when "Hey Mitra" is detected without external asset downloads
 */
function playWakeWordChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Uplifting two-tone agritech chime: E5 (659Hz) -> A5 (880Hz)
    const now = ctx.currentTime;
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12);

    osc2.frequency.setValueAtTime(329.63, now);
    osc2.frequency.exponentialRampToValueAtTime(440.0, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  } catch (_) {
    // Graceful fallback if Web Audio is restricted
  }
}

export default function KisanAIAssistant({
  onWakeWordDetected = null,
  onSearch = null,
  onSendMessage = null,
  initialLanguage = null,
  compact = false,
  className = ''
}) {
  const { language: globalLanguage, setLanguage: setGlobalLanguage } = useLanguage?.() || {};
  const { showToast } = useToast?.() || {};

  const currentLang = initialLanguage || globalLanguage || 'mr';
  const [activeLang, setActiveLang] = useState(
    SUPPORTED_LANGUAGES[currentLang] ? currentLang : 'mr'
  );

  // Core Modes
  const [isContinuousListening, setIsContinuousListening] = useState(() => {
    try {
      return localStorage.getItem('mitra_continuous_listening') === 'true';
    } catch (_) {
      return false;
    }
  });

  const [sensitivity, setSensitivity] = useState(() => {
    try {
      return localStorage.getItem('mitra_speech_sensitivity') || 'medium';
    } catch (_) {
      return 'medium';
    }
  });

  // Dynamic Assistant Status
  const [assistantState, setAssistantState] = useState('idle'); // 'idle' | 'listening_continuous' | 'wake_word_triggered' | 'query_captured' | 'error'
  const [lastDetectedTrigger, setLastDetectedTrigger] = useState(null);
  const [interimSpeech, setInterimSpeech] = useState('');
  const [lastCapturedQuery, setLastCapturedQuery] = useState('');
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [vuLevel, setVuLevel] = useState(0); // Audio Waveform animation level (0-100)

  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isManuallyStoppedRef = useRef(false);
  const animationFrameRef = useRef(null);

  // Sync language with global context
  useEffect(() => {
    if (globalLanguage && SUPPORTED_LANGUAGES[globalLanguage] && globalLanguage !== activeLang) {
      setActiveLang(globalLanguage);
    }
  }, [globalLanguage]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('mitra_continuous_listening', String(isContinuousListening));
      localStorage.setItem('mitra_speech_sensitivity', sensitivity);
    } catch (_) {}
  }, [isContinuousListening, sensitivity]);

  // Parse speech transcript to detect wake-word trigger across languages
  const evaluateWakeWord = useCallback((transcript) => {
    const res = matchWakeWord(transcript, activeLang);
    if (res.matched) {
      return { wakeWord: res.wakeWord, query: res.query };
    }
    return null;
  }, [activeLang]);

  // Handle successful wake-word detection
  const handleWakeWordTriggered = useCallback((wakeWord, extractedQuery) => {
    playWakeWordChime();
    setAssistantState('wake_word_triggered');
    setLastDetectedTrigger(wakeWord);

    if (showToast) {
      showToast({
        type: 'celebrate',
        title: '🎙️ "Hey Mitra" Voice Trigger Active!',
        message: extractedQuery
          ? `Query detected: "${extractedQuery}"`
          : 'Listening for your crop, mandi, or weather question...',
        duration: 4000
      });
    }

    // Broadcast global wake-word event so VoiceSearchButton and header search open automatically
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('harvestmitra:wake-word-triggered', {
          detail: {
            wakeWord,
            query: extractedQuery,
            language: activeLang
          }
        })
      );
    }

    onWakeWordDetected?.({ wakeWord, query: extractedQuery, language: activeLang });

    if (extractedQuery) {
      setLastCapturedQuery(extractedQuery);
      onSearch?.(extractedQuery);
      onSendMessage?.(extractedQuery);
    }
  }, [activeLang, onWakeWordDetected, onSearch, onSendMessage, showToast]);

  // Simulated VU Audio Visualizer animation when microphone is actively capturing
  const startVuAnimation = useCallback(() => {
    let tick = 0;
    const loop = () => {
      tick++;
      // Natural oscillating soundwave simulation
      const base = 25 + Math.sin(tick * 0.15) * 20 + Math.cos(tick * 0.3) * 15;
      setVuLevel(Math.min(95, Math.max(10, Math.round(base))));
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  const stopVuAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setVuLevel(0);
  }, []);

  // Stop any active SpeechRecognition instance
  const stopListeningSession = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    stopVuAnimation();
    setAssistantState('idle');
    setInterimSpeech('');
  }, [stopVuAnimation]);

  // Start continuous listening session with sensitivity-guided thresholds
  const startListeningSession = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      setAssistantState('error');
      return;
    }

    stopListeningSession();
    isManuallyStoppedRef.current = false;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    const langConfig = SUPPORTED_LANGUAGES[activeLang] || SUPPORTED_LANGUAGES.mr;
    const sensitivityConfig = SENSITIVITY_CONFIGS[sensitivity] || SENSITIVITY_CONFIGS.medium;

    recognition.lang = langConfig.speechRecognition || 'mr-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setAssistantState('listening_continuous');
      setHasPermissionError(false);
      startVuAnimation();
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalSpeech = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const transcript = item[0]?.transcript || '';
        const confidence = typeof item[0]?.confidence === 'number' ? item[0].confidence : 0.8;

        // Only discard if transcript is empty noise
        if (confidence > 0 && confidence < (sensitivityConfig.minConfidence * 0.4) && item.isFinal && !transcript.trim()) {
          continue;
        }

        if (item.isFinal) {
          finalSpeech += transcript;
        } else {
          interim += transcript;
        }
      }

      const activeText = (finalSpeech || interim).trim();
      setInterimSpeech(activeText);

      // Evaluate Wake-Word in real-time
      if (activeText) {
        const wakeResult = evaluateWakeWord(activeText);
        if (wakeResult) {
          handleWakeWordTriggered(wakeResult.wakeWord, wakeResult.query);
        }
      }

      // Reset Silence Timer for auto-submission of queries
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (activeText && finalSpeech) {
        silenceTimerRef.current = setTimeout(() => {
          const wakeResult = evaluateWakeWord(finalSpeech);
          if (wakeResult && wakeResult.query) {
            onSearch?.(wakeResult.query);
            onSendMessage?.(wakeResult.query);
          }
        }, sensitivityConfig.silenceDelayMs);
      }
    };

    recognition.onerror = (event) => {
      console.warn('[KisanAIAssistant Voice Error]:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setHasPermissionError(true);
        setAssistantState('error');
        setIsContinuousListening(false);
      }
    };

    recognition.onend = () => {
      stopVuAnimation();
      // Auto-restart if continuous mode is still enabled and user did not manually stop
      if (!isManuallyStoppedRef.current && isContinuousListening) {
        restartTimerRef.current = setTimeout(() => {
          if (!isManuallyStoppedRef.current && isContinuousListening) {
            try {
              recognition.start();
            } catch (_) {}
          }
        }, 300);
      } else {
        setAssistantState('idle');
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.warn('[KisanAIAssistant Start Error]:', err);
      setAssistantState('error');
    }
  }, [
    activeLang,
    sensitivity,
    isContinuousListening,
    evaluateWakeWord,
    handleWakeWordTriggered,
    onSearch,
    onSendMessage,
    startVuAnimation,
    stopVuAnimation,
    stopListeningSession
  ]);

  // React to continuous listening toggle changes
  useEffect(() => {
    if (isContinuousListening) {
      startListeningSession();
    } else {
      stopListeningSession();
    }

    return () => {
      stopListeningSession();
    };
  }, [isContinuousListening, startListeningSession, stopListeningSession]);

  // Restart session when language or sensitivity changes while active
  const handleSensitivityChange = (newSens) => {
    setSensitivity(newSens);
    if (isContinuousListening) {
      setTimeout(() => startListeningSession(), 100);
    }
  };

  const handleLanguageSwitch = (newLang) => {
    setActiveLang(newLang);
    if (setGlobalLanguage) setGlobalLanguage(newLang);
    if (isContinuousListening) {
      setTimeout(() => startListeningSession(), 100);
    }
  };

  const toggleContinuousMode = () => {
    setIsContinuousListening((prev) => !prev);
  };

  // Trigger quick manual wake-word test (for demo or headless test environments)
  const handleSimulateWakeWord = () => {
    const sampleQuery =
      activeLang === 'mr'
        ? 'आज नाशिक मध्ये टोमॅटोचा भाव काय आहे?'
        : activeLang === 'hi'
        ? 'आज नासिक में टमाटर का भाव क्या है?'
        : 'What is today tomato price in Nashik APMC?';

    const triggerWord = activeLang === 'mr' ? 'हे मित्रा' : activeLang === 'hi' ? 'नमस्ते मित्रा' : 'Hey Mitra';
    handleWakeWordTriggered(triggerWord, sampleQuery);
  };

  // Localized Labels
  const labels = {
    mr: {
      cardTitle: 'मित्रा व्हॉइस असिस्टंट (Mitra Voice Ear)',
      statusListening: 'नेहमी ऐकत आहे ("हे मित्रा" किंवा "मित्रा" बोला)...',
      statusIdle: 'व्हॉइस वेक-वर्ड बंद आहे (सुरू करण्यासाठी क्लिक करा)',
      continuousToggle: 'कंटिन्युअस लिसनिंग (नेहमी ऐका)',
      sensitivityTitle: 'आवाज संवेदनशीलता (Speech Sensitivity):',
      testTriggerBtn: 'वेक-वर्ड टेस्ट करा ("हे मित्रा")',
      supportedTriggers: 'मान्य आवाज ट्रिगर्स: "हे मित्रा", "मित्रा", "Hey Mitra"'
    },
    hi: {
      cardTitle: 'मित्रा वॉइस असिस्टेंट (Mitra Voice Ear)',
      statusListening: 'हमेशा सक्रिय ("नमस्ते मित्रा" या "हे मित्रा" बोलें)...',
      statusIdle: 'वॉइस वेक-वर्ड बंद है (चालू करने हेतु क्लिक करें)',
      continuousToggle: 'कंटीन्यूअस लिसनिंग (हमेशा सुनें)',
      sensitivityTitle: 'आवाज संवेदनशीलता (Speech Sensitivity):',
      testTriggerBtn: 'वेक-वर्ड टेस्ट करें ("नमस्ते मित्रा")',
      supportedTriggers: 'स्वीकार्य ट्रिगर्स: "नमस्ते मित्रा", "हे मित्रा", "Hey Mitra"'
    },
    en: {
      cardTitle: 'Mitra AI Voice Assistant (Hands-Free Ear)',
      statusListening: 'Continuous Listening Active (Say "Hey Mitra" anytime)...',
      statusIdle: 'Continuous Wake-Word is OFF (Click to activate)',
      continuousToggle: 'Continuous Listening Mode',
      sensitivityTitle: 'Speech Sensitivity Level:',
      testTriggerBtn: 'Test Wake-Word ("Hey Mitra")',
      supportedTriggers: 'Accepted Triggers: "Hey Mitra", "Hello Mitra", "नमस्ते मित्रा", "हे मित्रा"'
    }
  };

  const l = labels[activeLang] || labels.en;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 p-1.5 rounded-2xl bg-white/95 border border-emerald-300 shadow-sm backdrop-blur-sm ${className}`}>
        <button
          type="button"
          onClick={toggleContinuousMode}
          title={isContinuousListening ? 'Continuous Voice Active: Click to pause' : 'Enable Hands-Free "Hey Mitra" Voice Listening'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
            isContinuousListening
              ? 'bg-emerald-600 text-white animate-pulse shadow-md shadow-emerald-500/20'
              : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          {isContinuousListening ? <Radio className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5 text-emerald-700" />}
          <span>{isContinuousListening ? '"Hey Mitra" Active' : 'Enable Wake-Word'}</span>
        </button>

        {isContinuousListening && (
          <div className="flex items-center gap-1 px-1.5">
            <span className="w-1.5 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ height: `${Math.max(6, vuLevel * 0.2)}px` }} />
            <span className="w-1.5 h-4 bg-emerald-600 rounded-full animate-bounce delay-75" style={{ height: `${Math.max(8, vuLevel * 0.25)}px` }} />
            <span className="w-1.5 h-2 bg-emerald-400 rounded-full animate-bounce delay-150" style={{ height: `${Math.max(5, vuLevel * 0.15)}px` }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      id="kisan-ai-assistant-container"
      className={`rounded-3xl border border-emerald-300/80 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md ${className}`}
    >
      {/* Background Decorative Gradient Wave */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/30 to-teal-400/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-inner">
            {isContinuousListening ? (
              <Radio className="w-6 h-6 animate-pulse text-emerald-400" />
            ) : (
              <Mic className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                {l.cardTitle}
              </h3>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  isContinuousListening
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-xs'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isContinuousListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                  }`}
                />
                {isContinuousListening ? 'Live Listening' : 'Standby'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isContinuousListening ? l.statusListening : l.statusIdle}
            </p>
          </div>
        </div>

        {/* Language Quick Switcher */}
        <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 p-1 rounded-xl">
          {['mr', 'hi', 'en'].map((langCode) => (
            <button
              key={langCode}
              type="button"
              onClick={() => handleLanguageSwitch(langCode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeLang === langCode
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {langCode === 'mr' ? 'मराठी' : langCode === 'hi' ? 'हिन्दी' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Controls */}
      <div className="relative z-10 py-5 space-y-5">
        {/* Continuous Listening Master Toggle & Audio Visualizer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-300" />
              <span className="font-extrabold text-sm text-white">{l.continuousToggle}</span>
            </div>
            <p className="text-xs text-slate-300">
              Allows saying &quot;Hey Mitra&quot; or &quot;नमस्ते मित्रा&quot; hands-free to start speaking questions
            </p>
          </div>

          <button
            type="button"
            id="toggle-continuous-voice-btn"
            onClick={toggleContinuousMode}
            className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              isContinuousListening
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white ring-2 ring-red-400/40'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isContinuousListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isContinuousListening ? 'Stop Continuous Ear' : 'Start Continuous Listening'}</span>
          </button>
        </div>

        {/* Live Audio VU Waveform Bar */}
        {isContinuousListening && (
          <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Ear Active: Listening for &quot;Hey Mitra&quot; / &quot;नमस्ते मित्रा&quot;</span>
            </div>

            {/* Dynamic VU Meter Bar */}
            <div className="flex items-center gap-1 flex-1 max-w-xs justify-end">
              {Array.from({ length: 16 }).map((_, idx) => {
                const height = Math.max(4, Math.sin(idx + vuLevel * 0.1) * 20 + 8);
                const active = (idx / 16) * 100 <= vuLevel;
                return (
                  <div
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      active ? (idx > 12 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-slate-700/60'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Interim Speech Feedback */}
        {interimSpeech && (
          <div className="p-3 rounded-xl bg-emerald-900/40 border border-emerald-400/40 text-xs text-emerald-200 italic flex items-center gap-2 animate-fadeIn">
            <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">&quot;{interimSpeech}&quot;</span>
          </div>
        )}

        {/* Speech Sensitivity Controls */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>{l.sensitivityTitle}</span>
            </div>
            <span className="font-mono text-[11px] text-emerald-300">
              Current: {SENSITIVITY_CONFIGS[sensitivity]?.label[activeLang]}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {Object.values(SENSITIVITY_CONFIGS).map((item) => {
              const isSelected = sensitivity === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSensitivityChange(item.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-lg ring-1 ring-emerald-400/40'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>{item.label[activeLang]}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {item.description[activeLang]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Supported Wake Triggers Info & Quick Simulator Test */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-3 border-t border-white/10 gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{l.supportedTriggers}</span>
          </div>

          <button
            type="button"
            id="simulate-wake-word-btn"
            onClick={handleSimulateWakeWord}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{l.testTriggerBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
