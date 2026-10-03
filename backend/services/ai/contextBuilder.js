/**
 * contextBuilder.js
 * Builds trusted backend context for Mitra Assistant
 * HarvestMitra AI - ISSUE-09
 */

const mathEngine = require('../mathEngine');

/**
 * Builds a structured, verified context object to inject into prompts and fallback engines.
 * Integrates directly with backend mathEngine for all calculations.
 *
 * @param {Object} params
 * @param {Object} [params.farmer]
 * @param {Object} [params.crop]
 * @param {Object} [params.marketData]
 * @param {Object} [params.calculations]
 * @param {Object} [params.weather]
 * @param {Object} [params.transport]
 * @param {Object} [params.rawInputs] - Raw calculation parameters to run mathEngine on
 * @returns {Object} Structured context
 */
function buildContext(params = {}) {
  const {
    farmer = {},
    crop = {},
    marketData = {},
    calculations: providedCalculations,
    weather = {},
    transport = {},
    rawInputs = null
  } = params;

  // 1. Farmer Information
  const farmerContext = {
    name: farmer.name || farmer.full_name || 'Farmer',
    location: farmer.location || farmer.district || 'Gujarat',
    preferredLanguage: farmer.preferredLanguage || farmer.preferred_language || 'en'
  };

  // 2. Crop Information
  const cropContext = {
    name: crop.name || crop.crop_name || null,
    quantityKg: crop.quantityKg || crop.quantity_kg || null,
    isPerishable: crop.isPerishable ?? true
  };

  // 3. Market Data (Distinguishing DEMO vs LIVE data)
  const currentMarket = marketData.currentMarket || marketData.current_market || null;
  const alternativeMarket = marketData.alternativeMarket || marketData.alt_market || null;

  const marketContext = {
    available: Boolean(currentMarket || alternativeMarket),
    currentMarket: currentMarket ? {
      name: currentMarket.name || currentMarket.market_name || 'Local Mandi',
      pricePerKg: currentMarket.pricePerKg ?? currentMarket.price_per_kg ?? null,
      unit: currentMarket.unit || 'kg',
      sourceType: currentMarket.sourceType || currentMarket.data_type || 'DEMO',
      updatedAt: currentMarket.updatedAt || currentMarket.last_updated || new Date().toISOString().split('T')[0]
    } : null,
    alternativeMarket: alternativeMarket ? {
      name: alternativeMarket.name || alternativeMarket.market_name || 'Regional Mandi',
      pricePerKg: alternativeMarket.pricePerKg ?? alternativeMarket.price_per_kg ?? null,
      unit: alternativeMarket.unit || 'kg',
      sourceType: alternativeMarket.sourceType || alternativeMarket.data_type || 'DEMO',
      updatedAt: alternativeMarket.updatedAt || alternativeMarket.last_updated || new Date().toISOString().split('T')[0]
    } : null
  };

  // 4. Calculations (Always derived from mathEngine or verified backend calculation)
  let calculationsContext = null;

  if (providedCalculations) {
    // If caller provided calculations already computed by backend
    calculationsContext = {
      computedBy: 'BACKEND_CALCULATION_ENGINE',
      today: providedCalculations.today || providedCalculations.option1_sell_today || null,
      holdLater: providedCalculations.holdLater || providedCalculations.option2_hold_2days || null,
      alternativeMarket: providedCalculations.alternativeMarket || providedCalculations.option3_alt_market || null,
      recommendation: providedCalculations.recommendation || null
    };
  } else if (rawInputs && typeof rawInputs === 'object') {
    // If raw inputs provided, calculate deterministically using mathEngine
    try {
      const quantity = rawInputs.quantity ?? cropContext.quantityKg;
      const todayPrice = rawInputs.todayPrice ?? rawInputs.sellingPrice ?? (currentMarket?.pricePerKg || 0);
      const transportCost = rawInputs.todayTransportCost ?? rawInputs.transportCost ?? 0;
      const packagingCost = rawInputs.todayPackagingCost ?? rawInputs.packagingCost ?? 0;
      const laborCost = rawInputs.todayLaborCost ?? rawInputs.laborCost ?? 0;

      if (quantity && todayPrice) {
        const todayOption = mathEngine.sellToday(
          quantity,
          todayPrice,
          transportCost,
          packagingCost,
          laborCost
        );

        let laterOption = null;
        if (rawInputs.futurePrice) {
          laterOption = mathEngine.holdAndSellLater(
            quantity,
            rawInputs.futurePrice,
            rawInputs.futureTransportCost ?? transportCost,
            rawInputs.futurePackagingCost ?? packagingCost,
            rawInputs.futureLaborCost ?? laborCost,
            todayOption.netRevenue
          );
        }

        let altOption = null;
        if (rawInputs.alternativePrice) {
          altOption = mathEngine.alternativeMarket(
            quantity,
            rawInputs.alternativePrice,
            rawInputs.alternativeTransportCost ?? transportCost,
            rawInputs.alternativePackagingCost ?? packagingCost,
            rawInputs.alternativeLaborCost ?? laborCost,
            todayOption.netRevenue
          );
        }

        calculationsContext = {
          computedBy: 'BACKEND_CALCULATION_ENGINE',
          today: todayOption,
          holdLater: laterOption,
          alternativeMarket: altOption
        };
      }
    } catch (err) {
      // In case of input errors, do not crash; leave calculations as null
      calculationsContext = null;
    }
  }

  // 5. Weather Context
  const weatherContext = {
    available: weather.available ?? Boolean(weather.condition || weather.weather?.condition || weather.rainProbability !== undefined || weather.advisory),
    condition: weather.condition || weather.weather?.condition || null,
    temperatureC: weather.temperatureC ?? weather.temperature ?? weather.weather?.temperature ?? null,
    rainProbability: weather.rainProbability ?? weather.weather?.rainProbability ?? null,
    rainAlert: weather.rainAlert || weather.advisory?.message || weather.alert || null,
    advisoryLevel: weather.advisory?.level || null,
    forecastDays: weather.forecastDays || weather.weather?.forecast || null
  };

  // 6. Transport Context
  const transportContext = {
    available: transport.available ?? Boolean(transport.matches?.length || transport.requests?.length),
    matches: transport.matches || [],
    costSavingsEstimated: transport.costSavingsEstimated || null
  };

  return {
    farmer: farmerContext,
    crop: cropContext,
    marketData: marketContext,
    calculations: calculationsContext,
    weather: weatherContext,
    transport: transportContext
  };
}

