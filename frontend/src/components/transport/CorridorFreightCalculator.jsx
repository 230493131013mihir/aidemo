import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  MapPin, 
  Truck, 
  Navigation, 
  ShieldCheck, 
  AlertTriangle, 
  Sun, 
  CloudRain, 
  Wind, 
  TrendingDown, 
  ArrowRight, 
  Sparkles,
  Volume2,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { CORRIDORS, calculateCorridorFreight } from '../../services/corridorFreightService';

export default function CorridorFreightCalculator({ onApplyCorridor, defaultWeight = 500 }) {
  const { language } = useLanguage();
  const [selectedCorridorId, setSelectedCorridorId] = useState('nashik-vashi');
  const [cargoWeightKg, setCargoWeightKg] = useState(defaultWeight || 500);
  const [applied, setApplied] = useState(false);

  const selectedCorridor = useMemo(() => {
    return CORRIDORS.find((c) => c.id === selectedCorridorId) || CORRIDORS[0];
  }, [selectedCorridorId]);

  // Dynamic cost calculation based on cargo weight & corridor distance
  const calculations = useMemo(() => {
    return calculateCorridorFreight(selectedCorridor, cargoWeightKg);
  }, [selectedCorridor, cargoWeightKg]);

  const handleApply = () => {
    if (onApplyCorridor) {
      onApplyCorridor({
        corridor: selectedCorridor,
        origin: selectedCorridor.origin,
        destination: selectedCorridor.destination,
        weightKg: cargoWeightKg,
        calculations
      });
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    }
  };

  const speakQuote = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = `${selectedCorridor.name}, अंतर ${selectedCorridor.distanceKm} किलोमीटर. खाजगी ट्रक भाडे रुपये ${calculations.soloCost}. शेअर्ड पूलिंग भाडे फक्त रुपये ${calculations.sharedCost}, तुमची बचत रुपये ${calculations.savings}, म्हणजेच ${calculations.savingsPercent} टक्के सूट. रस्ता स्थिती: ${selectedCorridor.weather.badgeText}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div id="corridor-freight-calculator" className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm hover:shadow-md transition-all space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>Maharashtra Highway Route Distance & Freight Savings Estimator</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Maharashtra Highway Route Distance & Freight Savings Estimator
          </h2>
          <p className="text-xs text-slate-600">
            Compare Solo Truck Freight vs Shared Pooled Freight across Maharashtra APMC corridors with calculated savings (e.g., Nashik-Vashi 165km saves ₹3,250/62%, Kolhapur-Pune 235km saves ₹4,500/62%) and route weather advisory badges.
          </p>
        </div>

        <button
          type="button"
          onClick={speakQuote}
          title="Listen to freight quote aloud"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Listen Aloud (मराठी / हिन्दी)</span>
        </button>
      </div>

      {/* Corridor Selection Pills */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Select Maharashtra Agricultural Transport Corridor:
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {CORRIDORS.map((corridor) => {
            const isSelected = corridor.id === selectedCorridorId;
            return (
              <button
                key={corridor.id}
                type="button"
                onClick={() => setSelectedCorridorId(corridor.id)}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 tracking-tight">
                      {corridor.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {corridor.distanceKm} km
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {corridor.highway.split('(')[0]}
                  </p>
                </div>

                <div className="mt-2 text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                  <span>From ₹{corridor.baseSharedCost}</span>
                  <span className="text-[10px] text-slate-400 font-normal">pooled</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Corridor Deep Dive & Calculator Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Corridor Specs & Weight Controls */}
        <div className="lg:col-span-6 space-y-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Highway Corridor Details
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                ~{selectedCorridor.estDuration} Transit
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Origin Pickup Point:</span>
                  <span className="font-bold text-slate-800">{selectedCorridor.origin}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Navigation className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination APMC Mandi:</span>
                  <span className="font-bold text-slate-800">{selectedCorridor.destination}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Highway Route & Distance:</span>
                  <span className="font-semibold text-slate-700">{selectedCorridor.highway} • <strong>{selectedCorridor.distanceKm} km</strong></span>
                </div>
              </div>
            </div>

            {/* Cargo Weight Adjustment */}
            <div className="pt-2 border-t border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="corridor-weight-input" className="font-bold text-slate-700">
                  Cargo Weight for Freight Quote:
                </label>
                <span className="font-mono font-black text-emerald-800 text-sm">
                  {cargoWeightKg} kg ({Math.round(cargoWeightKg / 100 * 10) / 10} Quintals)
                </span>
              </div>
              <input
                id="corridor-weight-input"
                type="range"
                min="100"
                max="2500"
                step="50"
                value={cargoWeightKg}
                onChange={(e) => setCargoWeightKg(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>100 kg (Mini)</span>
                <span>500 kg (Standard)</span>
                <span>1,200 kg (Bolero)</span>
                <span>2,500 kg (Tata 407)</span>
              </div>
            </div>
          </div>

          {/* Route Weather & Highway Safety Badge */}
          <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Route Weather Advisory & Highway Safety Badges:
            </span>
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${selectedCorridor.weather.badgeColor}`}>
              {selectedCorridor.weather.condition === 'rain' ? (
                <CloudRain className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : selectedCorridor.weather.condition === 'wind' ? (
                <Wind className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Sun className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs">
                    {selectedCorridor.weather.badgeText}
                  </span>
                  <span className="text-[11px] font-mono font-semibold">
                    ({selectedCorridor.weather.temp})
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {selectedCorridor.weather.advisory}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Solo vs Shared Cost Comparison Card */}
        <div className="lg:col-span-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-300">
                💰 Solo Truck Freight vs Shared Pooled Freight
              </span>
              <span className="text-[11px] text-slate-300 font-mono">
                {selectedCorridor.distanceKm} km Highway Run
              </span>
            </div>

            {/* Solo vs Shared Big Comparison */}
            <div className="grid grid-cols-2 gap-3">
              {/* Solo Cost Box */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold uppercase">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Solo Truck Freight</span>
                </div>
                <p className="text-xl sm:text-2xl font-black font-mono text-slate-300 line-through decoration-rose-500/80 decoration-2">
                  ₹{calculations.soloCost.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-slate-400 block">
                  Full vehicle hiring cost
                </span>
              </div>

              {/* Shared Pool Cost Box */}
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 space-y-1 relative overflow-hidden">
                <div className="absolute top-1 right-1.5">
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950">
                    Recommended
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-bold uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Shared Pooled Freight</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  ₹{calculations.sharedCost.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-emerald-300/80 block">
                  Pay only for your weight
                </span>
              </div>
            </div>

            {/* Savings Callout Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">
                    Verified Farmer Savings
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    Save ₹{calculations.savings.toLocaleString('en-IN')} on this trip
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-emerald-300 font-mono">
                  {calculations.savingsPercent}% OFF
                </span>
                <span className="text-[10px] text-slate-300 block">vs solo booking</span>
              </div>
            </div>
          </div>

          {/* Action: Apply Corridor to Booking */}
          <div className="pt-2">
            <button
              type="button"
              id="apply-corridor-btn"
              onClick={handleApply}
              className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                applied
                  ? 'bg-emerald-500 text-slate-950 scale-95'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-500/25'
              }`}
            >
              {applied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Corridor Applied to Booking Form!</span>
                </>
              ) : (
                <>
                  <span>Apply This Route & Rate to Booking</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Populates pickup origin, destination APMC mandi, and weight directly into your dispatch form.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
