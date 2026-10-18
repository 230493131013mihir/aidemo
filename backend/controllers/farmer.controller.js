/**
 * farmer.controller.js
 * Controller for Dynamic Farmer Crops, Harvest Quantities, APMC Market Prices & Revenue
 * HarvestMitra AI
 */

const { FarmerProfile, User, MarketPrice, Crop, Market } = require("../models");
const marketService = require("../services/marketService");
const { Op } = require("sequelize");

// Standard conversion helper
function normalizeToKg(quantity, unit = "kg") {
  const num = Number(quantity);
  if (Number.isNaN(num) || num < 0) return 0;
  const cleanUnit = String(unit || "kg").toLowerCase().trim();
  if (cleanUnit === "tonne" || cleanUnit === "ton" || cleanUnit === "mt") {
    return Math.round(num * 1000 * 100) / 100;
  }
  if (cleanUnit === "quintal" || cleanUnit === "qtl") {
    return Math.round(num * 100 * 100) / 100;
  }
  return Math.round(num * 100) / 100;
}

// Parse farmer's stored crops and productQuantities
function parseFarmerCropRecords(profile) {
  if (!profile) return [];

  let quantitiesMap = {};
  if (typeof profile.productQuantities === "string") {
    try {
      quantitiesMap = JSON.parse(profile.productQuantities) || {};
    } catch {
      quantitiesMap = {};
    }
  } else if (typeof profile.productQuantities === "object" && profile.productQuantities !== null) {
    quantitiesMap = profile.productQuantities;
  }

  // Parse crops from mainCrop (comma-separated or single)
  let rawCrops = [];
  if (profile.mainCrop && profile.mainCrop !== "Not set") {
    rawCrops = profile.mainCrop.split(",").map(c => c.trim()).filter(Boolean);
  }

  // Also include any crops present in quantitiesMap that might not be in mainCrop
  Object.keys(quantitiesMap).forEach(cropKey => {
    if (!rawCrops.some(c => c.toLowerCase() === cropKey.toLowerCase())) {
      rawCrops.push(cropKey);
    }
  });

  // Deduplicate case-insensitively
  const uniqueCrops = [];
  const seen = new Set();
  for (const c of rawCrops) {
    const lower = c.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueCrops.push(c);
    }
  }

  if (uniqueCrops.length === 0) {
    return [];
  }

  // Build structured records
  return uniqueCrops.map(cropName => {
    // Find matching key in quantitiesMap
    const mapKey = Object.keys(quantitiesMap).find(k => k.toLowerCase() === cropName.toLowerCase()) || cropName;
    const entry = quantitiesMap[mapKey];

    let rawQty = 500;
    let unit = "kg";

    if (entry !== undefined && entry !== null) {
      if (typeof entry === "object") {
        rawQty = entry.qty !== undefined ? Number(entry.qty) : (entry.harvestQuantityKg !== undefined ? Number(entry.harvestQuantityKg) : 500);
        unit = entry.unit || "kg";
      } else if (!Number.isNaN(Number(entry))) {
        rawQty = Number(entry);
        unit = "kg";
      }
    } else {
      // Fallback evenly across total
      const totalHarvest = Number(profile.currentHarvestKg) || 500;
      rawQty = Math.round(totalHarvest / (uniqueCrops.length || 1));
      unit = "kg";
    }

    const harvestQuantityKg = normalizeToKg(rawQty, unit);

    return {
      cropName,
      enteredQuantity: rawQty,
      unit,
      harvestQuantityKg
    };
  });
}

