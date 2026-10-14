import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  CheckCircle2, 
  IndianRupee, 
  TrendingUp, 
  Truck, 
  Clock, 
  Volume2, 
  Share2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Scale,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

// Speak aloud helper
function speakAloud(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

const CROPS = [
  { name: 'Tomato', defaultLocal: 18.5, defaultRegional: 24.0, defaultHold: 22.0 },
  { name: 'Potato', defaultLocal: 14.0, defaultRegional: 19.5, defaultHold: 17.5 },
  { name: 'Onion', defaultLocal: 21.0, defaultRegional: 29.0, defaultHold: 26.5 },
  { name: 'Wheat', defaultLocal: 26.0, defaultRegional: 31.5, defaultHold: 29.0 },
  { name: 'Chilli', defaultLocal: 45.0, defaultRegional: 62.0, defaultHold: 55.0 },
  { name: 'Cotton', defaultLocal: 68.0, defaultRegional: 78.5, defaultHold: 74.0 },
];

export default function HarvestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userCrop = user?.FarmerProfile?.mainCrop || 'Tomato';
  const userDistrict = user?.FarmerProfile?.district || 'Local';
  const userHarvestKg = Number(user?.FarmerProfile?.currentHarvestKg) || 1500;

  const [selectedCrop, setSelectedCrop] = useState(userCrop);
  const [quantityKg, setQuantityKg] = useState(userHarvestKg);
  const [transportMode, setTransportMode] = useState('shared'); // 'shared' or 'solo'
  const [damageRisk, setDamageRisk] = useState(6); // %
  const [holdingDays, setHoldingDays] = useState(5);

  const [localPrice, setLocalPrice] = useState(18.5);
  const [regionalPrice, setRegionalPrice] = useState(24.0);
  const [futurePrice, setFuturePrice] = useState(22.0);

  // Fetch live crop price from MySQL APMC database
  useEffect(() => {
    async function fetchLiveMandiPrices() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/market/prices?commodity=${selectedCrop}`);
        if (!response.ok) return;
        const payload = await response.json();
        const records = payload.data || [];

        if (records.length > 0) {
          // Look for local Surat/nearby APMC
          const localRecord = records.find(
            (r) =>
              r.Market?.name?.toLowerCase().includes('surat') ||
              r.market?.toLowerCase().includes('surat')
          );
          if (localRecord) {
            const kg = Number(localRecord.pricePerKg) || (Number(localRecord.modalPrice) / 100);
            if (kg > 0) setLocalPrice(Number(kg.toFixed(1)));
          } else if (records[0]) {
            const kg = Number(records[0].pricePerKg) || (Number(records[0].modalPrice) / 100);
            if (kg > 0) setLocalPrice(Number(kg.toFixed(1)));
          }

          // Regional APMC (Ahmedabad / Rajkot / Mumbai Vashi)
          const regionalRecord = records.find(
            (r) =>
              r.Market?.name?.toLowerCase().includes('ahmedabad') ||
              r.market?.toLowerCase().includes('ahmedabad') ||
              r.Market?.name?.toLowerCase().includes('rajkot') ||
              r.market?.toLowerCase().includes('rajkot') ||
              r.Market?.name?.toLowerCase().includes('mumbai') ||
              r.market?.toLowerCase().includes('mumbai')
          );
          if (regionalRecord) {
            const kg = Number(regionalRecord.pricePerKg) || (Number(regionalRecord.modalPrice) / 100);
            if (kg > 0) setRegionalPrice(Number(kg.toFixed(1)));
          } else {
            const cropCfg = CROPS.find((c) => c.name === selectedCrop) || CROPS[0];
            const baseKg = localRecord
              ? (Number(localRecord.pricePerKg) || Number(localRecord.modalPrice) / 100)
              : cropCfg.defaultLocal;
            setRegionalPrice(Number((baseKg * 1.25).toFixed(1)));
          }
        }
      } catch (err) {
        console.warn('Harvest page live price sync error:', err.message);
      }
    }

    const cropCfg = CROPS.find((c) => c.name === selectedCrop) || CROPS[0];
    setLocalPrice(cropCfg.defaultLocal);
    setRegionalPrice(cropCfg.defaultRegional);
    setFuturePrice(cropCfg.defaultHold);
    fetchLiveMandiPrices();
  }, [selectedCrop]);

  // Arbitrage simulation calculations
  const { scenarios, winningScenario, extraProfit } = useMemo(() => {
    const qty = Number(quantityKg) || 1000;
    const isShared = transportMode === 'shared';

    // Logistics rates: local is 15-25 km, regional is 220 km (Ahmedabad)
    const localTransportCost = Math.round(isShared ? 800 : 1500);
    const regionalTransportCost = Math.round(isShared ? 2400 : 5800);
    const coldStorageCost = Math.round((qty / 1000) * 180 * Number(holdingDays));

    const spoilageFactor = Math.max(0, 1 - Number(damageRisk) / 100);
    const mandiCessRate = 0.015; // 1.5% APMC cess

    // Option 1: Sell Today at Local APMC
    const localGross = Math.round(qty * Number(localPrice));
    const localCess = Math.round(localGross * mandiCessRate);
    const localNet = localGross - localTransportCost - localCess;

    // Option 2: Transport to Regional Hub
    const regionalGross = Math.round(qty * Number(regionalPrice));
    const regionalCess = Math.round(regionalGross * mandiCessRate);
    const regionalNet = regionalGross - regionalTransportCost - regionalCess;

    // Option 3: Hold & Sell in 5-7 Days
    const holdGross = Math.round(qty * Number(futurePrice) * spoilageFactor);
    const holdCess = Math.round(holdGross * mandiCessRate);
    const holdNet = holdGross - localTransportCost - coldStorageCost - holdCess;

    const list = [
      {
        id: 'regional',
        title: 'Dispatch to Regional Mega APMC',
        sub: 'High Demand Mega Mandi',
        mandi: 'Regional APMC Hub',
        pricePerKg: regionalPrice,
        gross: regionalGross,
        transportCost: regionalTransportCost,
        otherCosts: regionalCess,
        net: regionalNet,
        icon: Truck,
        badge: 'Maximum Net Profit',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      },
      {
        id: 'local',
        title: `Sell at Local ${userDistrict} APMC`,
        sub: 'Immediate Cash Settlement',
        mandi: `${userDistrict} APMC`,
        pricePerKg: localPrice,
        gross: localGross,
        transportCost: localTransportCost,
        otherCosts: localCess,
        net: localNet,
        icon: Building2,
        badge: 'Lowest Logistics Hassle',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      },
      {
        id: 'hold',
        title: `Hold in Warehouse (${holdingDays} Days)`,
        sub: 'Wait for Festive Price Surge',
        mandi: `${userDistrict} Cold Storage`,
        pricePerKg: futurePrice,
        gross: holdGross,
        transportCost: localTransportCost,
        otherCosts: coldStorageCost + holdCess,
        net: holdNet,
        icon: Clock,
        badge: `${damageRisk}% Spoilage Risk Factored`,
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      },
    ].sort((a, b) => b.net - a.net);

    const winner = list[0];
    const runnerUp = list[1];
    const diff = winner.net - runnerUp.net;

    return {
      scenarios: list,
      winningScenario: winner,
      extraProfit: Math.max(0, diff),
    };
  }, [quantityKg, selectedCrop, localPrice, regionalPrice, futurePrice, transportMode, damageRisk, holdingDays]);

  function handleVoiceVerdict() {
    const speech = `Smart Harvest Arbitrage Recommendation: You should ${winningScenario.title}. ` +
      `Your estimated take-home net profit is ${winningScenario.net} rupees, ` +
      `which gives you ${extraProfit} rupees extra profit compared to local selling.`;
    speakAloud(speech);
    showToast({
      type: 'info',
      title: 'Voice Assistant',
      message: 'Speaking harvest verdict aloud...',
    });
  }

  function handleShareWhatsApp() {
    const text = `🌾 *HarvestMitra Smart Harvest Arbitrage Report*\n\n` +
      `📦 *Commodity:* ${quantityKg} kg of ${selectedCrop}\n` +
      `🏆 *Winning Strategy:* ${winningScenario.title}\n` +
      `💰 *Net Take-Home Cash:* ${formatINR(winningScenario.net)}\n` +
      `📈 *Extra Profit Earned:* +${formatINR(extraProfit)} higher!\n` +
      `🚚 *Logistics Mode:* ${transportMode === 'shared' ? 'Shared Truck Pooling' : 'Dedicated Freight'}\n\n` +
      `_Generated by HarvestMitra Live APMC Decision Engine_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function handleBookTransportForWinner() {
    showToast({
      type: 'celebrate',
      title: '🚚 Routing to Transport Pooling...',
      message: `Pre-filling ${winningScenario.mandi} for ${quantityKg} kg of ${selectedCrop}.`,
    });
    navigate('/transport');
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
      {/* Header Photographic Banner with 3D Depth Card */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-900/30 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/harvest-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-amber-950/80 to-emerald-950/70 backdrop-blur-[1px]" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live MySQL APMC Arbitrage Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              Smart Harvest Decision & Mandi Arbitrage
            </h1>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm">
              Find the highest take-home net profit between local mandi, regional mega mandis with shared transport, or cold storage holding.
            </p>
          </div>

          {/* 3D Winning Verdict Snapshot Badge */}
          <div
            className="rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-tr from-emerald-600/90 to-primary/95 text-white p-4 shadow-2xl min-w-[240px] text-center backdrop-blur-md shrink-0"
            style={{
              transform: 'perspective(1000px) rotateX(1deg)',
              boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Optimal Harvest Decision
            </span>
            <p className="text-base font-black mt-1 line-clamp-1">{winningScenario.title}</p>
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-mono font-bold">
              + {formatINR(extraProfit)} Extra Take-Home!
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Parameters on Left, Real Multi-Mandi Arbitrage on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
        {/* Left Card: Crop & Simulation Controls */}
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm space-y-5">
          <div className="border-b border-border/80 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <span>Harvest Parameters</span>
            </h2>
            <span className="text-xs text-muted font-mono">Live APMC Synced</span>
          </div>

          {/* Crop Commodity Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">
              Select Crop Commodity *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CROPS.map((crop) => (
                <button
                  key={crop.name}
                  type="button"
                  onClick={() => setSelectedCrop(crop.name)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedCrop === crop.name
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-slate-50 text-text border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {crop.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-muted uppercase tracking-wider">Produce Weight</span>
              <span className="font-mono font-bold text-text bg-slate-100 px-2 py-0.5 rounded-md">
                {quantityKg} kg ({Number(quantityKg / 100).toFixed(1)} Quintals)
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="5000"
              step="100"
              value={quantityKg}
              onChange={(e) => setQuantityKg(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Transport Mode Switcher */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">
              Transport Logistics Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTransportMode('shared')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  transportMode === 'shared'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-2xs'
                    : 'bg-white text-muted border-slate-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Shared Pool (~55% Off)</span>
              </button>

              <button
                type="button"
                onClick={() => setTransportMode('solo')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  transportMode === 'solo'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-muted border-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Solo Full Truck</span>
              </button>
            </div>
          </div>

          {/* Editable Live APMC Rates */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="font-bold text-text flex items-center justify-between">
              <span>Live APMC Price Inputs (₹ / kg)</span>
              <span className="text-[10px] text-muted">Editable for fine-tuning</span>
            </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="space-y-1">
                  <span className="text-[10px] text-muted font-bold block">{userDistrict} APMC</span>
                  <input
                    type="number"
                    step="0.5"
                    value={localPrice}
                    onChange={(e) => setLocalPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-border px-2 py-1.5 bg-white font-mono font-bold text-xs"
                  />
                </label>

              <label className="space-y-1">
                <span className="text-[10px] text-muted font-bold block">Ahmedabad</span>
                <input
                  type="number"
                  step="0.5"
                  value={regionalPrice}
                  onChange={(e) => setRegionalPrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-border px-2 py-1.5 bg-white font-mono font-bold text-xs"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] text-muted font-bold block">Future (Hold)</span>
                <input
                  type="number"
                  step="0.5"
                  value={futurePrice}
                  onChange={(e) => setFuturePrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-border px-2 py-1.5 bg-white font-mono font-bold text-xs"
                />
              </label>
            </div>
          </div>

          {/* Audio & WhatsApp Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleVoiceVerdict}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-text flex items-center gap-1.5 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-primary" />
              <span>Speak Verdict</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 btn-primary py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Arbitrage to WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Right Cards: Ranked Arbitrage Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Ranked Profit Arbitrage Comparison</span>
            </h2>
            <span className="text-xs text-muted font-bold">Highest Net First</span>
          </div>

          {scenarios.map((item, index) => {
            const isWinner = index === 0;
            const Icon = item.icon;

            return (
              <article
                key={item.id}
                className={`rounded-3xl border p-5 shadow-xs transition-all relative overflow-hidden ${
                  isWinner
                    ? 'border-2 border-emerald-500 bg-emerald-50/40 shadow-md ring-1 ring-emerald-500/20'
                    : 'border-border bg-white hover:border-slate-300'
                }`}
                style={
                  isWinner
                    ? {
                        transform: 'perspective(1000px) rotateX(0.5deg)',
                      }
                    : {}
                }
              >
                {/* Winner Ribbon */}
                {isWinner && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-primary text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-bl-xl shadow-xs">
                    ★ Recommended Winning Mandi
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-extrabold text-base text-text">{item.title}</h3>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      {item.sub} • Rate: <span className="font-mono font-bold text-text">₹{item.pricePerKg} / kg</span>
                    </p>
                  </div>

                  <span className={`badge-tag text-[11px] font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                {/* Financial Ledger Grid */}
                <div className="grid grid-cols-3 gap-2.5 mt-4 text-xs">
                  <div className="rounded-2xl bg-white/80 border border-slate-200 p-3">
                    <p className="text-[10px] text-muted font-bold uppercase">Gross Mandi Sale</p>
                    <p className="font-extrabold text-text font-mono text-sm mt-0.5">
                      {formatINR(item.gross)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/80 border border-slate-200 p-3">
                    <p className="text-[10px] text-muted font-bold uppercase">Transport & Cess</p>
                    <p className="font-extrabold text-red-600 font-mono text-sm mt-0.5">
                      - {formatINR(item.transportCost + item.otherCosts)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-100/90 border border-emerald-300 p-3">
                    <p className="text-[10px] text-emerald-900 font-black uppercase">Take-Home Net</p>
                    <p className="font-black text-emerald-950 font-mono text-base mt-0.5">
                      {formatINR(item.net)}
                    </p>
                  </div>
                </div>

                {/* 1-Click Winner Action */}
                {isWinner && (
                  <div className="mt-4 pt-3 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-emerald-900 font-bold">
                      Earn <span className="text-emerald-950 underline font-extrabold">+{formatINR(extraProfit)} more</span> in your pocket!
                    </div>

                    <button
                      type="button"
                      onClick={handleBookTransportForWinner}
                      className="btn-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Book Shared Truck for Winning Mandi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
