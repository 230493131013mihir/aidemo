import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  MapPin,
  Leaf,
  Calendar,
  Warehouse,
  Sliders,
  Info,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

import apiClient from '../services/apiClient';

import { API_BASE_URL } from '../config/apiConfig';

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

// Comprehensive Agronomic & Dynamic Parameters by Crop Commodity
export const CROP_PROFILES = {
  Tomato: {
    name: 'Tomato',
    marathi: 'टोमॅटो',
    category: 'perishable',
    categoryLabel: 'Perishable Horticulture (नाशवंत भाजीपाला)',
    categoryBadgeColor: 'bg-red-50 text-red-700 border-red-200',
    shelfLifeDays: 7,
    defaultHoldingDays: 4,
    maxHoldingDays: 10,
    defaultDamageRisk: 9.0, // % spoilage risk
    storageFacility: 'Cold Storage Facility (वातानुकूलित शीतगृह)',
    storageTypeShort: 'Cold Storage Holding',
    storageRatePerTonneDay: 220, // ₹220/tonne/day
    packagingLabel: 'Plastic Crate (क्रॅट्स पॅकिंग)',
    packagingRatePerKg: 0.60,
    typicalYieldKgPerAcre: 9500,
    defaultLocal: 22.5,
    defaultRegional: 28.0,
    holdPriceSurgeMultiplier: 1.10,
    arbitrageInsight: 'Perishable nature favors fast dispatch to high-demand regional metro APMCs (Vashi / Pune) with shared cold freight.',
  },
  Onion: {
    name: 'Onion',
    marathi: 'कांदा',
    category: 'semi-perishable',
    categoryLabel: 'Semi-Perishable (मध्यम टिकाऊ)',
    categoryBadgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    shelfLifeDays: 45,
    defaultHoldingDays: 30,
    maxHoldingDays: 60,
    defaultDamageRisk: 3.5,
    storageFacility: 'Ventilated Kanda Chawl / Rural Godown (कांदा चाळ / गोदाम)',
    storageTypeShort: 'Cold Storage Holding (Kanda Chawl)',
    storageRatePerTonneDay: 130, // ₹130/tonne/day
    packagingLabel: 'Mesh Net Bag (जाळीदार गोणी)',
    packagingRatePerKg: 0.35,
    typicalYieldKgPerAcre: 8500,
    defaultLocal: 24.0,
    defaultRegional: 32.5,
    holdPriceSurgeMultiplier: 1.35, // large post-harvest surge
    arbitrageInsight: 'Low spoilage rate makes 30-45 days storage in Kanda Chawl ideal for capturing off-season price surges.',
  },
  Potato: {
    name: 'Potato',
    marathi: 'बटाटा',
    category: 'semi-perishable',
    categoryLabel: 'Semi-Perishable Tuber (बटाटा साठवणूक)',
    categoryBadgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    shelfLifeDays: 60,
    defaultHoldingDays: 35,
    maxHoldingDays: 90,
    defaultDamageRisk: 3.0,
    storageFacility: 'Cold Storage / Sprout-Inhibited Warehouse',
    storageTypeShort: 'Cold Storage Holding',
    storageRatePerTonneDay: 160,
    packagingLabel: 'Jute Gunny Bag (तागाची गोणी)',
    packagingRatePerKg: 0.35,
    typicalYieldKgPerAcre: 9000,
    defaultLocal: 16.0,
    defaultRegional: 22.0,
    holdPriceSurgeMultiplier: 1.25,
    arbitrageInsight: 'Holding in cold storage yields solid off-harvest dividends with minimal shrinkage.',
  },
  'Green Chilli': {
    name: 'Green Chilli',
    marathi: 'हिरवी मिरची',
    category: 'perishable',
    categoryLabel: 'Perishable Spice (हिरवी मिरची)',
    categoryBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    shelfLifeDays: 10,
    defaultHoldingDays: 5,
    maxHoldingDays: 12,
    defaultDamageRisk: 8.5,
    storageFacility: 'Humidified Pre-Cooling Store',
    storageTypeShort: 'Cold Storage Holding',
    storageRatePerTonneDay: 230,
    packagingLabel: 'Perforated Crate (छिद्रयुक्त क्रेट)',
    packagingRatePerKg: 0.70,
    typicalYieldKgPerAcre: 4000,
    defaultLocal: 38.0,
    defaultRegional: 52.0,
    holdPriceSurgeMultiplier: 1.12,
    arbitrageInsight: 'Regional markets like Vashi offer up to 35% higher prices for fresh green chilli batches.',
  },
  Cotton: {
    name: 'Cotton',
    marathi: 'कापूस',
    category: 'cash-crop',
    categoryLabel: 'Commercial Fiber / Cash Crop (व्यापारी नगदी पीक)',
    categoryBadgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    shelfLifeDays: 300,
    defaultHoldingDays: 45,
    maxHoldingDays: 120,
    defaultDamageRisk: 0.8,
    storageFacility: 'Covered Ginning Yard / MSWC Warehouse',
    storageTypeShort: 'Cold Storage Holding (Warehouse)',
    storageRatePerTonneDay: 85,
    packagingLabel: 'Standard Cotton Bale Packaging',
    packagingRatePerKg: 0.45,
    typicalYieldKgPerAcre: 1200,
    defaultLocal: 72.0,
    defaultRegional: 86.0,
    holdPriceSurgeMultiplier: 1.18,
    arbitrageInsight: 'Extremely durable. Storing past peak arrival glut in Vidarbha/Marathwada yields maximum buyer premium.',
  },
  Wheat: {
    name: 'Wheat',
    marathi: 'गहू',
    category: 'grain',
    categoryLabel: 'Food Grain / Cereal (अन्नधान्य)',
    categoryBadgeColor: 'bg-stone-50 text-stone-700 border-stone-200',
    shelfLifeDays: 240,
    defaultHoldingDays: 60,
    maxHoldingDays: 180,
    defaultDamageRisk: 1.0,
    storageFacility: 'Dry Grain Warehouse / Silo (धान्य कोठार)',
    storageTypeShort: 'Cold Storage Holding (Grain Silo)',
    storageRatePerTonneDay: 90,
    packagingLabel: '50kg HDPE Woven Sack',
    packagingRatePerKg: 0.25,
    typicalYieldKgPerAcre: 1800,
    defaultLocal: 27.5,
    defaultRegional: 33.5,
    holdPriceSurgeMultiplier: 1.20,
    arbitrageInsight: 'Very safe to store. Holding 2 months until post-harvest procurement peaks beats immediate spot rates.',
  },
  Soybean: {
    name: 'Soybean',
    marathi: 'सोयाबीन',
    category: 'oilseed',
    categoryLabel: 'Oilseed Commodity (तेलबिया)',
    categoryBadgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    shelfLifeDays: 180,
    defaultHoldingDays: 45,
    maxHoldingDays: 120,
    defaultDamageRisk: 1.2,
    storageFacility: 'Central Warehouse / Oil Mill Godown',
    storageTypeShort: 'Cold Storage Holding (Dry Godown)',
    storageRatePerTonneDay: 95,
    packagingLabel: '50kg Gunny Bag',
    packagingRatePerKg: 0.25,
    typicalYieldKgPerAcre: 1400,
    defaultLocal: 44.0,
    defaultRegional: 53.0,
    holdPriceSurgeMultiplier: 1.22,
    arbitrageInsight: 'Oil mills offer substantial premiums after initial harvest floods recede. Excellent storage hedge.',
  },
  Pomegranate: {
    name: 'Pomegranate',
    marathi: 'डाळिंब',
    category: 'perishable',
    categoryLabel: 'High-Value Fruit / Export Horticulture (फळबाग)',
    categoryBadgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    shelfLifeDays: 25,
    defaultHoldingDays: 12,
    maxHoldingDays: 30,
    defaultDamageRisk: 5.0,
    storageFacility: 'Controlled Atmosphere (CA) Cold Store',
    storageTypeShort: 'Cold Storage Holding (CA Facility)',
    storageRatePerTonneDay: 260,
    packagingLabel: 'Corrugated 5-Ply Export Box',
    packagingRatePerKg: 0.90,
    typicalYieldKgPerAcre: 5500,
    defaultLocal: 85.0,
    defaultRegional: 115.0,
    holdPriceSurgeMultiplier: 1.15,
    arbitrageInsight: 'Direct dispatch to Mumbai Vashi terminal or export traders delivers highest profit margin.',
  },
  Grapes: {
    name: 'Grapes',
    marathi: 'द्राक्षे',
    category: 'perishable',
    categoryLabel: 'High-Value Fruit (नाशवंत फळ)',
    categoryBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    shelfLifeDays: 14,
    defaultHoldingDays: 6,
    maxHoldingDays: 18,
    defaultDamageRisk: 7.5,
    storageFacility: 'Rapid Pre-Cooling Cold Store',
    storageTypeShort: 'Cold Storage Holding (Pre-Cool Store)',
    storageRatePerTonneDay: 280,
    packagingLabel: 'Ventilated Grape Carton & Pouch',
    packagingRatePerKg: 1.10,
    typicalYieldKgPerAcre: 7500,
    defaultLocal: 65.0,
    defaultRegional: 92.0,
    holdPriceSurgeMultiplier: 1.12,
    arbitrageInsight: 'High perishability requires express shared cold freight to metro APMCs.',
  }
};