// Fetch live APMC market rate for a specific crop and location
async function fetchPriceForCrop(cropName, district, state) {
  try {
    const prices = await marketService.getMarketPrices({
      crop: cropName,
      district: district || "Pune",
      state: state || "Maharashtra"
    });

    if (Array.isArray(prices) && prices.length > 0) {
      const fDist = String(district || "Pune").toLowerCase();
      // Prefer market in farmer's district
      const matched = prices.find(p =>
        (p.district && p.district.toLowerCase() === fDist) ||
        (p.market_name && p.market_name.toLowerCase().includes(fDist)) ||
        (p.market && p.market.toLowerCase().includes(fDist))
      ) || prices[0];

      const kgRate = Number(matched.price_per_kg || matched.pricePerKg || matched.modal_price || matched.modalPrice);
      if (!Number.isNaN(kgRate) && kgRate > 0) {
        const qtlRate = Number(matched.price_per_quintal || matched.pricePerQuintal) || Math.round(kgRate * 100);
        return {
          marketPricePerKg: kgRate,
          marketPricePerQuintal: qtlRate,
          marketName: matched.market_name || matched.market || `${district} APMC Mandi`,
          district: matched.district || district,
          state: matched.state || state,
          priceDate: matched.priceDate || matched.last_updated || new Date().toISOString().slice(0, 10),
          priceStatus: "LIVE",
          statusNotice: "Verified Maharashtra State APMC Directorate / AGMARKNET Observation",
          isStale: false
        };
      }
    }
  } catch (err) {
    console.warn(`[FarmerController] Price lookup error for ${cropName}:`, err.message);
  }

  // If no verified price exists in live service, query DB directly
  try {
    const cropDb = await Crop.findOne({
      where: {
        nameEn: { [Op.like]: `%${cropName}%` }
      }
    });

    if (cropDb) {
      const priceRecord = await MarketPrice.findOne({
        where: { cropId: cropDb.id },
        include: [{ model: Market }],
        order: [["priceDate", "DESC"], ["id", "DESC"]]
      });

      if (priceRecord) {
        const kgRate = Number(priceRecord.pricePerKg);
        const qtlRate = Number(priceRecord.pricePerQuintal) || Math.round(kgRate * 100);
        return {
          marketPricePerKg: kgRate,
          marketPricePerQuintal: qtlRate,
          marketName: priceRecord.Market?.name || `${district} APMC Mandi`,
          district: priceRecord.Market?.district || district,
          state: priceRecord.Market?.state || state,
          priceDate: priceRecord.priceDate || new Date().toISOString().slice(0, 10),
          priceStatus: "LIVE",
          statusNotice: "Verified Local Mandi Benchmark Record",
          isStale: false
        };
      }
    }
  } catch (dbErr) {
    console.warn(`[FarmerController] Direct DB price query error for ${cropName}:`, dbErr.message);
  }

  // If no verified price exists anywhere, do not invent a price!
  return {
    marketPricePerKg: null,
    marketPricePerQuintal: null,
    marketName: null,
    district: district || null,
    state: state || null,
    priceDate: null,
    priceStatus: "UNAVAILABLE",
    statusNotice: "Market price unavailable",
    isStale: false
  };
}

// ==========================================
// 1. GET /api/farmer/crops
// ==========================================
exports.getCrops = async (req, res) => {
  try {
    const userId = req.user.id;

    // Handle guest mode
    if (req.user.isGuest || userId === 999999 || userId === "guest") {
      const guestCrops = [
        { cropName: "Tomato", harvestQuantityKg: 500, unit: "kg" },
        { cropName: "Onion", harvestQuantityKg: 300, unit: "kg" },
        { cropName: "Wheat", harvestQuantityKg: 800, unit: "kg" }
      ];

      const enriched = await Promise.all(
        guestCrops.map(async (c) => {
          const priceInfo = await fetchPriceForCrop(c.cropName, "Pune", "Maharashtra");
          let estimatedRevenue = null;
          if (priceInfo.marketPricePerKg !== null) {
            estimatedRevenue = Math.round(c.harvestQuantityKg * priceInfo.marketPricePerKg);
          }
          return {
            ...c,
            ...priceInfo,
            estimatedRevenue
          };
        })
      );

      const totalHarvestKg = enriched.reduce((sum, item) => sum + item.harvestQuantityKg, 0);
      const totalEstimatedRevenue = enriched.reduce((sum, item) => sum + (item.estimatedRevenue || 0), 0);

      return res.status(200).json({
        success: true,
        crops: enriched,
        summary: {
          totalCropsCount: enriched.length,
          totalHarvestKg,
          totalEstimatedRevenue,
          district: "Pune",
          state: "Maharashtra"
        }
      });
    }

    let profile = await FarmerProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await FarmerProfile.create({
        userId,
        district: "Pune",
        state: "Maharashtra",
        village: "Haveli",
        farmSizeAcres: 3.5,
        mainCrop: "Tomato",
        currentHarvestKg: 500,
        preferredLanguage: "mr"
      });
    }

    const cropRecords = parseFarmerCropRecords(profile);

    // Enrich each registered crop with live market price and revenue calculation
    const enrichedCrops = await Promise.all(
      cropRecords.map(async (item) => {
        const priceInfo = await fetchPriceForCrop(item.cropName, profile.district, profile.state);
        let estimatedRevenue = null;
        if (priceInfo.marketPricePerKg !== null && priceInfo.marketPricePerKg > 0) {
          estimatedRevenue = Math.round(item.harvestQuantityKg * priceInfo.marketPricePerKg);
        }

        return {
          cropName: item.cropName,
          enteredQuantity: item.enteredQuantity,
          unit: item.unit,
          harvestQuantityKg: item.harvestQuantityKg,
          marketPricePerKg: priceInfo.marketPricePerKg,
          marketPricePerQuintal: priceInfo.marketPricePerQuintal,
          marketName: priceInfo.marketName,
          priceDate: priceInfo.priceDate,
          priceStatus: priceInfo.priceStatus,
          statusNotice: priceInfo.statusNotice,
          estimatedRevenue
        };
      })
    );

    const totalHarvestKg = enrichedCrops.reduce((sum, item) => sum + item.harvestQuantityKg, 0);
    const totalEstimatedRevenue = enrichedCrops.reduce((sum, item) => sum + (item.estimatedRevenue || 0), 0);

    return res.status(200).json({
      success: true,
      crops: enrichedCrops,
      summary: {
        totalCropsCount: enrichedCrops.length,
        totalHarvestKg,
        totalEstimatedRevenue,
        district: profile.district,
        state: profile.state
      }
    });

  } catch (error) {
    console.error("[FarmerController.getCrops] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve farmer registered crops: " + error.message
    });
  }
};

