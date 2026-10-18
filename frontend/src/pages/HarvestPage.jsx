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
  Building2,
  AlertCircle,
  HelpCircle,
  Layers,
  MapPin
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

function speakAloud(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

const AVAILABLE_CROPS = [
  { name: 'Tomato', defaultLocal: 22.5, defaultRegional: 28.0, defaultHold: 26.0 },
  { name: 'Onion', defaultLocal: 24.0, defaultRegional: 32.5, defaultHold: 29.5 },
  { name: 'Potato', defaultLocal: 16.0, defaultRegional: 21.0, defaultHold: 19.0 },
  { name: 'Cotton', defaultLocal: 72.0, defaultRegional: 84.0, defaultHold: 79.0 },
  { name: 'Wheat', defaultLocal: 27.5, defaultRegional: 33.0, defaultHold: 30.5 },
  { name: 'Soybean', defaultLocal: 44.0, defaultRegional: 52.0, defaultHold: 48.5 },
  { name: 'Pomegranate', defaultLocal: 85.0, defaultRegional: 110.0, defaultHold: 102.0 },
  { name: 'Grapes', defaultLocal: 65.0, defaultRegional: 88.0, defaultHold: 78.0 },
];

const MAHARASHTRA_REGIONAL_MANDIS = [
  { id: 'vashi', name: 'Mumbai Vashi Mega Terminal APMC', district: 'Mumbai', distanceKm: 165, bonusRatePercent: 1.25 },
  { id: 'pune', name: 'Pune APMC Central Market Yard', district: 'Pune', distanceKm: 45, bonusRatePercent: 1.15 },
  { id: 'nashik', name: 'Nashik Krishi Utpanna Bajar Samiti', district: 'Nashik', distanceKm: 180, bonusRatePercent: 1.20 },
  { id: 'solapur', name: 'Solapur APMC Main Mandi', district: 'Solapur', distanceKm: 240, bonusRatePercent: 1.18 },
  { id: 'kolhapur', name: 'Kolhapur Shahu Market Yard APMC', district: 'Kolhapur', distanceKm: 220, bonusRatePercent: 1.16 },
  { id: 'nagpur', name: 'Nagpur Cotton & Orange APMC Yard', district: 'Nagpur', distanceKm: 480, bonusRatePercent: 1.28 }
];

export default function HarvestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const farmerProfile = user?.FarmerProfile;
  const userDistrict = farmerProfile?.district || 'Pune';
  // Maximum harvest stock available on the farmer's land
  const userHarvestLimitKg = Number(farmerProfile?.currentHarvestKg) > 0 
    ? Number(farmerProfile.currentHarvestKg) 
    : 2000;

  // Selected crops & multi-crop product-wise quantities (Requirement 13)
  const initialCrops = useMemo(() => {
    if (farmerProfile?.mainCrop) {
      const parts = farmerProfile.mainCrop.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 0) return parts;
    }
    return ['Tomato'];
  }, [farmerProfile]);

  const [selectedCrops, setSelectedCrops] = useState(initialCrops);

  // Crop quantities: { [cropName]: { qty: number, unit: 'kg' | 'tonne' } }
  const [cropQuantities, setCropQuantities] = useState(() => {
    const init = {};
    initialCrops.forEach((c) => {
      init[c] = { qty: Math.min(1000, userHarvestLimitKg / initialCrops.length), unit: 'kg' };
    });
    return init;
  });

  const [targetRegionalMandi, setTargetRegionalMandi] = useState(MAHARASHTRA_REGIONAL_MANDIS[0]);
  const [transportMode, setTransportMode] = useState('shared'); // 'shared' or 'solo'
  const [damageRisk, setDamageRisk] = useState(5); // %
  const [holdingDays, setHoldingDays] = useState(5);
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  // Price overrides (defaults synced with DB)
  const [livePrices, setLivePrices] = useState({
    localRate: 22.5,
    regionalRate: 28.0,
    holdRate: 26.0
  });

  // Calculate total kilograms across all selected crops (Requirement 13 & 16)
  const totalEnteredKg = useMemo(() => {
    let sum = 0;
    selectedCrops.forEach((crop) => {
      const item = cropQuantities[crop];
      if (item && item.qty) {
        const val = Number(item.qty) || 0;
        sum += item.unit === 'tonne' ? val * 1000 : val;
      }
    });
    return sum;
  }, [selectedCrops, cropQuantities]);

  // Validation logic (Requirement 1 & 16)
  const validationError = useMemo(() => {
    if (selectedCrops.length === 0) {
      return 'Please select at least one crop commodity.';
    }
    for (const crop of selectedCrops) {
      const item = cropQuantities[crop];
      if (!item || Number(item.qty) <= 0) {
        return `Please enter a valid harvest quantity for ${crop}.`;
      }
    }
    if (totalEnteredKg <= 0) {
      return 'Total harvest quantity must be greater than 0 kg.';
    }
    if (totalEnteredKg > userHarvestLimitKg) {
      return `Entered total quantity (${totalEnteredKg.toLocaleString('en-IN')} kg) exceeds your available harvest-ready stock (${userHarvestLimitKg.toLocaleString('en-IN')} kg). Please reduce quantity or update your harvest profile.`;
    }
    return null;
  }, [selectedCrops, cropQuantities, totalEnteredKg, userHarvestLimitKg]);

  // Toggle crop selection
  const handleToggleCrop = (cropName) => {
    setSelectedCrops((prev) => {
      const exists = prev.includes(cropName);
      let updated;
      if (exists) {
        updated = prev.filter(c => c !== cropName);
        if (updated.length === 0) updated = [cropName];
      } else {
        updated = [...prev, cropName];
      }

      setCropQuantities((qPrev) => {
        if (!qPrev[cropName]) {
          return { ...qPrev, [cropName]: { qty: 500, unit: 'kg' } };
        }
        return qPrev;
      });

      return updated;
    });
  };

  // Update specific crop quantity or unit
  const handleUpdateQty = (cropName, qty, unit) => {
    setCropQuantities((prev) => ({
      ...prev,
      [cropName]: {
        qty: qty !== undefined ? qty : (prev[cropName]?.qty || 0),
        unit: unit !== undefined ? unit : (prev[cropName]?.unit || 'kg')
      }
    }));
  };

  // Sync prices from MySQL for active crop and mandis (Requirement 17)
  useEffect(() => {
    async function syncMandiPrices() {
      const primaryCrop = selectedCrops[0] || 'Tomato';
      const cropCfg = AVAILABLE_CROPS.find(c => c.name === primaryCrop) || AVAILABLE_CROPS[0];

      try {
        const response = await fetch(`${API_BASE_URL}/api/markets/prices?crop=${encodeURIComponent(primaryCrop)}`);
        if (!response.ok) return;
        const payload = await response.json();
        const records = payload.data || [];

        if (records.length > 0) {
          // Local APMC in Maharashtra
          const localMatch = records.find(r => 
            r.district?.toLowerCase().includes(userDistrict.toLowerCase()) ||
            r.market_name?.toLowerCase().includes(userDistrict.toLowerCase())
          );
          const localKg = localMatch ? localMatch.price_per_kg : records[0].price_per_kg;

          // Regional target Mandi (e.g. Vashi, Pune, Nashik)
          const regionalMatch = records.find(r => 
            r.market_name?.toLowerCase().includes(targetRegionalMandi.district.toLowerCase()) ||
            r.district?.toLowerCase().includes(targetRegionalMandi.district.toLowerCase())
          );
          const regionalKg = regionalMatch 
            ? regionalMatch.price_per_kg 
            : Math.round(localKg * targetRegionalMandi.bonusRatePercent);

          setLivePrices({
            localRate: Number(localKg) || cropCfg.defaultLocal,
            regionalRate: Number(regionalKg) || cropCfg.defaultRegional,
            holdRate: Number((localKg * 1.12).toFixed(1)) || cropCfg.defaultHold
          });
        }
      } catch (err) {
        console.warn('Mandi live price sync error:', err.message);
      }
    }

    syncMandiPrices();
  }, [selectedCrops, userDistrict, targetRegionalMandi]);

  // Strict Net Profit Calculations & Ranking (Requirement 14, 15, 17)
  const { scenarios, winningScenario, extraProfit } = useMemo(() => {
    const qty = totalEnteredKg > 0 ? totalEnteredKg : 1000;
    const isShared = transportMode === 'shared';

    // Route distances in Maharashtra
    const localDistanceKm = 20; // Avg distance to district APMC
    const regionalDistanceKm = targetRegionalMandi.distanceKm;

    // Freight calculation (₹26/km base, shared pooling gives 50% discount)
    const basePerKmRate = 26;
    const truckMultiplier = isShared ? 0.5 : 1.0;
    const localTransportCost = Math.round(Math.max(600, localDistanceKm * basePerKmRate * truckMultiplier * (qty / 1500)));
    const regionalTransportCost = Math.round(Math.max(1800, regionalDistanceKm * basePerKmRate * truckMultiplier * (qty / 1800)));

    // Cold storage cost: ₹180 per tonne / day
    const coldStorageCost = Math.round((qty / 1000) * 180 * Number(holdingDays));

    // Statutory APMC Cess (1.5% under Maharashtra APMC Act)
    const apmcCessRate = 0.015;
    const spoilageFactor = Math.max(0, 1 - Number(damageRisk) / 100);

    // 1. Local District Mandi
    const localRevenue = Math.round(qty * livePrices.localRate);
    const localCess = Math.round(localRevenue * apmcCessRate);
    const localNetProfit = localRevenue - localTransportCost - localCess;

    // 2. Regional Maharashtra Mega APMC
    const regionalRevenue = Math.round(qty * livePrices.regionalRate);
    const regionalCess = Math.round(regionalRevenue * apmcCessRate);
    const regionalNetProfit = regionalRevenue - regionalTransportCost - regionalCess;

    // 3. Cold Storage / Hold & Sell
    const holdRevenue = Math.round(qty * livePrices.holdRate * spoilageFactor);
    const holdCess = Math.round(holdRevenue * apmcCessRate);
    const holdNetProfit = holdRevenue - localTransportCost - coldStorageCost - holdCess;

    const list = [
      {
        id: 'regional',
        title: `Dispatch to ${targetRegionalMandi.name}`,
        sub: `Major Regional APMC (${targetRegionalMandi.distanceKm} km)`,
        mandi: targetRegionalMandi.name,
        pricePerKg: livePrices.regionalRate,
        grossRevenue: regionalRevenue,
        transportCost: regionalTransportCost,
        apmcCess: regionalCess,
        storageCost: 0,
        netProfit: regionalNetProfit,
        icon: Truck,
        badge: 'High Regional Demand',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        routeDistance: `${targetRegionalMandi.distanceKm} km route`
      },
      {
        id: 'local',
        title: `Sell at Local ${userDistrict} APMC`,
        sub: `Immediate Cash Settlement (~${localDistanceKm} km)`,
        mandi: `${userDistrict} APMC Market Yard`,
        pricePerKg: livePrices.localRate,
        grossRevenue: localRevenue,
        transportCost: localTransportCost,
        apmcCess: localCess,
        storageCost: 0,
        netProfit: localNetProfit,
        icon: Building2,
        badge: 'Lowest Logistics Friction',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        routeDistance: `${localDistanceKm} km local haul`
      },
      {
        id: 'hold',
        title: `Hold in Warehouse (${holdingDays} Days)`,
        sub: `Festive/Seasonal Price Surge Buffer`,
        mandi: `${userDistrict} Cold Storage Facility`,
        pricePerKg: livePrices.holdRate,
        grossRevenue: holdRevenue,
        transportCost: localTransportCost,
        apmcCess: holdCess,
        storageCost: coldStorageCost,
        netProfit: holdNetProfit,
        icon: Clock,
        badge: `${damageRisk}% Spoilage Factored`,
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        routeDistance: 'Local Warehouse'
      }
    ].sort((a, b) => b.netProfit - a.netProfit); // Strictly ranked by Net Profit (Requirement 14)

    const winner = list[0];
    const runnerUp = list[1];
    const diff = winner.netProfit - runnerUp.netProfit;

    return {
      scenarios: list,
      winningScenario: winner,
      extraProfit: Math.max(0, diff)
    };
  }, [totalEnteredKg, livePrices, transportMode, targetRegionalMandi, userDistrict, holdingDays, damageRisk]);

  function handleVoiceVerdict() {
    const speech = `Smart Harvest Decision Engine: You should ${winningScenario.title}. ` +
      `Your estimated take-home net profit is ${winningScenario.netProfit} rupees, ` +
      `which gives you ${extraProfit} rupees extra profit.`;
    speakAloud(speech);
    showToast({
      type: 'info',
      title: 'Voice Advisory',
      message: 'Speaking harvest verdict aloud...',
    });
  }

  function handleShareWhatsApp() {
    const cropsText = selectedCrops.map(c => {
      const item = cropQuantities[c];
      return `${item?.qty || 0} ${item?.unit || 'kg'} of ${c}`;
    }).join(', ');

    const text = `🌾 *HarvestMitra Smart Harvest Arbitrage Report (Maharashtra APMC)*\n\n` +
      `📦 *Crops:* ${cropsText} (Total: ${totalEnteredKg} kg)\n` +
      `🏆 *Optimal Strategy:* ${winningScenario.title}\n` +
      `💰 *Estimated Net Profit:* ${formatINR(winningScenario.netProfit)}\n` +
      `📈 *Extra Profit Earned:* +${formatINR(extraProfit)} higher!\n` +
      `🚚 *Logistics Mode:* ${transportMode === 'shared' ? 'Shared Truck Pooling (50% Off)' : 'Solo Freight'}\n` +
      `📍 *Target Mandi:* ${winningScenario.mandi}\n\n` +
      `_Net Profit = Gross Revenue - Transport - APMC Cess - Storage Costs_\n` +
      `_Generated by HarvestMitra Maharashtra APMC Decision Engine_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function handleBookTransportForWinner() {
    if (validationError) {
      showToast({
        type: 'error',
        title: 'Validation Block',
        message: 'Please resolve harvest quantity errors before booking transport.',
      });
      return;
    }

    showToast({
      type: 'celebrate',
      title: '🚚 Routing to Shared Transport...',
      message: `Pre-filling ${winningScenario.mandi} for ${totalEnteredKg} kg total cargo.`,
    });
    navigate('/transport');
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
      {/* Header Banner with 3D Depth Card */}
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
              <span>Maharashtra APMC Arbitrage & Profit Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              Smart Harvest Decision & Mandi Net Profit
            </h1>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm">
              Calculate genuine take-home cash after deducting transport logistics, statutory APMC market cess, and storage expenses across Maharashtra mandis.
            </p>
            {user?.isGuest && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-400/20 text-amber-200 border border-amber-300/40 text-xs font-semibold backdrop-blur-sm mt-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Active Guest Session: 4.5 Acres (Pune District) • Pre-loaded Simulator Active</span>
              </div>
            )}
          </div>

          {/* 3D Winning Verdict Snapshot Badge */}
          <div
            className="rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-tr from-emerald-600/90 to-primary/95 text-white p-4 shadow-2xl min-w-[250px] text-center backdrop-blur-md shrink-0"
            style={{
              transform: 'perspective(1000px) rotateX(1deg)',
              boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Ranked #1 Selling Strategy
            </span>
            <p className="text-base font-black mt-1 line-clamp-1">{winningScenario.title}</p>
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-mono font-bold">
              + {formatINR(extraProfit)} Extra Cash!
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Red Harvest Quantity Limit Validation Alert (Requirement 1 & 16) */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 shadow-sm flex items-start gap-3 animate-pulse">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-900">
              Harvest Quantity Validation Notice
            </h4>
            <p className="text-xs text-red-700 leading-relaxed font-medium">
              {validationError}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Parameters on Left, Ranked Multi-Mandi Arbitrage on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6">
        {/* Left Card: Multi-Crop Selection & Parameters */}
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm space-y-5">
          <div className="border-b border-border/80 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <span>Harvest Parameters</span>
            </h2>
            <div className="text-right">
              <span className="text-[11px] text-muted block">Farm Size: {farmerProfile?.farmSizeAcres || 4.5} Acres • Stock</span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {userHarvestLimitKg.toLocaleString('en-IN')} kg Ready
              </span>
            </div>
          </div>

          {/* Multi-Crop Selection Pills (Requirement 13) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                Select Crops to Sell (Multi-Select) *
              </label>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {selectedCrops.length} chosen
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_CROPS.map((crop) => {
                const isSelected = selectedCrops.includes(crop.name);
                return (
                  <button
                    key={crop.name}
                    type="button"
                    onClick={() => handleToggleCrop(crop.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-slate-50 text-text border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{crop.name}</span>
                    {isSelected ? <span>✓</span> : <span className="opacity-40">+</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product-Wise Quantities with kg / tonne toggle (Requirement 13 & 16) */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Crop-Wise Harvest Quantities</span>
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                totalEnteredKg > userHarvestLimitKg 
                  ? 'bg-red-100 text-red-800 border-red-300' 
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                Total: {totalEnteredKg.toLocaleString('en-IN')} kg
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {selectedCrops.map((crop) => {
                const item = cropQuantities[crop] || { qty: 500, unit: 'kg' };
                const inKg = item.unit === 'tonne' ? Number(item.qty) * 1000 : Number(item.qty);

                return (
                  <div
                    key={crop}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {crop}
                      </span>
                      <span className="text-[10px] text-muted font-mono">
                        {item.unit === 'tonne' ? `(= ${inKg.toLocaleString('en-IN')} kg)` : 'standard kg'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateQty(crop, Number(e.target.value), item.unit)}
                        className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-mono font-bold outline-none focus:border-primary text-right"
                      />

                      {/* Unit Toggle: kg vs tonne */}
                      <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(crop, item.qty, 'kg')}
                          className={`px-2 py-0.5 rounded-md transition-all ${
                            item.unit === 'kg'
                              ? 'bg-primary text-white shadow-2xs'
                              : 'text-slate-600 hover:text-black'
                          }`}
                        >
                          kg
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(crop, item.qty, 'tonne')}
                          className={`px-2 py-0.5 rounded-md transition-all ${
                            item.unit === 'tonne'
                              ? 'bg-primary text-white shadow-2xs'
                              : 'text-slate-600 hover:text-black'
                          }`}
                        >
                          tonne
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Regional Maharashtra APMC Dropdown (Requirement 15) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Target Regional Maharashtra APMC *</span>
            </label>
            <select
              value={targetRegionalMandi.id}
              onChange={(e) => {
                const found = MAHARASHTRA_REGIONAL_MANDIS.find(m => m.id === e.target.value);
                if (found) setTargetRegionalMandi(found);
              }}
              className="w-full rounded-xl border border-border px-3 py-2 text-xs font-semibold bg-white outline-none focus:border-primary"
            >
              {MAHARASHTRA_REGIONAL_MANDIS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.distanceKm} km from {userDistrict})
                </option>
              ))}
            </select>
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
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  transportMode === 'shared'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-2xs'
                    : 'bg-white text-muted border-slate-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Shared Pooling (~50% Off)</span>
              </button>

              <button
                type="button"
                onClick={() => setTransportMode('solo')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  transportMode === 'solo'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-muted border-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Dedicated Truck</span>
              </button>
            </div>
          </div>

          {/* Live APMC Price Inputs (Synced with DB) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-text flex items-center justify-between">
              <span>APMC Live Prices (₹ / kg)</span>
              <span className="text-[10px] text-emerald-700 font-semibold">Active Database Sync</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="space-y-1">
                <span className="text-[10px] text-muted font-bold block truncate">{userDistrict} APMC</span>
                <input
                  type="number"
                  step="0.5"
                  value={livePrices.localRate}
                  onChange={(e) => setLivePrices(prev => ({ ...prev, localRate: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-border px-2 py-1.5 bg-white font-mono font-bold text-xs"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] text-muted font-bold block truncate">{targetRegionalMandi.district}</span>
                <input
                  type="number"
                  step="0.5"
                  value={livePrices.regionalRate}
                  onChange={(e) => setLivePrices(prev => ({ ...prev, regionalRate: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-border px-2 py-1.5 bg-white font-mono font-bold text-xs"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] text-muted font-bold block truncate">Hold ({holdingDays}d)</span>
                <input
                  type="number"
                  step="0.5"
                  value={livePrices.holdRate}
                  onChange={(e) => setLivePrices(prev => ({ ...prev, holdRate: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-border px-2 py-1.5 bg-white font-mono font-bold text-xs"
                />
              </label>
            </div>
          </div>

          {/* Formula Assumptions Transparency Card (Requirement 14) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs space-y-1.5">
            <button
              type="button"
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="w-full flex items-center justify-between font-bold text-slate-700 hover:text-primary transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                <span>Net Profit Formula & Deductions Policy</span>
              </span>
              <span className="text-[10px] text-muted underline">{showFormulaDetails ? 'Hide' : 'Explain'}</span>
            </button>

            {showFormulaDetails && (
              <div className="pt-2 text-[11px] text-slate-600 space-y-1.5 border-t border-slate-200">
                <p className="font-mono bg-white p-2 rounded-lg border border-slate-200 text-slate-900 font-semibold">
                  Estimated Net Profit = Gross Revenue − Transport Cost − APMC Cess (1.5%) − Storage Fee
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                  <li><strong>Gross Revenue:</strong> Weight (kg) × Mandi Price (₹/kg)</li>
                  <li><strong>Transport Cost:</strong> Route km × ₹26/km (Shared pooling gives ~50% savings)</li>
                  <li><strong>APMC Cess:</strong> Statutory 1.5% fee under Maharashtra APMC Act</li>
                  <li><strong>Storage/Holding:</strong> ₹180 per tonne/day cold storage charge + 5% spoilage risk buffer</li>
                </ul>
              </div>
            )}
          </div>

          {/* Audio & WhatsApp Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleVoiceVerdict}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-text flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-primary" />
              <span>Speak Verdict</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 btn-primary py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share to WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Right Cards: Ranked Arbitrage Options (Requirement 14 & 15) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Ranked Selling Options by Net Profit</span>
            </h2>
            <span className="text-xs text-muted font-bold font-mono">Ranked #1 to #3</span>
          </div>

          {scenarios.map((item, index) => {
            const isWinner = index === 0;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className={`relative rounded-3xl border p-5 transition-all duration-300 ${
                  isWinner
                    ? 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-emerald-400 shadow-xl ring-2 ring-emerald-500/20'
                    : 'bg-white border-border shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Winner Crown Badge */}
                {isWinner && (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Rank #1 • Highest Net Profit</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isWinner ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        {item.sub} • {item.routeDistance}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                {/* Net Profit Big Display */}
                <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Estimated Take-Home Net Profit
                    </span>
                    <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      isWinner ? 'text-emerald-700' : 'text-slate-900'
                    }`}>
                      {formatINR(item.netProfit)}
                    </span>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-muted block">Mandi Rate:</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{item.pricePerKg} / kg
                    </span>
                  </div>
                </div>

                {/* Breakdown Deductions (Requirement 14) */}
                <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-muted block">Gross</span>
                    <span className="font-bold text-slate-800">{formatINR(item.grossRevenue)}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Transport</span>
                    <span className="font-bold text-red-600">- {formatINR(item.transportCost)}</span>
                  </div>
                  <div>
                    <span className="text-muted block">APMC Cess (1.5%)</span>
                    <span className="font-bold text-red-600">- {formatINR(item.apmcCess)}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Storage</span>
                    <span className="font-bold text-red-600">- {formatINR(item.storageCost)}</span>
                  </div>
                </div>

                {/* Winner Action CTA */}
                {isWinner && (
                  <div className="mt-4 pt-3 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Yields <strong>+{formatINR(extraProfit)}</strong> extra profit over alternative</span>
                    </span>

                    <button
                      type="button"
                      disabled={Boolean(validationError)}
                      onClick={handleBookTransportForWinner}
                      className={`btn-primary py-2 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm ${
                        validationError ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <span>Book Shared Truck for This Mandi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
