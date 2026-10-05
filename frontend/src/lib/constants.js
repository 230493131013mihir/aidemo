/**
 * HarvestMitra AI System Constants
 */

export const APP_CONFIG = {
  name: 'HarvestMitra AI',
  version: '0.4.0',
  defaultLanguage: 'en',
  defaultMandiDistanceKm: 15,
};

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  MARKETS: '/markets',
  HARVEST: '/harvest',
  TRANSPORT: '/transport',
  WEATHER: '/weather',
  CHAT: '/chat',
  PROFILE: '/profile',
};

export const CROP_TYPES = [
  { id: 'wheat', name: 'Wheat (Sharbati)', category: 'Grain' },
  { id: 'mustard', name: 'Mustard (Yellow)', category: 'Oilseed' },
  { id: 'cotton', name: 'Cotton (Medium Staple)', category: 'Cash Crop' },
  { id: 'groundnut', name: 'Groundnut (Bold)', category: 'Oilseed' },
  { id: 'cumin', name: 'Cumin (Jeera)', category: 'Spice' },
];