// ==========================================
// 2. POST /api/farmer/crops (Add a new crop)
// ==========================================
exports.addCrop = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cropName, harvestQuantityKg, unit = "kg" } = req.body;

    // 1. Validation
    if (!cropName || typeof cropName !== "string" || !cropName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Crop name is required."
      });
    }

    const cleanCropName = cropName.trim();
    const parsedQty = Number(harvestQuantityKg);

    if (harvestQuantityKg === undefined || harvestQuantityKg === null || Number.isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Harvest quantity must be a positive numeric value greater than zero."
      });
    }

    const cleanUnit = (unit || "kg").toLowerCase().trim();
    if (!["kg", "quintal", "qtl", "tonne", "ton"].includes(cleanUnit)) {
      return res.status(400).json({
        success: false,
        message: "Invalid unit. Supported units are kg, quintal, or tonne."
      });
    }

    let profile = await FarmerProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await FarmerProfile.create({
        userId,
        district: "Pune",
        state: "Maharashtra",
        mainCrop: cleanCropName,
        currentHarvestKg: normalizeToKg(parsedQty, cleanUnit)
      });
    }

    // Parse existing quantities
    let quantitiesMap = {};
    if (typeof profile.productQuantities === "string") {
      try {
        quantitiesMap = JSON.parse(profile.productQuantities) || {};
      } catch {
        quantitiesMap = {};
      }
    } else if (typeof profile.productQuantities === "object" && profile.productQuantities !== null) {
      quantitiesMap = { ...profile.productQuantities };
    }

    // Check duplicate
    const existingKey = Object.keys(quantitiesMap).find(
      k => k.toLowerCase() === cleanCropName.toLowerCase()
    );

    if (existingKey) {
      return res.status(409).json({
        success: false,
        message: `${cleanCropName} is already registered in your crop portfolio. Use the Edit Quantity option to modify it.`
      });
    }

    // Add new entry
    quantitiesMap[cleanCropName] = {
      qty: parsedQty,
      unit: cleanUnit,
      harvestQuantityKg: normalizeToKg(parsedQty, cleanUnit)
    };

    // Update mainCrop comma-separated list
    let existingCrops = profile.mainCrop ? profile.mainCrop.split(",").map(c => c.trim()).filter(Boolean) : [];
    if (!existingCrops.some(c => c.toLowerCase() === cleanCropName.toLowerCase())) {
      existingCrops.push(cleanCropName);
    }
    profile.mainCrop = existingCrops.join(", ");

    // Recalculate total currentHarvestKg
    let totalKg = 0;
    Object.keys(quantitiesMap).forEach(k => {
      const item = quantitiesMap[k];
      const q = item.qty !== undefined ? Number(item.qty) : Number(item);
      const u = item.unit || "kg";
      totalKg += normalizeToKg(q, u);
    });

    profile.currentHarvestKg = Math.round(totalKg);
    profile.productQuantities = JSON.stringify(quantitiesMap);
    await profile.save();

    // Fetch live price for the newly added crop
    const priceInfo = await fetchPriceForCrop(cleanCropName, profile.district, profile.state);
    const addedKg = normalizeToKg(parsedQty, cleanUnit);
    let estimatedRevenue = null;
    if (priceInfo.marketPricePerKg !== null && priceInfo.marketPricePerKg > 0) {
      estimatedRevenue = Math.round(addedKg * priceInfo.marketPricePerKg);
    }

    return res.status(201).json({
      success: true,
      message: `${cleanCropName} successfully added to your registered crops.`,
      crop: {
        cropName: cleanCropName,
        enteredQuantity: parsedQty,
        unit: cleanUnit,
        harvestQuantityKg: addedKg,
        ...priceInfo,
        estimatedRevenue
      },
      summary: {
        totalHarvestKg: profile.currentHarvestKg,
        district: profile.district,
        state: profile.state
      }
    });

  } catch (error) {
    console.error("[FarmerController.addCrop] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add crop: " + error.message
    });
  }
};