const AVAILABLE_CROPS = Object.keys(CROP_PROFILES).map((key) => ({
  name: key,
  ...CROP_PROFILES[key]
}));

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
  const { t, language } = useLanguage();

  const farmerProfile = user?.FarmerProfile;
  const userDistrict = farmerProfile?.district || 'Pune';
  const farmSizeAcres = Number(farmerProfile?.farmSizeAcres) > 0 ? Number(farmerProfile.farmSizeAcres) : 4.5;

  // Dynamic harvest stock available on the farmer's land
  const baseHarvestLimitKg = Number(farmerProfile?.currentHarvestKg) > 0 
    ? Number(farmerProfile.currentHarvestKg) 
    : 2000;

  // Selected crops & multi-crop product-wise quantities
  const initialCrops = useMemo(() => {
    if (farmerProfile?.mainCrop) {
      const parts = farmerProfile.mainCrop.split(',').map(s => s.trim()).filter(Boolean);
      const valid = parts.filter(p => CROP_PROFILES[p]);
      if (valid.length > 0) return valid;
    }
    return ['Tomato'];
  }, [farmerProfile]);

  const [selectedCrops, setSelectedCrops] = useState(initialCrops);
  const [activeCropTab, setActiveCropTab] = useState(initialCrops[0] || 'Tomato');

  // Crop quantities: { [cropName]: { qty: number, unit: 'kg' | 'tonne' } }
  const [cropQuantities, setCropQuantities] = useState(() => {
    const init = {};
    let storedPQ = null;
    const rawPQ = farmerProfile?.productQuantities || user?.farmerProfile?.productQuantities;
    if (typeof rawPQ === 'string') {
      try { storedPQ = JSON.parse(rawPQ); } catch {}
    } else if (typeof rawPQ === 'object' && rawPQ !== null) {
      storedPQ = rawPQ;
    }

    initialCrops.forEach((c) => {
      if (storedPQ && storedPQ[c]) {
        const entry = storedPQ[c];
        const val = typeof entry === 'object' ? Number(entry.qty || entry.harvestQuantityKg || 500) : Number(entry);
        const unit = (typeof entry === 'object' && entry.unit) ? entry.unit : 'kg';
        init[c] = { qty: val > 0 ? val : 500, unit };
      } else {
        init[c] = { qty: 500, unit: 'kg' };
      }
    });
    return init;
  });

  // Dynamically sync stored quantities from farmer profile when loaded
  useEffect(() => {
    let storedPQ = null;
    const rawPQ = farmerProfile?.productQuantities || user?.farmerProfile?.productQuantities;
    if (typeof rawPQ === 'string') {
      try { storedPQ = JSON.parse(rawPQ); } catch {}
    } else if (typeof rawPQ === 'object' && rawPQ !== null) {
      storedPQ = rawPQ;
    }

    if (storedPQ) {
      setCropQuantities((prev) => {
        const next = { ...prev };
        let changed = false;
        initialCrops.forEach((c) => {
          if (storedPQ[c]) {
            const entry = storedPQ[c];
            const val = typeof entry === 'object' ? Number(entry.qty || entry.harvestQuantityKg || 500) : Number(entry);
            const unit = (typeof entry === 'object' && entry.unit) ? entry.unit : 'kg';
            if (val > 0 && (!next[c] || next[c].qty === 175)) {
              next[c] = { qty: val, unit };
              changed = true;
            }
          }
        });
        return changed ? next : prev;
      });
    }
  }, [farmerProfile, user, initialCrops]);

  const location = useLocation();
  const weatherParams = location.state?.weatherParams;

  // Dynamic parameters per crop: { [cropName]: { holdingDays: number, damageRisk: number } }
  const [cropDynamicParams, setCropDynamicParams] = useState(() => {
    const init = {};
    const weatherRisk = weatherParams?.damageRisk || (weatherParams?.rainProbability >= 60 ? 15 : null);
    Object.keys(CROP_PROFILES).forEach((cropName) => {
      const profile = CROP_PROFILES[cropName];
      init[cropName] = {
        holdingDays: profile.defaultHoldingDays,
        damageRisk: weatherRisk !== null ? weatherRisk : profile.defaultDamageRisk,
      };
    });
    return init;
  });

  // Auto-apply pre-populated parameters from Weather page
  useEffect(() => {
    if (weatherParams && weatherParams.rainProbability !== undefined) {
      const appliedRisk = weatherParams.damageRisk || (weatherParams.rainProbability >= 60 ? 15 : 5);
      setCropDynamicParams((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((k) => {
          updated[k] = { ...updated[k], damageRisk: appliedRisk };
        });
        return updated;
      });
      showToast({
        type: weatherParams.rainProbability >= 60 ? 'warning' : 'info',
        title: `🌦️ Weather Applied: ${weatherParams.district || 'District'}`,
        message: `Rain Probability: ${weatherParams.rainProbability}%, Humidity: ${weatherParams.humidity}%. Storage holding damage risk adjusted to ${appliedRisk}%.`,
        duration: 6000
      });
    }
  }, [weatherParams]);

  // Synced Live prices per crop from API or fallback
  const [pricesByCrop, setPricesByCrop] = useState(() => {
    const init = {};
    Object.keys(CROP_PROFILES).forEach((c) => {
      const p = CROP_PROFILES[c];
      init[c] = {
        localRate: p.defaultLocal,
        regionalRate: p.defaultRegional,
        holdRate: Number((p.defaultLocal * p.holdPriceSurgeMultiplier).toFixed(1))
      };
    });
    return init;
  });

  const [targetRegionalMandi, setTargetRegionalMandi] = useState(MAHARASHTRA_REGIONAL_MANDIS[0]);
  const [transportMode, setTransportMode] = useState('shared'); // 'shared' or 'solo'
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const [isSyncingPrices, setIsSyncingPrices] = useState(false);

  // Active crop agronomic profile
  const activeProfile = useMemo(() => {
    return CROP_PROFILES[activeCropTab] || CROP_PROFILES.Tomato;
  }, [activeCropTab]);

  // Active crop dynamic parameters
  const activeParams = useMemo(() => {
    return cropDynamicParams[activeCropTab] || {
      holdingDays: activeProfile.defaultHoldingDays,
      damageRisk: activeProfile.defaultDamageRisk
    };
  }, [cropDynamicParams, activeCropTab, activeProfile]);

  // Backward-compatible holdingDays and damageRisk for active crop
  const holdingDays = activeParams.holdingDays;
  const damageRisk = activeParams.damageRisk;

  // Active crop live prices
  const activePrices = useMemo(() => {
    return pricesByCrop[activeCropTab] || {
      localRate: activeProfile.defaultLocal,
      regionalRate: activeProfile.defaultRegional,
      holdRate: Number((activeProfile.defaultLocal * activeProfile.holdPriceSurgeMultiplier).toFixed(1))
    };
  }, [pricesByCrop, activeCropTab, activeProfile]);

  // Backward-compatible livePrices object
  const livePrices = activePrices;

  // Calculate total kilograms across all selected crops
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

  // Dynamic harvest limit accommodating user input
  const userHarvestLimitKg = useMemo(() => {
    return Math.max(baseHarvestLimitKg, totalEnteredKg);
  }, [baseHarvestLimitKg, totalEnteredKg]);

  // Validation logic
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
    return null;
  }, [selectedCrops, cropQuantities, totalEnteredKg]);

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

      // Switch active tab if current active crop was deselected
      if (!updated.includes(activeCropTab)) {
        setActiveCropTab(updated[0]);
      }

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

  // Update dynamic agronomic parameter for a crop
  const handleUpdateCropParam = (cropName, key, value) => {
    setCropDynamicParams((prev) => ({
      ...prev,
      [cropName]: {
        ...(prev[cropName] || {}),
        [key]: Number(value)
      }
    }));
  };

  // Reset dynamic parameters of active crop to agronomic defaults
  const handleResetActiveCropParams = () => {
    setCropDynamicParams((prev) => ({
      ...prev,
      [activeCropTab]: {
        holdingDays: activeProfile.defaultHoldingDays,
        damageRisk: activeProfile.defaultDamageRisk
      }
    }));
    showToast({
      type: 'info',
      title: 'Parameters Reset',
      message: `Reset ${activeCropTab} parameters to agronomic recommendations.`
    });
  };

  // Sync prices from API for all selected crops
  useEffect(() => {
    let isMounted = true;
    async function syncAllCropPrices() {
      setIsSyncingPrices(true);
      try {
        const promises = selectedCrops.map(async (crop) => {
          const profile = CROP_PROFILES[crop] || CROP_PROFILES.Tomato;
          try {
            const response = await fetch(`${API_BASE_URL}/api/markets/prices?crop=${encodeURIComponent(crop)}`);
            if (!response.ok) return { crop, prices: null };
            const payload = await response.json();
            const records = payload.data || [];
            if (records.length > 0) {
              const localMatch = records.find(r => 
                r.district?.toLowerCase().includes(userDistrict.toLowerCase()) ||
                r.market_name?.toLowerCase().includes(userDistrict.toLowerCase())
              );
              const localKg = Number(localMatch ? localMatch.price_per_kg : records[0].price_per_kg) || profile.defaultLocal;

              const regionalMatch = records.find(r => 
                r.market_name?.toLowerCase().includes(targetRegionalMandi.district.toLowerCase()) ||
                r.district?.toLowerCase().includes(targetRegionalMandi.district.toLowerCase())
              );
              const regionalKg = Number(regionalMatch 
                ? regionalMatch.price_per_kg 
                : Math.round(localKg * targetRegionalMandi.bonusRatePercent)) || profile.defaultRegional;

              const holdKg = Number((localKg * profile.holdPriceSurgeMultiplier).toFixed(1)) || profile.defaultHold;

              return {
                crop,
                prices: {
                  localRate: localKg,
                  regionalRate: regionalKg,
                  holdRate: holdKg
                }
              };
            }
          } catch {
            // fallback
          }
          return { crop, prices: null };
        });

        const results = await Promise.all(promises);
        if (!isMounted) return;

        setPricesByCrop((prev) => {
          const updated = { ...prev };
          results.forEach(({ crop, prices }) => {
            if (prices) {
              updated[crop] = prices;
            }
          });
          return updated;
        });
      } finally {
        if (isMounted) setIsSyncingPrices(false);
      }
    }

    syncAllCropPrices();
    return () => { isMounted = false; };
  }, [selectedCrops, userDistrict, targetRegionalMandi]);

  // Calculate Crop-Specific Scenarios for any single crop
  const computeScenariosForCrop = (cropName) => {
    const profile = CROP_PROFILES[cropName] || CROP_PROFILES.Tomato;
    const params = cropDynamicParams[cropName] || {
      holdingDays: profile.defaultHoldingDays,
      damageRisk: profile.defaultDamageRisk
    };
    const prices = pricesByCrop[cropName] || {
      localRate: profile.defaultLocal,
      regionalRate: profile.defaultRegional,
      holdRate: Number((profile.defaultLocal * profile.holdPriceSurgeMultiplier).toFixed(1))
    };

    const item = cropQuantities[cropName] || { qty: 500, unit: 'kg' };
    const qty = item.unit === 'tonne' ? Number(item.qty) * 1000 : Number(item.qty);
    const validQty = qty > 0 ? qty : 500;

    const isShared = transportMode === 'shared';
    const localDistanceKm = 20;
    const regionalDistanceKm = targetRegionalMandi.distanceKm;

    const basePerKmRate = 26;
    const truckMultiplier = isShared ? 0.5 : 1.0;
    const minLocalCost = isShared ? 300 : 600;
    const minRegionalCost = isShared ? 900 : 1800;
    const localTransportCost = Math.round(Math.max(minLocalCost, localDistanceKm * basePerKmRate * truckMultiplier * (validQty / 1500)));
    const regionalTransportCost = Math.round(Math.max(minRegionalCost, regionalDistanceKm * basePerKmRate * truckMultiplier * (validQty / 1800)));

    // Dynamic crop storage and packaging
    const coldStorageCost = Math.round((validQty / 1000) * profile.storageRatePerTonneDay * Number(params.holdingDays));
    const packagingCost = Math.round(validQty * profile.packagingRatePerKg);
    const apmcCessRate = 0.015;

    // Spoilage calculation
    const spoilageLoss = Math.round(validQty * prices.holdRate * (Number(params.damageRisk) / 100));
    const spoilageFactor = Math.max(0, 1 - Number(params.damageRisk) / 100);

    // Option 1: Immediate Sale at Local Mandi
    const localRevenue = Math.round(validQty * prices.localRate);
    const localCess = Math.round(localRevenue * apmcCessRate);
    const localNetProfit = localRevenue - localTransportCost - localCess - packagingCost;

    // Option 2: Cold Storage Holding / Warehouse Holding
    const holdRevenue = Math.round(validQty * prices.holdRate * spoilageFactor);
    const holdCess = Math.round(holdRevenue * apmcCessRate);
    const holdNetProfit = holdRevenue - localTransportCost - coldStorageCost - holdCess - packagingCost;

    // Option 3: Regional APMC Terminal
    const regionalRevenue = Math.round(validQty * prices.regionalRate);
    const regionalCess = Math.round(regionalRevenue * apmcCessRate);
    const regionalNetProfit = regionalRevenue - regionalTransportCost - regionalCess - packagingCost;

    const list = [
      {
        id: `option-1-${cropName}`,
        optionNumber: 1,
        crop: cropName,
        title: language === 'mr' ? 'पर्याय १: स्थानिक बाजार समितीत त्वरित विक्री' : 'Option 1: Immediate Sale at Local Mandi',
        sub: language === 'mr' ? `त्वरित रोख पेमेंट (~${localDistanceKm} किमी) • शून्य साठवणूक नुकसान` : `Immediate Cash Settlement (~${localDistanceKm} km) • Zero Storage Loss`,
        mandi: `${userDistrict} APMC Market Yard`,
        pricePerKg: prices.localRate,
        grossRevenue: localRevenue,
        transportCost: localTransportCost,
        apmcCess: localCess,
        packagingCost: packagingCost,
        storageCost: 0,
        spoilageCost: 0,
        netProfit: localNetProfit,
        icon: Building2,
        badge: language === 'mr' ? 'किमान वाहतूक खर्च' : 'Lowest Logistics Friction',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        routeDistance: `${localDistanceKm} km local haul`,
        quantityKg: validQty
      },
      {
        id: `option-2-${cropName}`,
        optionNumber: 2,
        crop: cropName,
        title: language === 'mr' ? `पर्याय २: शीतगृहात साठवून नंतर विक्री (${params.holdingDays} दिवस)` : `Option 2: Cold Storage Holding (${params.holdingDays} Days)`,
        sub: `${profile.storageTypeShort} • ${profile.storageFacility}`,
        mandi: `${userDistrict} ${profile.storageFacility}`,
        pricePerKg: prices.holdRate,
        grossRevenue: holdRevenue,
        transportCost: localTransportCost,
        apmcCess: holdCess,
        packagingCost: packagingCost,
        storageCost: coldStorageCost,
        spoilageCost: spoilageLoss,
        netProfit: holdNetProfit,
        icon: Clock,
        badge: language === 'mr' ? `${params.damageRisk}% नासाडी जोखीम वजा` : `${params.damageRisk}% Spoilage Factored (${profile.category})`,
        badgeColor: profile.category === 'perishable' 
          ? 'bg-rose-100 text-rose-800 border-rose-300' 
          : 'bg-amber-100 text-amber-800 border-amber-300',
        routeDistance: `${profile.storageTypeShort} Haul`,
        quantityKg: validQty
      },
      {
        id: `option-3-${cropName}`,
        optionNumber: 3,
        crop: cropName,
        title: language === 'mr' ? `पर्याय ३: प्रादेशिक मुख्य बाजार समिती (${targetRegionalMandi.district})` : `Option 3: Regional APMC Terminal (${targetRegionalMandi.district})`,
        sub: language === 'mr' ? `मोठ्या शहरात जास्त भाव मागणी (${targetRegionalMandi.distanceKm} किमी मार्ग)` : `High Metro Consumer Demand (${targetRegionalMandi.distanceKm} km route)`,
        mandi: targetRegionalMandi.name,
        pricePerKg: prices.regionalRate,
        grossRevenue: regionalRevenue,
        transportCost: regionalTransportCost,
        apmcCess: regionalCess,
        packagingCost: packagingCost,
        storageCost: 0,
        spoilageCost: 0,
        netProfit: regionalNetProfit,
        icon: Truck,
        badge: language === 'mr' ? 'कमाल प्रादेशिक भाव' : (profile.category === 'perishable' ? 'Highest Metro Demand' : 'Regional Bulk Rate'),
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        routeDistance: `${targetRegionalMandi.distanceKm} km route`,
        quantityKg: validQty
      }
    ].sort((a, b) => b.netProfit - a.netProfit);

    const winner = list[0];
    const runnerUp = list[1];
    const diff = winner.netProfit - runnerUp.netProfit;

    return {
      scenarios: list,
      winningScenario: winner,
      extraProfit: Math.max(0, diff),
      profile,
      params,
      prices,
      quantityKg: validQty
    };
  };

  // Compute scenarios for active crop tab
  const activeCropAnalytics = useMemo(() => {
    return computeScenariosForCrop(activeCropTab);
  }, [activeCropTab, cropDynamicParams, pricesByCrop, cropQuantities, transportMode, targetRegionalMandi, userDistrict]);

  // Combined Portfolio Scenarios across all selected crops
  const portfolioAnalytics = useMemo(() => {
    const cropResults = selectedCrops.map(c => computeScenariosForCrop(c));

    // Aggregate by optionNumber (1, 2, 3)
    const optionsSum = [1, 2, 3].map(optNum => {
      let gross = 0;
      let freight = 0;
      let cess = 0;
      let pack = 0;
      let store = 0;
      let spoil = 0;
      let net = 0;

      cropResults.forEach(cr => {
        const matching = cr.scenarios.find(s => s.optionNumber === optNum);
        if (matching) {
          gross += matching.grossRevenue;
          freight += matching.transportCost;
          cess += matching.apmcCess;
          pack += matching.packagingCost;
          store += matching.storageCost;
          spoil += matching.spoilageCost;
          net += matching.netProfit;
        }
      });

      const titles = {
        1: language === 'mr' ? 'पर्याय १: स्थानिक बाजार समितीत त्वरित विक्री (सर्व पिके)' : 'Option 1: Immediate Sale at Local Mandi (All Crops)',
        2: language === 'mr' ? 'पर्याय २: शीतगृहात साठवून नंतर विक्री (सर्व पिके)' : `Option 2: Cold Storage Holding & Warehouse Holding (All Crops)`,
        3: language === 'mr' ? `पर्याय ३: प्रादेशिक मुख्य बाजार समिती (${targetRegionalMandi.district}) (सर्व पिके)` : `Option 3: Regional APMC Terminal (${targetRegionalMandi.district}) (All Crops)`
      };

      const subs = {
        1: language === 'mr' ? `सर्व ${selectedCrops.length} पिकांची स्थानिक बाजार समितीत विक्री` : `Local APMC Sale across ${selectedCrops.length} crops`,
        2: language === 'mr' ? `प्रत्येक पिकाच्या टिकाऊ क्षमतेनुसार साठवणूक` : `Staggered crop holding according to individual shelf lives`,
        3: language === 'mr' ? `${targetRegionalMandi.name} साठी एकत्रित वाहतूक` : `Combined logistics to ${targetRegionalMandi.name}`
      };

      return {
        id: `portfolio-option-${optNum}`,
        optionNumber: optNum,
        title: titles[optNum],
        sub: subs[optNum],
        mandi: optNum === 3 ? targetRegionalMandi.name : `${userDistrict} Central Mandi Hub`,
        pricePerKg: (gross / (totalEnteredKg || 1)).toFixed(1),
        grossRevenue: gross,
        transportCost: freight,
        apmcCess: cess,
        packagingCost: pack,
        storageCost: store,
        spoilageCost: spoil,
        netProfit: net,
        icon: optNum === 1 ? Building2 : optNum === 2 ? Clock : Truck,
        badge: optNum === 3 
          ? (language === 'mr' ? 'एकत्रित सामायिक मालवाहतूक' : 'Multi-Crop Consolidated Freight') 
          : optNum === 2 
          ? (language === 'mr' ? 'टिकाऊ साठवणूक नियोजन' : 'Agronomic Staggered Hold') 
          : (language === 'mr' ? 'त्वरित रोख रक्कम' : 'Quick Local Cash'),
        badgeColor: optNum === 3 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-800 border-slate-300',
        routeDistance: optNum === 3 ? `${targetRegionalMandi.distanceKm} km regional` : 'Local hauls'
      };
    }).sort((a, b) => b.netProfit - a.netProfit);

    const winner = optionsSum[0];
    const runnerUp = optionsSum[1];
    const diff = winner.netProfit - runnerUp.netProfit;

    // Optimal Mixed Arbitrage: Each crop goes to its own highest-profit scenario
    const optimalMixedProfit = cropResults.reduce((acc, cr) => acc + cr.winningScenario.netProfit, 0);

    return {
      cropResults,
      scenarios: optionsSum,
      winningScenario: winner,
      extraProfit: Math.max(0, diff),
      optimalMixedProfit
    };
  }, [selectedCrops, cropDynamicParams, pricesByCrop, cropQuantities, transportMode, targetRegionalMandi, userDistrict, totalEnteredKg]);

  // Displayed scenarios based on active view:
  const isPortfolioView = activeCropTab === 'ALL';
  const displayedAnalytics = isPortfolioView ? portfolioAnalytics : activeCropAnalytics;
  const scenarios = displayedAnalytics.scenarios;
  const winningScenario = displayedAnalytics.winningScenario;
  const extraProfit = displayedAnalytics.extraProfit;

  // Voice advisory text
  function handleVoiceVerdict() {
    let speech = '';
    if (isPortfolioView) {
      speech = `Multi-Crop Harvest Decision Engine: For your selected crops totaling ${totalEnteredKg} kilograms, ` +
        `the highest returning overall strategy is ${winningScenario.title}, generating an estimated net profit of ${winningScenario.netProfit} rupees, ` +
        `giving you ${extraProfit} rupees extra profit.`;
    } else {
      speech = `Harvest Decision Engine for ${activeCropTab}: Recommended strategy is ${winningScenario.title}. ` +
        `Estimated take-home net profit is ${winningScenario.netProfit} rupees with ${extraProfit} rupees advantage. ` +
        `${activeProfile.arbitrageInsight}`;
    }
    speakAloud(speech);
    showToast({
      type: 'info',
      title: 'Voice Advisory',
      message: `Speaking verdict for ${isPortfolioView ? 'Portfolio' : activeCropTab}...`,
    });
  }

  // WhatsApp share
  function handleShareWhatsApp() {
    let text = `🌾 *HarvestMitra Smart Harvest Arbitrage Report (Maharashtra APMC)*\n\n`;

    if (isPortfolioView) {
      text += `📦 *Multi-Crop Portfolio:* Total ${totalEnteredKg.toLocaleString('en-IN')} kg\n`;
      portfolioAnalytics.cropResults.forEach(cr => {
        text += ` • ${cr.profile.name} (${cr.quantityKg} kg): Best is ${cr.winningScenario.title} -> Net ${formatINR(cr.winningScenario.netProfit)}\n`;
      });
      text += `\n🏆 *Consolidated Winning Strategy:* ${winningScenario.title}\n`;
      text += `💰 *Portfolio Net Profit:* ${formatINR(winningScenario.netProfit)}\n`;
      text += `✨ *Combined Optimal Profit:* ${formatINR(portfolioAnalytics.optimalMixedProfit)}\n`;
    } else {
      text += `📦 *Crop:* ${activeProfile.name} (${activeProfile.marathi}) — ${activeCropAnalytics.quantityKg.toLocaleString('en-IN')} kg\n`;
      text += `⏱️ *Dynamic Parameters:* Shelf Life ${activeProfile.shelfLifeDays}d | Holding ${holdingDays}d | Spoilage Buffer ${damageRisk}%\n`;
      text += `🏭 *Facility:* ${activeProfile.storageFacility} (₹${activeProfile.storageRatePerTonneDay}/t/d)\n`;
      text += `🏆 *Rank #1 Strategy:* ${winningScenario.title}\n`;
      text += `💰 *Take-Home Net Profit:* ${formatINR(winningScenario.netProfit)}\n`;
      text += `📈 *Extra Cash Earned:* +${formatINR(extraProfit)} higher than runner-up!\n`;
      text += `💡 *Agronomic Rationale:* ${activeProfile.arbitrageInsight}\n`;
    }

    text += `🚚 *Logistics Mode:* ${transportMode === 'shared' ? 'Shared Truck Pooling (50% Off)' : 'Solo Dedicated Freight'}\n`;
    text += `📍 *Target Mandi:* ${winningScenario.mandi}\n\n`;
    text += `_Net Profit = (Quantity × Mandi Rate) - (Transport Freight + Mandi Cess + Packaging + Spoilage Risk)_\n`;
    text += `_Generated by HarvestMitra Maharashtra APMC Decision Engine_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  // CTA Dispatch booking
  function handleBookTransportForScenario(scenario) {
    if (validationError) {
      showToast({
        type: 'error',
        title: 'Validation Block',
        message: 'Please resolve harvest quantity errors before booking transport.',
      });
      return;
    }

    const target = scenario || winningScenario;
    const targetCrop = isPortfolioView ? selectedCrops.join(', ') : activeCropTab;
    const targetWeight = isPortfolioView ? totalEnteredKg : activeCropAnalytics.quantityKg;
    const isSolo = transportMode === 'solo';

    showToast({
      type: 'celebrate',
      title: isSolo ? '🚚 Routing to Dedicated Truck Transport...' : '🚚 Routing to Shared Transport...',
      message: `Pre-filling ${target.mandi} for ${targetWeight} kg ${targetCrop} (${isSolo ? 'Dedicated Truck' : 'Shared Pool'}).`,
    });

    navigate(`/transport?destination=${encodeURIComponent(target.mandi)}&weight=${targetWeight}&crop=${encodeURIComponent(targetCrop)}`, {
      state: {
        destination: target.mandi,
        weightKg: targetWeight,
        crop: targetCrop,
        transportMode: isSolo ? 'solo' : 'shared'
      }
    });
  }

  return (
    <div className="space-y-6 w-full max-w-full 2xl:max-w-[1720px] mx-auto py-4 sm:py-6 px-2 sm:px-4">
      {/* Module Hero Banner — Blue / Indigo Identity with Calculation & Harvest Planning Theme */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-blue-800/40 text-white animate-fade-slide-up">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/harvest-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-blue-950/88 to-indigo-950/80 backdrop-blur-[1px]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('harvest.badge', 'Maharashtra APMC Arbitrage & Profit Engine')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {t('harvest.heroTitle', 'Harvest Simulator & Net Take-Home Earnings')}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed drop-shadow-xs">
              {t('harvest.heroSubtitle', 'Calculate genuine take-home cash after deducting transport logistics, statutory APMC market cess, and storage expenses across Maharashtra mandis.')}
            </p>
            {user?.isGuest && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-400/20 text-blue-200 border border-blue-300/40 text-xs font-semibold backdrop-blur-sm mt-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>{language === 'mr' ? 'सक्रिय अतिथी सत्र: ४.५ एकर (पुणे जिल्हा) • सिम्युलेटर सक्रिय' : 'Active Guest Session: 4.5 Acres (Pune District) • Pre-loaded Simulator Active'}</span>
              </div>
            )}
          </div>

          {/* 3D Winning Verdict Snapshot Badge */}
          <div
            className="rounded-2xl border-2 border-blue-400/80 bg-gradient-to-tr from-blue-600/90 to-indigo-700/95 text-white p-4 shadow-2xl min-w-[260px] text-center backdrop-blur-md shrink-0 card-hover-elevate"
            style={{
              transform: 'perspective(1000px) rotateX(1deg)',
              boxShadow: '0 15px 30px -5px rgba(15, 23, 42, 0.4)',
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> {t('harvest.rankedStrategy', 'Ranked #1 Selling Strategy')}
            </span>
            <p className="text-base font-black mt-1 line-clamp-1">{winningScenario.title}</p>
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-mono font-bold">
              + {formatINR(extraProfit)} {language === 'mr' ? 'जास्तीचा नफा!' : 'Extra Cash!'}
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Red Harvest Quantity Limit Validation Alert */}
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

      {/* Dynamic Multi-Crop Switcher Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Simulation View:</span>
          </span>

          {selectedCrops.length > 1 && (
            <button
              type="button"
              onClick={() => setActiveCropTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                activeCropTab === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>All Selected Crops (Combined Portfolio)</span>
              <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.2 rounded-full">
                {selectedCrops.length}
              </span>
            </button>
          )}

          {selectedCrops.map((cropName) => {
            const prof = CROP_PROFILES[cropName] || CROP_PROFILES.Tomato;
            const isTabActive = activeCropTab === cropName;
            const q = cropQuantities[cropName] || { qty: 500, unit: 'kg' };

            return (
              <div
                key={cropName}
                onClick={() => setActiveCropTab(cropName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  isTabActive
                    ? 'bg-primary text-white border-primary shadow-xs ring-2 ring-primary/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Leaf className={`w-3.5 h-3.5 ${isTabActive ? 'text-amber-300' : 'text-emerald-600'}`} />
                  <span>{prof.name}</span>
                </div>

                {/* Dynamic User Input for Crop Weight */}
                <div 
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border transition-colors ${
                    isTabActive 
                      ? 'bg-black/15 border-white/30 text-white' 
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={q.qty}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      handleUpdateQty(cropName, val, q.unit);
                    }}
                    className={`w-14 text-right text-xs font-mono font-bold bg-transparent outline-none ${
                      isTabActive ? 'text-white' : 'text-slate-900'
                    }`}
                    aria-label={`${prof.name} Weight`}
                    title={`Adjust ${prof.name} harvest weight`}
                  />
                  <span className={`text-[10px] font-mono ${isTabActive ? 'text-white/80' : 'text-slate-500'}`}>
                    {q.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pr-2">
          {isSyncingPrices ? (
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
              <span>Syncing APMC Mandis...</span>
            </span>
          ) : (
            <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>MSAMB Verified Live</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Ranked Multi-Mandi Arbitrage on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6">
        {/* Left Card: Multi-Crop Selection & Dynamic Parameters */}
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm space-y-5">
          <div className="border-b border-border/80 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <span>Harvest Parameters</span>
            </h2>
            <div className="text-right">
              <span className="text-[11px] text-muted block">Farm Size: {farmSizeAcres || 4.5} Acres • Stock</span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {userHarvestLimitKg.toLocaleString('en-IN')} kg Ready
              </span>
            </div>
          </div>

          {/* Multi-Crop Selection Pills */}
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
                    <span className="text-[10px] opacity-75 font-normal">({crop.marathi})</span>
                    {isSelected ? <span>✓</span> : <span className="opacity-40">+</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Agronomic Profile Banner for Active Crop */}
          {!isPortfolioView && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-slate-50 to-teal-50/70 border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dynamic Agronomic Profile: {activeProfile.name} ({activeProfile.marathi})</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeProfile.categoryBadgeColor}`}>
                  {activeProfile.categoryLabel}
                </span>
              </div>

              {/* Agronomic Grid Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white border border-slate-200/90">
                  <span className="text-muted block text-[10px]">Natural Shelf Life</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {activeProfile.shelfLifeDays} Days
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/90">
                  <span className="text-muted block text-[10px]">Storage Cost</span>
                  <span className="font-bold text-slate-800 font-mono">
                    ₹{activeProfile.storageRatePerTonneDay} /t/day
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/90">
                  <span className="text-muted block text-[10px]">Packaging Crate/Bag</span>
                  <span className="font-bold text-slate-800 font-mono">
                    ₹{activeProfile.packagingRatePerKg.toFixed(2)} / kg
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/90">
                  <span className="text-muted block text-[10px]">{farmSizeAcres} Acre Yield Est.</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    ~{Math.round(farmSizeAcres * activeProfile.typicalYieldKgPerAcre).toLocaleString('en-IN')} kg
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl border border-slate-200">
                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Agronomic Arbitrage Key:</strong> {activeProfile.arbitrageInsight}
                </p>
              </div>
            </div>
          )}

          {/* Product-Wise Quantities with kg / tonne toggle */}
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
                const prof = CROP_PROFILES[crop] || CROP_PROFILES.Tomato;

                return (
                  <div
                    key={crop}
                    className={`p-2.5 rounded-xl bg-white border transition-all flex items-center justify-between gap-2 shadow-2xs ${
                      activeCropTab === crop ? 'border-primary ring-1 ring-primary/30' : 'border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {crop}
                        </span>
                        <span className="text-[10px] text-muted">({prof.marathi})</span>
                      </div>
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

          {/* Dynamic Holding & Spoilage Sliders for Active Crop */}
          {!isPortfolioView && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-primary" />
                  <span>Dynamic Storage & Spoilage Parameters: {activeCropTab}</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetActiveCropParams}
                  className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Holding Days */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-slate-700">Planned Hold Duration:</span>
                    <span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {holdingDays} Days
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={activeProfile.maxHoldingDays}
                    value={holdingDays}
                    onChange={(e) => handleUpdateCropParam(activeCropTab, 'holdingDays', e.target.value)}
                    className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>1 day</span>
                    <span>Safe limit: {activeProfile.shelfLifeDays}d</span>
                    <span>Max {activeProfile.maxHoldingDays}d</span>
                  </div>
                </div>

                {/* Spoilage Risk Buffer */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-slate-700">Spoilage Risk Buffer:</span>
                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                      damageRisk > 6 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {damageRisk}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={damageRisk}
                    onChange={(e) => handleUpdateCropParam(activeCropTab, 'damageRisk', e.target.value)}
                    className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>0% (Perfect)</span>
                    <span>Rec: {activeProfile.defaultDamageRisk}%</span>
                    <span>20% (High)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Target Regional Maharashtra APMC Dropdown */}
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
                id="transport-mode-shared-btn"
                onClick={() => setTransportMode('shared')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  transportMode === 'shared'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-2xs'
                    : 'bg-white text-muted border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Shared Pooling (~50% Off)</span>
              </button>

              <button
                type="button"
                id="transport-mode-solo-btn"
                onClick={() => setTransportMode('solo')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  transportMode === 'solo'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-muted border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Dedicated Truck</span>
              </button>
            </div>
          </div>

          {/* Live APMC Price Inputs for Active Crop */}
          {!isPortfolioView && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-text flex items-center justify-between">
                <span>{activeCropTab} APMC Live Prices (₹ / kg)</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Active Database Sync</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="space-y-1">
                  <span className="text-[10px] text-muted font-bold block truncate">{userDistrict} APMC</span>
                  <input
                    type="number"
                    step="0.5"
                    value={activePrices.localRate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPricesByCrop(prev => ({
                        ...prev,
                        [activeCropTab]: { ...prev[activeCropTab], localRate: val }
                      }));
                    }}
                    className="w-full rounded-lg border border-border px-2 py-1.5 bg-white font-mono font-bold text-xs"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] text-muted font-bold block truncate">{targetRegionalMandi.district} APMC</span>
                  <input
                    type="number"
                    step="0.5"
                    value={activePrices.regionalRate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPricesByCrop(prev => ({
                        ...prev,
                        [activeCropTab]: { ...prev[activeCropTab], regionalRate: val }
                      }));
                    }}
                    className="w-full rounded-lg border border-border px-2 py-1.5 bg-white font-mono font-bold text-xs"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] text-muted font-bold block truncate">Hold ({holdingDays}d)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={activePrices.holdRate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPricesByCrop(prev => ({
                        ...prev,
                        [activeCropTab]: { ...prev[activeCropTab], holdRate: val }
                      }));
                    }}
                    className="w-full rounded-lg border border-border px-2 py-1.5 bg-white font-mono font-bold text-xs"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Formula Assumptions Transparency Card */}
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
                <p className="font-mono bg-white p-2 rounded-lg border border-slate-200 text-slate-900 font-semibold text-[10.5px]">
                  Net Profit = (Quantity × Mandi Rate) − (Transport Freight + Mandi Cess + Packaging + Spoilage Risk)
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                  <li><strong>Gross Produce Value:</strong> Total Weight (kg) × Active APMC Modal Price (₹/kg)</li>
                  <li><strong>Transport Freight:</strong> Route distance (km) × ₹26/km (Shared pooling cuts 50%)</li>
                  <li><strong>Mandi Cess:</strong> Statutory 1.5% fee under Maharashtra APMC Act</li>
                  <li><strong>Packaging:</strong> Crop-specific ({activeProfile.packagingLabel} @ ₹{activeProfile.packagingRatePerKg}/kg)</li>
                  <li><strong>Storage & Spoilage:</strong> {activeProfile.storageFacility} (₹{activeProfile.storageRatePerTonneDay}/tonne/day) + {damageRisk}% spoilage buffer</li>
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

        {/* Right Cards: Ranked Arbitrage Options by Net Profit */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>
                {isPortfolioView ? 'Consolidated Multi-Crop Scenarios' : `${activeCropTab} Ranked Selling Options`}
              </span>
            </h2>
            <span className="text-xs text-muted font-bold font-mono">Ranked #1 to #3</span>
          </div>

          {/* Multi-Crop Breakdown Summary when Portfolio is viewed */}
          {isPortfolioView && (
            <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Crop-Wise Optimal Arbitrage Matrix</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  Total Optimal: {formatINR(portfolioAnalytics.optimalMixedProfit)}
                </span>
              </div>

              <div className="space-y-2">
                {portfolioAnalytics.cropResults.map((cr) => (
                  <div key={cr.profile.name} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white">{cr.profile.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({cr.quantityKg} kg)</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${cr.profile.categoryBadgeColor}`}>
                          {cr.profile.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-300 font-medium mt-0.5 block">
                        Best: {cr.winningScenario.title}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Take-Home Profit</span>
                      <span className="text-sm font-black font-mono text-emerald-400">
                        {formatINR(cr.winningScenario.netProfit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ranked Scenario Cards */}
          {scenarios.map((item, index) => {
            const isWinner = index === 0;
            const isOption3 = item.optionNumber === 3;
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
                    <span>Rank #1 • Highest Net Profit Strategy</span>
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

                {/* Breakdown Deductions (Formula Aligned) */}
                <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[9.5px] font-mono bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-muted block truncate">Gross</span>
                    <span className="font-bold text-slate-800">{formatINR(item.grossRevenue)}</span>
                  </div>
                  <div>
                    <span className="text-muted block truncate">Freight</span>
                    <span className="font-bold text-red-600">- {formatINR(item.transportCost)}</span>
                  </div>
                  <div>
                    <span className="text-muted block truncate">Cess (1.5%)</span>
                    <span className="font-bold text-red-600">- {formatINR(item.apmcCess)}</span>
                  </div>
                  <div>
                    <span className="text-muted block truncate">Packaging</span>
                    <span className="font-bold text-red-600">- {formatINR(item.packagingCost)}</span>
                  </div>
                  <div>
                    <span className="text-muted block truncate">Storage/Risk</span>
                    <span className="font-bold text-red-600">- {formatINR(item.storageCost + item.spoilageCost)}</span>
                  </div>
                </div>

                {/* Scenario Booking CTA Buttons */}
                {isWinner ? (
                  <div className="mt-4 pt-3 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Yields <strong>+{formatINR(extraProfit)}</strong> extra profit over runner-up</span>
                    </span>

                    <button
                      type="button"
                      id="cta-book-winning-mandi"
                      disabled={Boolean(validationError)}
                      onClick={() => handleBookTransportForScenario(item)}
                      className={`btn-primary py-2 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm ${
                        validationError ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <span>{transportMode === 'solo' ? 'Book Dedicated Truck for Winning Mandi' : 'Book Shared Truck for Winning Mandi'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : isOption3 ? (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-end">
                    <button
                      type="button"
                      id="cta-book-option-3"
                      disabled={Boolean(validationError)}
                      onClick={() => handleBookTransportForScenario(item)}
                      className={`px-3.5 py-1.5 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                        validationError ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{transportMode === 'solo' ? 'Book Dedicated Truck for Winning Mandi' : 'Book Shared Truck for Winning Mandi'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
