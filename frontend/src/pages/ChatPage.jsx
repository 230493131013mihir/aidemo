import React, { useMemo, useState } from 'react';
import { AlertCircle, Bot, Mic, RefreshCw, Send, Sparkles, Volume2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const STARTER_MESSAGES = [
  'Tomato price in Pune',
  'Is today safe for harvest?',
  'How to reduce transport cost?',
  'Should I sell today or wait?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Namaste. I can help with mandi prices, weather risk, harvest timing, and shared transport planning.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const speechSupported = useMemo(() => {
    return typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  async function sendMessage(text = input) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    setError('');
    setLoading(true);
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/assistant/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Assistant could not answer');
      }
      setMessages((current) => [...current, { role: 'assistant', text: payload.reply }]);
    } catch (err) {
      setError(err.message || 'Backend is not reachable. Start backend with npm run dev.');
    } finally {
      setLoading(false);
    }
  }

  function startVoiceInput() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Voice input is not supported in this browser. Type your question instead.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setInput(transcript);
    };
    recognition.onerror = () => {
      setError('Voice input failed. Please allow microphone permission or type the question.');
    };
    recognition.start();
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      {/* Photographic AI Assistant Banner */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-900/30 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/dashboard-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-emerald-950/80 to-slate-900/70 backdrop-blur-[1px]" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Voice & Multilingual AI Agronomist</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              Mitra AI Advisory Assistant
            </h1>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm">
              Ask about live APMC mandi prices, rainfall forecast, crop harvest timing, and shared truck pooling in natural language.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 text-center shrink-0 min-w-[200px]">
            <span className="text-[10px] font-bold text-slate-300 uppercase">AI Status</span>
            <p className="text-xs font-extrabold text-emerald-300 mt-1">🟢 Live Advisory Online</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-secondary border border-border p-4">
          <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-text">How to use</p>
            <p className="text-sm text-muted">
              Type a question, click a quick question, or use microphone. Use the speaker icon to read the answer aloud.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {STARTER_MESSAGES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => sendMessage(item)}
              className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-text hover:border-primary hover:text-primary"
            >
              {item}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-error/20 bg-red-50 text-error text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="h-[430px] overflow-y-auto rounded-xl border border-border bg-background p-4 space-y-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border text-text'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.role === 'assistant' && <Bot className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                  <p>{message.text}</p>
                  {message.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => speak(message.text)}
                      className="text-muted hover:text-primary shrink-0"
                      aria-label="Read answer aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-white border border-border px-4 py-3 text-sm text-muted inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask: tomato price in Pune, safe harvest today, transport cost..."
            className="flex-1 rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={startVoiceInput}
            className={`p-3 rounded-lg text-white ${speechSupported ? 'bg-primary' : 'bg-muted'}`}
            aria-label="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button type="submit" disabled={loading} className="btn-primary h-11 px-4">
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </section>
    </div>
  );
}