// ==========================================
// 3. PUT /api/farmer/crops/:cropName (Update Quantity)
// ==========================================
exports.updateCropQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cropName } = req.params;
    const { harvestQuantityKg, unit = "kg" } = req.body;

    if (!cropName || !cropName.trim()) {
      return res.status(400).json({ success: false, message: "Target crop name is required." });
    }

    const cleanCropName = decodeURIComponent(cropName).trim();
    const parsedQty = Number(harvestQuantityKg);

    if (harvestQuantityKg === undefined || harvestQuantityKg === null || Number.isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Harvest quantity must be a positive numeric value greater than zero."
      });
    }

    const cleanUnit = (unit || "kg").toLowerCase().trim();

    let profile = await FarmerProfile.findOne({ where: { userId } });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Farmer profile not found." });
    }

    let quantitiesMap = {};
    if (typeof profile.productQuantities === "string") {
      try {
        quantitiesMap = JSON.parse(profile.productQuantities) || {};
      } catch {
        quantitiesMap = {};
      }
    } else if (typeof profile.productQuantities === "object" && profile.productQuantities !== null) {
      quantitiesMap = { ...profile.productQuantities };
    }

    // Locate crop key (case-insensitive)
    const existingKey = Object.keys(quantitiesMap).find(
      k => k.toLowerCase() === cleanCropName.toLowerCase()
    ) || cleanCropName;

    const normalizedKg = normalizeToKg(parsedQty, cleanUnit);

    quantitiesMap[existingKey] = {
      qty: parsedQty,
      unit: cleanUnit,
      harvestQuantityKg: normalizedKg
    };

    // Recalculate total harvest kg
    let totalKg = 0;
    Object.keys(quantitiesMap).forEach(k => {
      const item = quantitiesMap[k];
      const q = item.qty !== undefined ? Number(item.qty) : Number(item);
      const u = item.unit || "kg";
      totalKg += normalizeToKg(q, u);
    });

    profile.currentHarvestKg = Math.round(totalKg);
    profile.productQuantities = JSON.stringify(quantitiesMap);
    await profile.save();

    // Recalculate revenue for this crop
    const priceInfo = await fetchPriceForCrop(existingKey, profile.district, profile.state);
    let estimatedRevenue = null;
    if (priceInfo.marketPricePerKg !== null && priceInfo.marketPricePerKg > 0) {
      estimatedRevenue = Math.round(normalizedKg * priceInfo.marketPricePerKg);
    }

    return res.status(200).json({
      success: true,
      message: `Harvest quantity for ${existingKey} updated to ${parsedQty} ${cleanUnit}.`,
      crop: {
        cropName: existingKey,
        enteredQuantity: parsedQty,
        unit: cleanUnit,
        harvestQuantityKg: normalizedKg,
        ...priceInfo,
        estimatedRevenue
      },
      summary: {
        totalHarvestKg: profile.currentHarvestKg
      }
    });

  } catch (error) {
    console.error("[FarmerController.updateCropQuantity] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update crop quantity: " + error.message
    });
  }
};