/**
 * Format context as human-readable string for inclusion in LLM prompt.
 * Strictly labels DEMO, VERIFIED, and COMPUTED values.
 *
 * @param {Object} context
 * @returns {string} Formatted context block
 */
function formatContextForPrompt(context) {
  if (!context) return 'No context available.';

  const lines = [];

  // Farmer
  if (context.farmer) {
    lines.push(`FARMER PROFILE (USER_PROVIDED):`);
    lines.push(`- Name: ${context.farmer.name}`);
    lines.push(`- Location: ${context.farmer.location}`);
    lines.push(`- Preferred Language: ${context.farmer.preferredLanguage}`);
  }

  // Crop
  if (context.crop?.name) {
    lines.push(`\nCROP IN FOCUS (USER_PROVIDED):`);
    lines.push(`- Crop: ${context.crop.name}`);
    if (context.crop.quantityKg) {
      lines.push(`- Quantity: ${context.crop.quantityKg} kg`);
    } else {
      lines.push(`- Quantity: NOT PROVIDED (Must ask farmer if required)`);
    }
  }

  // Market Data
  lines.push(`\nMARKET DATA:`);
  if (context.marketData?.available) {
    if (context.marketData.currentMarket) {
      const m = context.marketData.currentMarket;
      lines.push(`- Current Market: ${m.name}`);
      lines.push(`  Price: ₹${m.pricePerKg}/${m.unit}`);
      lines.push(`  Data Source: [${m.sourceType}] (Do not claim demo data is real-time live auction data)`);
      lines.push(`  Updated: ${m.updatedAt}`);
    }
    if (context.marketData.alternativeMarket) {
      const m = context.marketData.alternativeMarket;
      lines.push(`- Alternative Market: ${m.name}`);
      lines.push(`  Price: ₹${m.pricePerKg}/${m.unit}`);
      lines.push(`  Data Source: [${m.sourceType}]`);
      lines.push(`  Updated: ${m.updatedAt}`);
    }
  } else {
    lines.push(`- Status: NO MARKET PRICE DATA AVAILABLE IN DATABASE.`);
    lines.push(`  RULE: Do NOT invent prices. Direct the farmer to check Market Explorer.`);
  }

  // Calculations
  lines.push(`\nFINANCIAL CALCULATIONS (DETERMINISTIC BACKEND MATH):`);
  if (context.calculations) {
    const c = context.calculations;
    if (c.today) {
      lines.push(`- Option 1 (Sell Today):`);
      lines.push(`  Gross Revenue: ₹${c.today.grossRevenue ?? c.today.gross_revenue}`);
      lines.push(`  Total Expenses: ₹${c.today.totalCost ?? c.today.expenses}`);
      lines.push(`  Net Estimated Revenue: ₹${c.today.netRevenue ?? c.today.net_revenue}`);
    }
    if (c.alternativeMarket) {
      lines.push(`- Option 2 (Alternative Market):`);
      lines.push(`  Gross Revenue: ₹${c.alternativeMarket.grossRevenue ?? c.alternativeMarket.gross_revenue}`);
      lines.push(`  Total Expenses: ₹${c.alternativeMarket.totalCost ?? c.alternativeMarket.expenses}`);
      lines.push(`  Net Estimated Revenue: ₹${c.alternativeMarket.netRevenue ?? c.alternativeMarket.net_revenue}`);
    }
    if (c.holdLater) {
      lines.push(`- Option 3 (Hold & Sell Later):`);
      lines.push(`  Gross Revenue: ₹${c.holdLater.grossRevenue ?? c.holdLater.gross_revenue}`);
      lines.push(`  Total Expenses: ₹${c.holdLater.totalCost ?? c.holdLater.expenses}`);
      lines.push(`  Net Estimated Revenue: ₹${c.holdLater.netRevenue ?? c.holdLater.net_revenue}`);
    }
    lines.push(`  RULE: Quote these exact numbers. Do not invent or recalculate independently.`);
  } else {
    lines.push(`- Status: No calculations performed yet.`);
    lines.push(`  RULE: If farmer asks about revenue/profit without providing quantity or price, ask for missing values.`);
  }

  // Weather
  lines.push(`\nWEATHER ADVISORY:`);
  if (context.weather?.available) {
    if (context.weather.condition) lines.push(`- Condition: ${context.weather.condition}`);
    if (context.weather.temperatureC) lines.push(`- Temperature: ${context.weather.temperatureC}°C`);
    if (context.weather.rainAlert) lines.push(`- Alert: ${context.weather.rainAlert}`);
  } else {
    lines.push(`- Status: Weather data NOT available.`);
    lines.push(`  RULE: Do NOT invent weather. Advise farmer to check the Weather section.`);
  }

  // Transport
  lines.push(`\nSHARED TRANSPORT POOLING:`);
  if (context.transport?.available && context.transport.matches?.length > 0) {
    lines.push(`- Available matching transport pools: ${context.transport.matches.length} found.`);
    context.transport.matches.forEach((m, idx) => {
      lines.push(`  ${idx + 1}. Destination: ${m.destination}, Vehicle: ${m.vehicleType || 'Truck'}, Capacity: ${m.capacity}kg`);
    });
  } else {
    lines.push(`- Status: No active transport matches found.`);
    lines.push(`  RULE: Direct farmer to create a shared transport request in the Transport section.`);
  }

  return lines.join('\n');
}

module.exports = {
  buildContext,
  formatContextForPrompt
};
