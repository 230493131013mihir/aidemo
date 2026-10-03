/**
 * marketService.js
 * Dedicated Market & Mandi Price Data Service
 * HarvestMitra AI - ISSUE-11
 */

// Master demo crops
const DEMO_CROPS = [
  { id: 1, name: 'Tomato', name_en: 'Tomato', name_gu: 'ટામેટાં', name_hi: 'टमाटर', name_mr: 'टोमॅटो', category: 'vegetable', defaultPricePerKg: 20.0 },
  { id: 2, name: 'Onion', name_en: 'Onion', name_gu: 'ડુંગળી', name_hi: 'प्याज', name_mr: 'कांदा', category: 'vegetable', defaultPricePerKg: 25.0 },
  { id: 3, name: 'Wheat', name_en: 'Wheat', name_gu: 'ઘઉં', name_hi: 'गेहूं', name_mr: 'गहू', category: 'grain', defaultPricePerKg: 24.5 },
  { id: 4, name: 'Soybean', name_en: 'Soybean', name_gu: 'સોયાબીન', name_hi: 'सोयाबीन', name_mr: 'सोयाबीन', category: 'oilseed', defaultPricePerKg: 42.0 },
  { id: 5, name: 'Cotton', name_en: 'Cotton', name_gu: 'કપાસ', name_hi: 'कपास', name_mr: 'कापूस', category: 'fiber', defaultPricePerKg: 70.0 },
  { id: 6, name: 'Potato', name_en: 'Potato', name_gu: 'બટાટા', name_hi: 'आलू', name_mr: 'बटाटा', category: 'vegetable', defaultPricePerKg: 18.0 },
  { id: 7, name: 'Green Chilli', name_en: 'Green Chilli', name_gu: 'લીલા મરચાં', name_hi: 'हरी मिर्च', name_mr: 'हिरवी मिरची', category: 'vegetable', defaultPricePerKg: 45.0 }
];

// Master Mandi markets
const DEMO_MARKETS = [
  { id: 1, name: 'Surat APMC Mandi', district: 'Surat', state: 'Gujarat', distanceFromSuratKm: 0, operatingDays: 'Mon-Sat', contact: '+91 261 2456789' },
  { id: 2, name: 'Navsari APMC', district: 'Navsari', state: 'Gujarat', distanceFromSuratKm: 38, operatingDays: 'Mon-Sat', contact: '+91 2637 234567' },
  { id: 3, name: 'Ahmedabad APMC', district: 'Ahmedabad', state: 'Gujarat', distanceFromSuratKm: 260, operatingDays: 'All Days', contact: '+91 79 2689012' },
  { id: 4, name: 'Rajkot APMC', district: 'Rajkot', state: 'Gujarat', distanceFromSuratKm: 420, operatingDays: 'Mon-Sat', contact: '+91 281 2567890' },
  { id: 5, name: 'Bharuch APMC', district: 'Bharuch', state: 'Gujarat', distanceFromSuratKm: 75, operatingDays: 'Mon-Sat', contact: '+91 2642 223344' },
  { id: 6, name: 'Nashik APMC', district: 'Nashik', state: 'Maharashtra', distanceFromSuratKm: 235, operatingDays: 'Mon-Sat', contact: '+91 253 2512345' },
  { id: 7, name: 'Pune APMC (Gultekdi)', district: 'Pune', state: 'Maharashtra', distanceFromSuratKm: 410, operatingDays: 'All Days', contact: '+91 20 24267890' },
  { id: 8, name: 'Vashi APMC (Navi Mumbai)', district: 'Thane', state: 'Maharashtra', distanceFromSuratKm: 280, operatingDays: 'All Days', contact: '+91 22 27889900' }
];