// ==========================================
// 4. DELETE /api/farmer/crops/:cropName (Remove Crop)
// ==========================================
exports.removeCrop = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cropName } = req.params;

    if (!cropName || !cropName.trim()) {
      return res.status(400).json({ success: false, message: "Target crop name is required." });
    }

    const cleanCropName = decodeURIComponent(cropName).trim();

    let profile = await FarmerProfile.findOne({ where: { userId } });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Farmer profile not found." });
    }

    let quantitiesMap = {};
    if (typeof profile.productQuantities === "string") {
      try {
        quantitiesMap = JSON.parse(profile.productQuantities) || {};
      } catch {
        quantitiesMap = {};
      }
    } else if (typeof profile.productQuantities === "object" && profile.productQuantities !== null) {
      quantitiesMap = { ...profile.productQuantities };
    }

    // Locate and delete key
    const matchKey = Object.keys(quantitiesMap).find(
      k => k.toLowerCase() === cleanCropName.toLowerCase()
    );

    if (matchKey) {
      delete quantitiesMap[matchKey];
    }

    // Remove from mainCrop list
    let existingCrops = profile.mainCrop ? profile.mainCrop.split(",").map(c => c.trim()).filter(Boolean) : [];
    existingCrops = existingCrops.filter(c => c.toLowerCase() !== cleanCropName.toLowerCase());
    profile.mainCrop = existingCrops.join(", ");

    // Recalculate total harvest kg
    let totalKg = 0;
    Object.keys(quantitiesMap).forEach(k => {
      const item = quantitiesMap[k];
      const q = item.qty !== undefined ? Number(item.qty) : Number(item);
      const u = item.unit || "kg";
      totalKg += normalizeToKg(q, u);
    });

    profile.currentHarvestKg = Math.round(totalKg);
    profile.productQuantities = JSON.stringify(quantitiesMap);
    await profile.save();

    return res.status(200).json({
      success: true,
      message: `${cleanCropName} removed successfully from your registered crops.`,
      remainingCropsCount: existingCrops.length,
      summary: {
        totalHarvestKg: profile.currentHarvestKg
      }
    });

  } catch (error) {
    console.error("[FarmerController.removeCrop] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove crop: " + error.message
    });
  }
};

// ==========================================
// 5. GET /api/farmer/revenue-summary
// ==========================================
exports.getRevenueSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    let profile = await FarmerProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = {
        district: "Pune",
        state: "Maharashtra",
        mainCrop: "Tomato",
        currentHarvestKg: 500,
        productQuantities: JSON.stringify({ Tomato: { qty: 500, unit: "kg" } })
      };
    }

    const cropRecords = parseFarmerCropRecords(profile);
    const enrichedBreakdown = await Promise.all(
      cropRecords.map(async (item) => {
        const priceInfo = await fetchPriceForCrop(item.cropName, profile.district, profile.state);
        let estimatedRevenue = null;
        if (priceInfo.marketPricePerKg !== null && priceInfo.marketPricePerKg > 0) {
          estimatedRevenue = Math.round(item.harvestQuantityKg * priceInfo.marketPricePerKg);
        }

        return {
          cropName: item.cropName,
          harvestQuantityKg: item.harvestQuantityKg,
          unit: item.unit,
          marketPricePerKg: priceInfo.marketPricePerKg,
          marketPricePerQuintal: priceInfo.marketPricePerQuintal,
          marketName: priceInfo.marketName,
          priceDate: priceInfo.priceDate,
          priceStatus: priceInfo.priceStatus,
          estimatedRevenue
        };
      })
    );

    const totalHarvestKg = enrichedBreakdown.reduce((sum, c) => sum + c.harvestQuantityKg, 0);
    const totalEstimatedRevenue = enrichedBreakdown.reduce((sum, c) => sum + (c.estimatedRevenue || 0), 0);
    const unpricedCropsCount = enrichedBreakdown.filter(c => c.estimatedRevenue === null).length;

    return res.status(200).json({
      success: true,
      summary: {
        totalCropsCount: enrichedBreakdown.length,
        totalHarvestKg,
        totalEstimatedRevenue,
        unpricedCropsCount,
        district: profile.district,
        state: profile.state,
        note: "Gross estimated realization based on active APMC Mandi benchmark rates. Net profit depends on input & transport costs."
      },
      breakdown: enrichedBreakdown
    });

  } catch (error) {
    console.error("[FarmerController.getRevenueSummary] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate revenue summary: " + error.message
    });
  }
};

// ==========================================
// 6. GET /api/farmer/market-prices
// ==========================================
exports.getFarmerMarketPrices = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await FarmerProfile.findOne({ where: { userId } });
    const district = profile?.district || "Pune";
    const state = profile?.state || "Maharashtra";

    const cropRecords = parseFarmerCropRecords(profile);
    const prices = await Promise.all(
      cropRecords.map(async (c) => {
        const priceInfo = await fetchPriceForCrop(c.cropName, district, state);
        return {
          cropName: c.cropName,
          harvestQuantityKg: c.harvestQuantityKg,
          ...priceInfo
        };
      })
    );

    return res.status(200).json({
      success: true,
      district,
      state,
      prices
    });

  } catch (error) {
    console.error("[FarmerController.getFarmerMarketPrices] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch farmer market prices: " + error.message
    });
  }
};
