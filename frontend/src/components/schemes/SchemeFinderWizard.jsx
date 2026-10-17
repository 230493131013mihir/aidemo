import React, { useState } from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  Sprout, 
  UserCheck, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Info, 
  Sparkles,
  RotateCcw,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function SchemeFinderWizard({ onComplete, onCancel, initialData = {} }) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    state: initialData.state || 'Gujarat',
    district: initialData.district || 'Surat',
    farmSizeAcres: initialData.farmSizeAcres || '3.5',
    hasLandOwnership: true,
    crops: initialData.crops || ['Tomato'],
    irrigationMethod: 'drip', // 'drip' | 'sprinkler' | 'canal_borewell' | 'none'
    farmingType: 'conventional', // 'conventional' | 'organic' | 'converting'
    beneficiaryCategory: 'small_marginal', // 'small_marginal' | 'general' | 'women' | 'sc_st'
    age: '42'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleCropToggle(crop) {
    setForm(prev => {
      const exists = prev.crops.includes(crop);
      const updated = exists ? prev.crops.filter(c => c !== crop) : [...prev.crops, crop];
      return { ...prev, crops: updated.length > 0 ? updated : ['Tomato'] };
    });
  }

  async function handleFindSchemes() {
    setIsSubmitting(true);
    try {
      await onComplete(form);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-emerald-950/15 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Background ambient badge */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-emerald-950/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Personalized Discovery</span>
            </span>
            <span className="text-xs text-slate-500 font-bold">Step {step} of 3</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Find Matching Government Schemes for Your Farm
          </h2>
          <p className="text-xs text-slate-600">
            Answer 3 quick questions. Our deterministic engine matches official schemes from PM-KISAN, PMFBY, and i-Khedut Gujarat.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-900">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>
          <strong>Data Privacy Protected:</strong> We never ask for Aadhaar numbers, bank account numbers, passwords, or OTPs. All matching is performed transparently against official scheme rules.
        </span>
      </div>

      {/* Step Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
        <div 
          className="bg-primary transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* STEP 1: Location & Landholding */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              <span>1. Location and Landholding</span>
            </h3>
            <p className="text-xs text-slate-500">
              Needed to verify whether Central, Gujarat, or Maharashtra state-specific subsidies apply to your land.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State / રાજ્ય / राज्य *</label>
              <select
                value={form.state}
                onChange={e => updateField('state', e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Gujarat">Gujarat (ગુજરાત - i-Khedut Active)</option>
                <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
                <option value="Madhya Pradesh">Madhya Pradesh (मध्य प्रदेश)</option>
                <option value="Rajasthan">Rajasthan (राजस्थान)</option>
                <option value="All India">Other State / All India</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">District / જિલ્લો / ज़िला *</label>
              <input
                type="text"
                value={form.district}
                onChange={e => updateField('district', e.target.value)}
                placeholder="e.g. Surat, Anand, Pune, Nashik"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Land Ownership Status *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateField('hasLandOwnership', true)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    form.hasLandOwnership
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Own Land (7/12 Title)
                </button>
                <button
                  type="button"
                  onClick={() => updateField('hasLandOwnership', false)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    !form.hasLandOwnership
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tenant / Sharecropper
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Landholding Size (Acres) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.farmSizeAcres}
                  onChange={e => updateField('farmSizeAcres', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                  Acres
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {Number(form.farmSizeAcres) <= 5 ? 'Eligible as Small & Marginal Farmer (Higher subsidy)' : 'General Category Landholder'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Crops & Farming Setup */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-primary" />
              <span>2. Farming Practice & Irrigation</span>
            </h3>
            <p className="text-xs text-slate-500">
              Needed to discover crop-specific insurance, drip/sprinkler subsidies, and organic farming grants.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Crops Grown On Your Land</label>
            <div className="flex flex-wrap gap-1.5">
              {['Tomato', 'Wheat', 'Cotton', 'Onion', 'Potato', 'Rice', 'Soybean', 'Pomegranate', 'Grapes', 'Vegetables'].map(crop => {
                const isSelected = form.crops.includes(crop);
                return (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => handleCropToggle(crop)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {crop} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Irrigation Method *</label>
              <select
                value={form.irrigationMethod}
                onChange={e => updateField('irrigationMethod', e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="drip">Drip Irrigation (ટપક પદ્ધતિ)</option>
                <option value="sprinkler">Sprinkler Irrigation (ફુવારા પદ્ધતિ)</option>
                <option value="canal_borewell">Borewell / Canal Flood Irrigation</option>
                <option value="none">Rainfed / No Active Irrigation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Farming Type *</label>
              <select
                value={form.farmingType}
                onChange={e => updateField('farmingType', e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="conventional">Conventional (Standard farming)</option>
                <option value="organic">Certified Organic (PKVY eligible)</option>
                <option value="converting">Transitioning to Natural/Organic</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Beneficiary Category & Demographics */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-primary" />
              <span>3. Beneficiary Category & Age</span>
            </h3>
            <p className="text-xs text-slate-500">
              Schemes often give priority or additional 15%–35% subsidies to small farmers, women, and SC/ST categories.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Beneficiary Category *</label>
              <select
                value={form.beneficiaryCategory}
                onChange={e => updateField('beneficiaryCategory', e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="small_marginal">Small / Marginal Farmer (&lt; 5 Acres)</option>
                <option value="general">General Farmer (&gt; 5 Acres)</option>
                <option value="women">Women Farmer (મહિલા ખેડૂત)</option>
                <option value="sc_st">SC / ST Farmer (Higher GGRC Subsidy)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Farmer Age (Years) *</label>
              <input
                type="number"
                min="18"
                max="90"
                value={form.age}
                onChange={e => updateField('age', e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Used to determine eligibility for pension schemes (PM-KMY) and youth entrepreneurship funds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between border-t border-slate-200/80 pt-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setForm({
                state: 'Gujarat',
                district: 'Surat',
                farmSizeAcres: '3.5',
                hasLandOwnership: true,
                crops: ['Tomato'],
                irrigationMethod: 'drip',
                farmingType: 'conventional',
                beneficiaryCategory: 'small_marginal',
                age: '42'
              });
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Defaults</span>
          </button>
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark shadow-md shadow-primary/20 transition-all"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFindSchemes}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-700 hover:to-primary-dark shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>{isSubmitting ? 'Evaluating Scheme Rules...' : 'Calculate My Eligibility (10+ Schemes)'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
