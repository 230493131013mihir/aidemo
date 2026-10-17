/**
 * corridorFreightService.js
 * Maharashtra Agricultural Corridors Data, Freight Cost Calculator & Highway Distance Estimator
 * Strictly Maharashtra APMC Hubs & Mandis
 * HarvestMitra AI - Logistics Engine
 */

export const CORRIDORS = [
  {
    id: 'nashik-vashi',
    name: 'Nashik ➔ Vashi (Mumbai)',
    origin: 'Nashik Onion & Grape Yard, Maharashtra',
    destination: 'Vashi APMC, Navi Mumbai',
    distanceKm: 165,
    highway: 'NH 160 (Kasara Ghat Section)',
    estDuration: '3 hrs 45 mins',
    baseSoloCost: 5200,
    baseSharedCost: 1950,
    weather: {
      status: 'Wet Surface & Hill Mist',
      temp: '24°C',
      condition: 'rain',
      badgeText: '🟡 Wet Surface Advisory (Kasara Ghat)',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
      advisory: 'Intermittent rainfall on Kasara Ghat incline. Maintain 40 km/h speed limit and 50m vehicle spacing.'
    }
  },
  {
    id: 'pune-vashi',
    name: 'Pune ➔ Vashi (Mumbai)',
    origin: 'Pune APMC Market Yard, Maharashtra',
    destination: 'Vashi APMC, Navi Mumbai',
    distanceKm: 148,
    highway: 'Yashwantrao Chavan Expressway (NE 2)',
    estDuration: '2 hrs 45 mins',
    baseSoloCost: 4800,
    baseSharedCost: 1800,
    weather: {
      status: 'Expressway Clear Traffic',
      temp: '28°C',
      condition: 'clear',
      badgeText: '🟢 Expressway Green Corridor',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      advisory: 'Optimal concrete surface conditions. Heavy vehicle express lane moving at 60 km/h with 0 toll delays.'
    }
  },
  {
    id: 'kolhapur-pune',
    name: 'Kolhapur ➔ Pune APMC',
    origin: 'Kolhapur Jaggery & Cane Hub, Maharashtra',
    destination: 'Pune APMC Market Yard',
    distanceKm: 235,
    highway: 'NH 48 (Western Maharashtra Agri Corridor)',
    estDuration: '4 hrs 30 mins',
    baseSoloCost: 7200,
    baseSharedCost: 2700,
    weather: {
      status: 'Dry & Sunny Pavement',
      temp: '31°C',
      condition: 'clear',
      badgeText: '🟢 Clear Highway Conditions (NH 48)',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      advisory: 'Dry highway surface throughout Satara-Pune stretch. Perfect for fresh jaggery and vegetable transport.'
    }
  },
  {
    id: 'nagpur-amravati',
    name: 'Nagpur ➔ Amravati APMC',
    origin: 'Nagpur Orange & Soybean Yard, Maharashtra',
    destination: 'Amravati APMC Yard',
    distanceKm: 155,
    highway: 'NH 53 (Vidarbha Citrus & Cotton Corridor)',
    estDuration: '3 hrs 15 mins',
    baseSoloCost: 4900,
    baseSharedCost: 1850,
    weather: {
      status: 'Mild Breeze & Clear Skies',
      temp: '33°C',
      condition: 'wind',
      badgeText: '🌤️ Stable Vidarbha Transit (NH 53)',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      advisory: 'Clear highway visibility. Ensure fruit crate ventilation and secure side tarpaulin ropes.'
    }
  }
];

export function calculateCorridorFreight(corridor, cargoWeightKg = 500) {
  if (!corridor) return null;
  const weightFactor = Math.max(0.4, Number(cargoWeightKg) / 500);
  const soloCost = Math.round(corridor.baseSoloCost * Math.max(1, (weightFactor - 1) * 0.25 + 1));
  const sharedCost = Math.round(corridor.baseSharedCost * weightFactor);
  const savings = Math.max(0, soloCost - sharedCost);
  const savingsPercent = soloCost > 0 ? Math.round((savings / soloCost) * 100) : 0;

  return {
    soloCost,
    sharedCost,
    savings,
    savingsPercent
  };
}