// Seeded Mandi Price Records
const DEMO_PRICES = [
  // Tomato
  { id: 101, crop_id: 1, crop_name: 'Tomato', market_id: 1, market_name: 'Surat APMC Mandi', district: 'Surat', state: 'Gujarat', price_per_kg: 20.00, price_per_quintal: 2000.00, min_price: 18.00, max_price: 22.00, modal_price: 20.00, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:30:00Z' },
  { id: 102, crop_id: 1, crop_name: 'Tomato', market_id: 2, market_name: 'Navsari APMC', district: 'Navsari', state: 'Gujarat', price_per_kg: 22.50, price_per_quintal: 2250.00, min_price: 21.00, max_price: 24.00, modal_price: 22.50, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:15:00Z' },
  { id: 103, crop_id: 1, crop_name: 'Tomato', market_id: 3, market_name: 'Ahmedabad APMC', district: 'Ahmedabad', state: 'Gujarat', price_per_kg: 24.00, price_per_quintal: 2400.00, min_price: 22.00, max_price: 26.00, modal_price: 24.00, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T08:45:00Z' },
  { id: 104, crop_id: 1, crop_name: 'Tomato', market_id: 6, market_name: 'Nashik APMC', district: 'Nashik', state: 'Maharashtra', price_per_kg: 26.00, price_per_quintal: 2600.00, min_price: 24.00, max_price: 28.00, modal_price: 26.00, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:00:00Z' },
  { id: 105, crop_id: 1, crop_name: 'Tomato', market_id: 7, market_name: 'Pune APMC (Gultekdi)', district: 'Pune', state: 'Maharashtra', price_per_kg: 27.50, price_per_quintal: 2750.00, min_price: 25.00, max_price: 29.00, modal_price: 27.50, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:20:00Z' },

  // Onion
  { id: 201, crop_id: 2, crop_name: 'Onion', market_id: 1, market_name: 'Surat APMC Mandi', district: 'Surat', state: 'Gujarat', price_per_kg: 24.00, price_per_quintal: 2400.00, min_price: 22.00, max_price: 26.00, modal_price: 24.00, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:30:00Z' },
  { id: 202, crop_id: 2, crop_name: 'Onion', market_id: 6, market_name: 'Nashik APMC', district: 'Nashik', state: 'Maharashtra', price_per_kg: 28.00, price_per_quintal: 2800.00, min_price: 26.00, max_price: 30.00, modal_price: 28.00, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:00:00Z' },
  { id: 203, crop_id: 2, crop_name: 'Onion', market_id: 3, market_name: 'Ahmedabad APMC', district: 'Ahmedabad', state: 'Gujarat', price_per_kg: 25.50, price_per_quintal: 2550.00, min_price: 23.50, max_price: 27.00, modal_price: 25.50, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T08:45:00Z' },

  // Wheat
  { id: 301, crop_id: 3, crop_name: 'Wheat', market_id: 1, market_name: 'Surat APMC Mandi', district: 'Surat', state: 'Gujarat', price_per_kg: 24.50, price_per_quintal: 2450.00, min_price: 23.00, max_price: 26.00, modal_price: 24.50, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:30:00Z' },
  { id: 302, crop_id: 3, crop_name: 'Wheat', market_id: 4, market_name: 'Rajkot APMC', district: 'Rajkot', state: 'Gujarat', price_per_kg: 25.80, price_per_quintal: 2580.00, min_price: 24.00, max_price: 27.50, modal_price: 25.80, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:10:00Z' },

  // Soybean
  { id: 401, crop_id: 4, crop_name: 'Soybean', market_id: 1, market_name: 'Surat APMC Mandi', district: 'Surat', state: 'Gujarat', price_per_kg: 42.00, price_per_quintal: 4200.00, min_price: 40.00, max_price: 44.00, modal_price: 42.00, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:30:00Z' },
  { id: 402, crop_id: 4, crop_name: 'Soybean', market_id: 6, market_name: 'Nashik APMC', district: 'Nashik', state: 'Maharashtra', price_per_kg: 45.00, price_per_quintal: 4500.00, min_price: 43.00, max_price: 47.00, modal_price: 45.00, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:00:00Z' },

  // Cotton
  { id: 501, crop_id: 5, crop_name: 'Cotton', market_id: 4, market_name: 'Rajkot APMC', district: 'Rajkot', state: 'Gujarat', price_per_kg: 72.00, price_per_quintal: 7200.00, min_price: 68.00, max_price: 75.00, modal_price: 72.00, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:10:00Z' },
  { id: 502, crop_id: 5, crop_name: 'Cotton', market_id: 5, market_name: 'Bharuch APMC', district: 'Bharuch', state: 'Gujarat', price_per_kg: 70.50, price_per_quintal: 7050.00, min_price: 67.00, max_price: 73.00, modal_price: 70.50, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T08:50:00Z' },

  // Potato
  { id: 601, crop_id: 6, crop_name: 'Potato', market_id: 1, market_name: 'Surat APMC Mandi', district: 'Surat', state: 'Gujarat', price_per_kg: 18.00, price_per_quintal: 1800.00, min_price: 16.00, max_price: 20.00, modal_price: 18.00, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:30:00Z' },
  { id: 602, crop_id: 6, crop_name: 'Potato', market_id: 3, market_name: 'Ahmedabad APMC', district: 'Ahmedabad', state: 'Gujarat', price_per_kg: 19.50, price_per_quintal: 1950.00, min_price: 17.50, max_price: 21.00, modal_price: 19.50, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T08:45:00Z' },

  // Green Chilli
  { id: 701, crop_id: 7, crop_name: 'Green Chilli', market_id: 1, market_name: 'Surat APMC Mandi', district: 'Surat', state: 'Gujarat', price_per_kg: 45.00, price_per_quintal: 4500.00, min_price: 40.00, max_price: 50.00, modal_price: 45.00, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:30:00Z' },
  { id: 702, crop_id: 7, crop_name: 'Green Chilli', market_id: 2, market_name: 'Navsari APMC', district: 'Navsari', state: 'Gujarat', price_per_kg: 48.00, price_per_quintal: 4800.00, min_price: 44.00, max_price: 52.00, modal_price: 48.00, data_type: 'sample_demo', source: 'HarvestMitra Demo Dataset', last_updated: '2026-10-03T09:15:00Z' }
];

class MarketService {
  constructor() {
    this.isLiveApiConfigured = Boolean(process.env.MARKET_API_KEY && process.env.MARKET_API_URL);
  }

  /**
   * List all available Mandi markets
   *
   * @param {Object} [filter]
   * @param {string} [filter.district]
   * @param {string} [filter.state]
   * @returns {Promise<Array>}
   */
  async getAllMarkets(filter = {}) {
    let list = [...DEMO_MARKETS];

    if (filter.district) {
      const qDist = String(filter.district).trim().toLowerCase();
      list = list.filter(m => m.district.toLowerCase().includes(qDist));
    }

    if (filter.state) {
      const qState = String(filter.state).trim().toLowerCase();
      list = list.filter(m => m.state.toLowerCase().includes(qState));
    }

    return list;
  }

  /**
   * List all registered crops with multilingual names
   * @returns {Promise<Array>}
   */
  async getCrops() {
    return [...DEMO_CROPS];
  }

  /**
   * Query Mandi commodity prices based on filters
   *
   * @param {Object} [params]
   * @param {string|number} [params.crop] - Crop name or ID
   * @param {string|number} [params.crop_id]
   * @param {string|number} [params.market] - Market name or ID
   * @param {string|number} [params.market_id]
   * @param {string} [params.district]
   * @param {string} [params.state]
   * @param {string} [params.data_type]
   * @returns {Promise<Array>}
   */
  async getMarketPrices(params = {}) {
    let prices = [...DEMO_PRICES];

    // Filter by Crop
    const cropQuery = params.crop || params.crop_id;
    if (cropQuery) {
      const cleanCrop = String(cropQuery).trim().toLowerCase();
      prices = prices.filter(p => {
        if (!isNaN(cleanCrop) && Number(cleanCrop) === p.crop_id) return true;
        return p.crop_name.toLowerCase().includes(cleanCrop);
      });
    }

    // Filter by Market
    const marketQuery = params.market || params.market_id;
    if (marketQuery) {
      const cleanMarket = String(marketQuery).trim().toLowerCase();
      prices = prices.filter(p => {
        if (!isNaN(cleanMarket) && Number(cleanMarket) === p.market_id) return true;
        return p.market_name.toLowerCase().includes(cleanMarket);
      });
    }

    // Filter by District
    if (params.district) {
      const cleanDist = String(params.district).trim().toLowerCase();
      prices = prices.filter(p => p.district.toLowerCase().includes(cleanDist));
    }

    // Filter by State
    if (params.state) {
      const cleanState = String(params.state).trim().toLowerCase();
      prices = prices.filter(p => p.state.toLowerCase().includes(cleanState));
    }

    // Filter by Data Type
    if (params.data_type) {
      const cleanType = String(params.data_type).trim().toLowerCase();
      prices = prices.filter(p => p.data_type.toLowerCase() === cleanType);
    }

    // Format output with explicit status labels
    return prices.map(item => ({
      ...item,
      dataStatus: item.data_type === 'verified_live' ? 'LIVE' : 'DEMO',
      statusNotice: item.data_type === 'verified_live'
        ? 'Verified Live APMC Rate'
        : 'Demonstration Data (For testing only)'
    }));
  }

  /**
   * Compare multiple market prices for a given crop
   *
   * @param {Object} params
   * @param {string} params.crop - Crop name
   * @param {Array<number>} [params.marketIds] - List of market IDs
   * @returns {Promise<Object>}
   */
  async compareMarkets(params = {}) {
    const { crop = 'Tomato', marketIds = [] } = params;

    let prices = await this.getMarketPrices({ crop });
    if (Array.isArray(marketIds) && marketIds.length > 0) {
      const ids = marketIds.map(Number);
      prices = prices.filter(p => ids.includes(p.market_id));
    }

    if (prices.length === 0) {
      return {
        crop,
        totalMarkets: 0,
        comparisons: [],
        summary: `No market price data available for ${crop}.`
      };
    }

    // Factual comparison metrics (no guarantees or speculative assertions)
    const sorted = [...prices].sort((a, b) => b.price_per_kg - a.price_per_kg);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    const diffPerKg = parseFloat((highest.price_per_kg - lowest.price_per_kg).toFixed(2));

    return {
      crop,
      totalMarkets: prices.length,
      highestMarket: {
        name: highest.market_name,
        district: highest.district,
        pricePerKg: highest.price_per_kg,
        pricePerQuintal: highest.price_per_quintal
      },
      lowestMarket: {
        name: lowest.market_name,
        district: lowest.district,
        pricePerKg: lowest.price_per_kg,
        pricePerQuintal: lowest.price_per_quintal
      },
      priceDifferencePerKg: diffPerKg,
      comparisons: sorted.map(p => ({
        marketId: p.market_id,
        marketName: p.market_name,
        district: p.district,
        state: p.state,
        pricePerKg: p.price_per_kg,
        pricePerQuintal: p.price_per_quintal,
        minPrice: p.min_price,
        maxPrice: p.max_price,
        dataStatus: p.dataStatus,
        lastUpdated: p.last_updated
      }))
    };
  }

  /**
   * Generate 7-day or 30-day historical trend data for charts
   *
   * @param {Object} params
   * @param {string} params.crop
   * @param {string} [params.market]
   * @param {number} [params.days=7]
   * @returns {Promise<Array>}
   */
  async getPriceTrends(params = {}) {
    const { crop = 'Tomato', market = 'Surat APMC Mandi', days = 7 } = params;

    const baseItem = DEMO_PRICES.find(
      p => p.crop_name.toLowerCase() === crop.toLowerCase() &&
           p.market_name.toLowerCase().includes(market.toLowerCase())
    ) || DEMO_PRICES[0];

    const basePrice = baseItem.price_per_kg;
    const trendPoints = [];
    const numDays = Math.min(Math.max(Number(days) || 7, 3), 30);

    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      // Deterministic slight fluctuation around base price
      const variance = (Math.sin(i * 1.5) * 1.5);
      const dayPrice = parseFloat((basePrice + variance).toFixed(2));

      trendPoints.push({
        date: date.toISOString().split('T')[0],
        crop: baseItem.crop_name,
        market: baseItem.market_name,
        pricePerKg: dayPrice,
        pricePerQuintal: Math.round(dayPrice * 100),
        dataStatus: 'DEMO'
      });
    }

    return trendPoints;
  }
}

const marketService = new MarketService();
module.exports = marketService;
