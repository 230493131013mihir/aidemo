import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Volume2, 
  Stethoscope, 
  Radio, 
  Truck, 
  X, 
  Sparkles, 
  ChevronUp, 
  ChevronDown,
  Bot
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import CropDoctorModal from '../features/CropDoctorModal';

function speakAloud(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

export default function KisanFloatingBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [expanded, setExpanded] = useState(false);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);

  function handleRadioBulletin() {
    const radioScript = `Namaskar farmers! This is the HarvestMitra Kisan Mandi Radio bulletin for Gujarat APMC markets. ` +
      `Surat APMC Tomato is trading steady at 18 rupees 50 paise per kilogram with 520 quintal arrivals. ` +
      `Ahmedabad APMC Onion modal price is recorded at 29 rupees per kilogram with firm demand. ` +
      `Potato in Deesa APMC is trading at 19 rupees 50 paise. ` +
      `Shared transport truck pools are actively departing for Surat and Ahmedabad mandis. ` +
      `Jai Kisan! HarvestMitra wishes all farmers a profitable harvest.`;

    speakAloud(radioScript);
    showToast({
      type: 'celebrate',
      title: '📻 Kisan Mandi Radio Playing',
      message: 'Broadcasting live Gujarat APMC agricultural bulletin...',
      duration: 6000,
    });
  }

  function handlePageVoiceSummary() {
    let summary = 'Welcome to HarvestMitra AI decision platform.';
    const path = location.pathname;

    if (path.includes('dashboard')) {
      summary = 'You are on your Live Farmer Dashboard. Your verified crops, live Surat APMC prices, and estimated revenue are ready.';
    } else if (path.includes('markets')) {
      summary = 'Viewing live APMC mandi prices for Gujarat. Tomato, Potato, and Onion prices are updated from APMC database.';
    } else if (path.includes('harvest')) {
      summary = 'Harvest Decision Simulator. Compare local mandi rates versus regional mega mandis with shared pooling.';
    } else if (path.includes('transport')) {
      summary = 'Shared Transport Pooling. Book or share a truck to APMC mandi to save 40 to 55 percent on logistics.';
    } else if (path.includes('weather')) {
      summary = 'Agricultural Weather alerts. Check spray safety index and rain probability before harvesting.';
    }

    speakAloud(summary);
    showToast({
      type: 'info',
      title: '🔊 Voice Assistant',
      message: 'Reading current screen summary aloud...',
    });
  }

  return (
    <>
      <CropDoctorModal
        isOpen={doctorModalOpen}
        onClose={() => setDoctorModalOpen(false)}
      />

      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 print:hidden">
        {/* Expanded Quick-Dial Menu */}
        {expanded && (
          <div className="rounded-3xl border border-emerald-300 bg-white/95 backdrop-blur-md p-3 shadow-2xl space-y-2 animate-in slide-in-from-bottom-2 duration-200 min-w-[220px]">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 px-2 py-1 flex items-center justify-between border-b border-emerald-100">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Kisan Sahayak Bar
              </span>
              <span className="text-[9px] text-muted">Accessibility</span>
            </div>

            {/* Action 0: Mitra AI Voice Chatbot */}
            <button
              type="button"
              onClick={() => {
                navigate('/chat');
                setExpanded(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200 transition-colors text-left border border-emerald-300/60 shadow-2xs"
            >
              <Bot className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>🤖 Mitra AI Voice Chatbot</span>
            </button>

            {/* Action 1: Voice Read Page */}
            <button
              type="button"
              onClick={handlePageVoiceSummary}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-text hover:bg-emerald-50 hover:text-emerald-900 transition-colors text-left"
            >
              <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>🔊 Read Page Aloud</span>
            </button>

            {/* Action 2: AI Crop Doctor */}
            <button
              type="button"
              onClick={() => {
                setDoctorModalOpen(true);
                setExpanded(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-text hover:bg-emerald-50 hover:text-emerald-900 transition-colors text-left"
            >
              <Stethoscope className="w-4 h-4 text-primary shrink-0" />
              <span>🩺 AI Crop Doctor</span>
            </button>

            {/* Action 3: Kisan Mandi Radio */}
            <button
              type="button"
              onClick={handleRadioBulletin}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-text hover:bg-emerald-50 hover:text-emerald-900 transition-colors text-left"
            >
              <Radio className="w-4 h-4 text-amber-600 shrink-0" />
              <span>📻 Mandi Audio Radio</span>
            </button>

            {/* Action 4: Quick Shared Truck */}
            <button
              type="button"
              onClick={() => {
                navigate('/transport');
                setExpanded(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-text hover:bg-emerald-50 hover:text-emerald-900 transition-colors text-left"
            >
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>🚚 Shared Truck Pooling</span>
            </button>
          </div>
        )}

        {/* Master Floating Trigger Button */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="rounded-full bg-gradient-to-r from-primary to-emerald-500 text-white p-3.5 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-2 border-2 border-white/80"
          title="Kisan Sahayak Assistant"
        >
          <Bot className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-black tracking-wide hidden sm:inline">
            {expanded ? 'Close' : 'Kisan Voice & AI'}
          </span>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
}
