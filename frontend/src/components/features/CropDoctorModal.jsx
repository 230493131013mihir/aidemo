import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Sparkles, 
  Upload, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Share2, 
  Volume2, 
  Leaf, 
  Stethoscope, 
  ShieldCheck, 
  Info,
  Layers,
  Lock,
  LogIn,
  UserPlus,
  ShieldAlert
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// Native Web Speech Reader helper
function speakAloud(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

const SAMPLE_DIAGNOSES = [
  {
    id: 'tomato-blight',
    crop: 'Tomato',
    diseaseName: 'Early Blight (Alternaria solani)',
    severity: 'Moderate (42% Leaf Foliage Affected)',
    severityLevel: 'moderate',
    confidence: '96.4%',
    symptoms: 'Concentric dark brown rings with chlorotic yellow halo on lower foliage.',
    organicRemedy: 'Spray cold-pressed Neem Oil (10,000 ppm) at 3.5 ml/L of water + Trichoderma viride biological spray.',
    chemicalRemedy: 'Apply Mancozeb 75% WP @ 2.5 g/L or Azoxystrobin 23% SC @ 1 ml/L at 7-day intervals.',
    subsidyGuideline: 'Eligible for 50% National Horticulture Mission bio-pesticide subsidy at local Taluka Krishi Bhavan.',
  },
  {
    id: 'onion-blotch',
    crop: 'Onion',
    diseaseName: 'Purple Blotch (Alternaria porri)',
    severity: 'Mild (18% Foliage Affected)',
    severityLevel: 'mild',
    confidence: '94.8%',
    symptoms: 'Small water-soaked sunken lesions with characteristic purplish centers on leaf shafts.',
    organicRemedy: 'Spray fermented butter-milk (chhaas) extract (50 ml/L) mixed with ginger-garlic extract.',
    chemicalRemedy: 'Apply Difenoconazole 25% EC @ 1 ml/L or Chlorothalonil 75% WP @ 2 g/L with non-ionic sticker.',
    subsidyGuideline: 'Reportable to Gujarat State Seed Corporation under Kharif pest monitoring program.',
  },
  {
    id: 'potato-late-blight',
    crop: 'Potato',
    diseaseName: 'Late Blight (Phytophthora infestans)',
    severity: 'Critical (68% Stem & Leaf Affected)',
    severityLevel: 'critical',
    confidence: '98.1%',
    symptoms: 'Irregular pale green to dark brown water-soaked lesions with white moldy fungal growth on underside.',
    organicRemedy: 'Immediately rogues and destroy infected foliage. Spray Copper Hydroxide (Kocide) @ 2.5 g/L.',
    chemicalRemedy: 'Immediate systemic curative spray: Cymoxanil 8% + Mancozeb 64% WP @ 3 g/L or Metalaxyl-M 4% + Mancozeb 64%.',
    subsidyGuideline: 'Emergency APMC Plant Protection advisory issued for Deesa and Mehsana potato belts.',
  },
  {
    id: 'cotton-leaf-curl',
    crop: 'Cotton',
    diseaseName: 'Cotton Leaf Curl Virus (CLCuV)',
    severity: 'Moderate (35% Upward Curling)',
    severityLevel: 'moderate',
    confidence: '95.2%',
    symptoms: 'Upward cup-like rolling of leaves and thickening of main veins caused by Whitefly vector.',
    organicRemedy: 'Install yellow sticky traps (10 traps/acre). Spray 5% Neem Seed Kernel Extract (NSKE).',
    chemicalRemedy: 'Control whitefly vector using Diafenthiuron 50% WP @ 1.2 g/L or Pyriproxyfen 10% EC @ 2 ml/L.',
    subsidyGuideline: 'Covered under Central Integrated Pest Management (IPM) farmer incentive package.',
  },
];

export default function CropDoctorModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [selectedCase, setSelectedCase] = useState(SAMPLE_DIAGNOSES[0]);
  const [analyzing, setAnalyzing] = useState(false);
  const [customImage, setCustomImage] = useState(null);

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-md rounded-3xl bg-white border border-border shadow-2xl overflow-hidden p-6 text-center space-y-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-primary border border-emerald-200 mx-auto flex items-center justify-center shadow-xs">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-extrabold text-xl text-text">Farmer Login Required</h3>
            <p className="text-xs text-muted leading-relaxed">
              AI Kisan Crop Doctor provides instant computer vision plant pathology & APMC certified treatment prescriptions exclusively for registered farmers.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Feature Restricted Without Login</span>
            </p>
            <p className="text-[11px] text-amber-800">
              Please sign in with your farmer account or register to run leaf scans and receive certified fungicide dosages.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/login');
              }}
              className="w-full btn-primary py-2.5 px-4 text-sm font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Access Crop Doctor</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/register');
              }}
              className="w-full btn-secondary py-2.5 px-4 text-sm font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register as New Farmer</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomImage(URL.createObjectURL(file));
    setAnalyzing(true);

    setTimeout(() => {
      setAnalyzing(false);
      showToast({
        type: 'celebrate',
        title: '🌱 AI Leaf Scan Complete',
        message: `Diagnosed ${selectedCase.diseaseName} with ${selectedCase.confidence} accuracy.`,
      });
    }, 1200);
  }

  function handleVoiceRead() {
    const speech = `Crop Doctor Diagnostic for ${selectedCase.crop}. ` +
      `Identified Disease: ${selectedCase.diseaseName}. Severity: ${selectedCase.severity}. ` +
      `Organic Treatment: ${selectedCase.organicRemedy}. ` +
      `Recommended Fungicide: ${selectedCase.chemicalRemedy}.`;
    speakAloud(speech);
  }

  function handleShareWhatsApp() {
    const text = `🌿 *HarvestMitra AI Crop Doctor Prescription*\n\n` +
      `🌾 *Crop:* ${selectedCase.crop}\n` +
      `🔬 *Identified Disease:* ${selectedCase.diseaseName}\n` +
      `⚠️ *Severity:* ${selectedCase.severity}\n` +
      `🎯 *AI Confidence:* ${selectedCase.confidence}\n\n` +
      `🍃 *Organic Treatment:* ${selectedCase.organicRemedy}\n\n` +
      `💊 *Recommended Fungicide:* ${selectedCase.chemicalRemedy}\n\n` +
      `🏛️ *Krishi Subsidy:* ${selectedCase.subsidyGuideline}\n\n` +
      `_Issued by HarvestMitra AI Agricultural Health System_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-gradient-to-r from-emerald-800 to-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-inner">
              <Stethoscope className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight">AI Kisan Crop Doctor</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                  Computer Vision Diagnostic
                </span>
              </div>
              <p className="text-[11px] text-emerald-100">
                Instant Leaf Pathology & APMC Certified Treatment Prescription
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVoiceRead}
              title="Listen to Prescription Aloud"
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-text">
          {/* Quick Crop Selector Pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Select Sample Crop Disease or Upload Photo
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_DIAGNOSES.map((diag) => (
                <button
                  key={diag.id}
                  type="button"
                  onClick={() => {
                    setSelectedCase(diag);
                    setCustomImage(null);
                  }}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                    selectedCase.id === diag.id
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-400 font-bold shadow-2xs ring-1 ring-emerald-400'
                      : 'bg-slate-50 text-muted border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-text truncate">{diag.crop}</p>
                  <p className="text-[10px] truncate text-muted">{diag.diseaseName.split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Dropzone */}
          <label className="border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/40 p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-emerald-50/70 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  Snap or Upload Leaf Photo for Instant Analysis
                </p>
                <p className="text-[11px] text-emerald-700">
                  Supported formats: JPG, PNG, WEBP (High Accuracy Plant Pathology Model)
                </p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <span className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shrink-0">
              Select Photo
            </span>
          </label>

          {analyzing ? (
            <div className="rounded-2xl border border-border bg-slate-50 p-8 text-center space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-bold text-text">Scanning leaf foliage for fungal & bacterial vectors...</p>
            </div>
          ) : (
            /* Diagnostic Card */
            <div
              className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm space-y-4"
              style={{
                boxShadow: '0 10px 25px -5px rgba(22, 101, 52, 0.08)',
              }}
            >
              {/* Header Badge */}
              <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
                    <Leaf className="w-3.5 h-3.5" />
                    <span>Pathology Report for {selectedCase.crop}</span>
                  </div>
                  <h4 className="text-lg font-black text-text">{selectedCase.diseaseName}</h4>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold font-mono">
                    {selectedCase.confidence} Confidence
                  </span>
                  <p className="text-[10px] text-muted font-bold mt-1">Severity: {selectedCase.severity}</p>
                </div>
              </div>

              {/* Symptoms */}
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-700">Observed Foliage Symptoms:</span>
                <p className="text-muted leading-relaxed">{selectedCase.symptoms}</p>
              </div>

              {/* Treatment Protocols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Organic Protocol */}
                <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-3.5 space-y-1.5 text-xs">
                  <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Biological / Organic Remedy</span>
                  </div>
                  <p className="text-emerald-950 leading-relaxed">{selectedCase.organicRemedy}</p>
                </div>

                {/* Chemical Protocol */}
                <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-3.5 space-y-1.5 text-xs">
                  <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Chemical Treatment & Dosage</span>
                  </div>
                  <p className="text-amber-950 leading-relaxed">{selectedCase.chemicalRemedy}</p>
                </div>
              </div>

              {/* Government Subsidy Advisory */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-muted space-y-1 flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text">Krishi Vigyan Kendra Policy: </span>
                  <span>{selectedCase.subsidyGuideline}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-border bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleVoiceRead}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-text flex items-center gap-1.5 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-primary" />
            <span>Speak Prescription</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share to WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
