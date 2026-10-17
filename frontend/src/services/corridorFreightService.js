/**
 * corridorFreightService.js
 * Agricultural Corridors Data, Freight Cost Calculator & Highway Distance Estimator
 * HarvestMitra AI - Logistics Engine (Issue #84)
 */

export const CORRIDORS = [
  {
    id: 'surat-navsari',
    name: 'Surat ➔ Navsari',
    origin: 'Surat Farm Hub, Gujarat',
    destination: 'Navsari APMC Mandi',
    distanceKm: 38,
    highway: 'NH 48 (Golden Quadrilateral)',
    estDuration: '45 mins',
    baseSoloCost: 1200,
    baseSharedCost: 450,
    weather: {
      status: 'Clear & Sunny',
      temp: '31°C',
      condition: 'clear',
      badgeText: '🟢 Clear Highway Conditions',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      advisory: 'Dry pavement, optimal visibility on NH 48. Ideal for delicate vegetable and fruit transit.'
    }
  },
  {
    id: 'surat-rajkot',
    name: 'Surat ➔ Rajkot',
    origin: 'Surat APMC Hub, Gujarat',
    destination: 'Rajkot APMC Yard',
    distanceKm: 430,
    highway: 'NH 48 & NH 47 (Saurashtra Highway)',
    estDuration: '7 hrs 30 mins',
    baseSoloCost: 8550,
    baseSharedCost: 3250,
    weather: {
      status: 'Breezy & Sunny',
      temp: '34°C',
      condition: 'wind',
      badgeText: '🌤️ Moderate Crosswinds (NH 47)',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      advisory: 'Crosswinds near Tarapur coastal bypass. Ensure cargo tarpaulin straps are doubled and secured.'
    }
  },
  {
    id: 'ahmedabad-surat',
    name: 'Ahmedabad ➔ Surat',
    origin: 'Ahmedabad APMC Hub, Gujarat',
    destination: 'Surat APMC Mandi',
    distanceKm: 265,
    highway: 'NE 1 & NH 48 Expressway',
    estDuration: '4 hrs 30 mins',
    baseSoloCost: 7950,
    baseSharedCost: 3100,
    weather: {
      status: 'Smooth Expressway Traffic',
      temp: '32°C',
      condition: 'clear',
      badgeText: '🟢 Express Highway Optimal',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      advisory: 'High-speed green corridor active. Dedicated heavy vehicle freight lane open with 0 toll delay.'
    }
  },
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
