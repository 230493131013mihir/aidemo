/**
 * cropTransportCompatibility.js
 * Agronomic & Logistics Compatibility Engine for HarvestMitra AI
 * Handles crop-specific vehicle recommendations, unit conversions, and shared pooling rules.
 */

// Unit conversion constants
const UNIT_TO_KG = {
    kg: 1,
    quintal: 100,
    tonne: 1000
};

function convertToKg(quantity, unit = "kg") {
    const normUnit = String(unit || "kg").trim().toLowerCase();
    const multiplier = UNIT_TO_KG[normUnit] || 1;
    const qty = Number(quantity) || 0;
    return Math.round(qty * multiplier);
}

function convertFromKg(weightKg, targetUnit = "kg") {
    const normUnit = String(targetUnit || "kg").trim().toLowerCase();
    const divisor = UNIT_TO_KG[normUnit] || 1;
    const kg = Number(weightKg) || 0;
    return Number((kg / divisor).toFixed(2));
}

// Crop Agronomic Transport Profiles
const CROP_TRANSPORT_PROFILES = {
    Tomato: {
        name: "Tomato",
        category: "vegetable_perishable",
        fragility: "High",
        recommendedVehicles: [
            "Tata Ace / Mini Truck",
            "Mahindra Bolero Maxi Truck",
            "Small Goods Carrier",
            "Refrigerated Vehicle"
        ],
        specialHandling: "Ventilated Crate Transport (Max 24h Transit)",
        packagingType: "Plastic Crates (20-25 kg/crate)",
        compatibleCategories: ["vegetable_perishable", "vegetable_semi_perishable"],
        forbiddenMix: ["cash_crop_bulk", "chemical", "live_animals"]
    },
    Onion: {
        name: "Onion",
        category: "vegetable_semi_perishable",
        fragility: "Medium",
        recommendedVehicles: [
            "Mahindra Bolero Maxi Truck",
            "Tata 407 (Medium Truck)",
            "Medium Goods Truck",
            "Large Goods Truck"
        ],
        specialHandling: "Ventilated Air-Flow Cargo Bed (Moisture-Free)",
        packagingType: "Mesh Net Bags (40-50 kg/bag)",
        compatibleCategories: ["vegetable_semi_perishable", "vegetable_perishable", "grain_bulk"],
        forbiddenMix: ["refrigerated_cold_chain", "delicate_fruits"]
    },
    Potato: {
        name: "Potato",
        category: "vegetable_semi_perishable",
        fragility: "Low",
        recommendedVehicles: [
            "Mahindra Bolero Maxi Truck",
            "Tata 407 (Medium Truck)",
            "Medium Goods Truck",
            "Large Goods Truck"
        ],
        specialHandling: "Dry Jute Gunny Sacks (Shade Covered)",
        packagingType: "Jute Gunny Sacks (50 kg/bag)",
        compatibleCategories: ["vegetable_semi_perishable", "vegetable_perishable", "grain_bulk"],
        forbiddenMix: ["refrigerated_cold_chain"]
    },
    Wheat: {
        name: "Wheat",
        category: "grain_bulk",
        fragility: "Low",
        recommendedVehicles: [
            "Tata 407 (Medium Truck)",
            "Medium Goods Truck",
            "Large Goods Truck"
        ],
        specialHandling: "Dry Covered Weather-Proof Bulk Transport",
        packagingType: "HDPE Woven Sacks (50 kg/bag)",
        compatibleCategories: ["grain_bulk", "oilseed_bulk"],
        forbiddenMix: ["vegetable_perishable", "liquid", "high_humidity"]
    },
    Rice: {
        name: "Rice",
        category: "grain_bulk",
        fragility: "Low",
        recommendedVehicles: [
            "Tata 407 (Medium Truck)",
            "Medium Goods Truck",
            "Large Goods Truck"
        ],
        specialHandling: "Moisture-Protected Dry Tarpaulin Covered",
        packagingType: "Woven Gunny Sacks (50 kg/bag)",
        compatibleCategories: ["grain_bulk", "oilseed_bulk"],
        forbiddenMix: ["vegetable_perishable", "open_wet_cargo"]
    },
    Cotton: {
        name: "Cotton",
        category: "cash_crop_bulk",
        fragility: "Low",
        recommendedVehicles: [
            "Medium Goods Truck",
            "Large Goods Truck"
        ],
        specialHandling: "High-Volume Covered Bale Carrier (Fire-Protected)",
        packagingType: "Standard Cotton Bales (170 kg/bale)",
        compatibleCategories: ["cash_crop_bulk", "grain_bulk", "oilseed_bulk"],
        forbiddenMix: ["vegetable_perishable", "fruit_delicate", "wet_cargo"]
    },
    Soybean: {
        name: "Soybean",
        category: "oilseed_bulk",
        fragility: "Low",
        recommendedVehicles: [
            "Tata 407 (Medium Truck)",
            "Medium Goods Truck",
            "Large Goods Truck"
        ],
        specialHandling: "Clean Dry Aerated Sacks",
        packagingType: "Gunny Bags (50 kg/bag)",
        compatibleCategories: ["oilseed_bulk", "grain_bulk"],
        forbiddenMix: ["vegetable_perishable", "wet_cargo"]
    },
    Grapes: {
        name: "Grapes",
        category: "fruit_delicate",
        fragility: "Very High",
        recommendedVehicles: [
            "Refrigerated Vehicle",
            "Small Goods Carrier",
            "Mini Pickup"
        ],
        specialHandling: "Cold Chain (0-4°C) with Shock-Absorbing Padded Crates",
        packagingType: "Ventilated Export Punnet Cartons",
        compatibleCategories: ["fruit_delicate"],
        forbiddenMix: ["cash_crop_bulk", "grain_bulk", "uncovered_dusty"]
    },
    Banana: {
        name: "Banana",
        category: "fruit_delicate",
        fragility: "High",
        recommendedVehicles: [
            "Tata Ace / Mini Truck",
            "Mahindra Bolero Maxi Truck",
            "Medium Goods Truck"
        ],
        specialHandling: "Padded Covered Bed (Ethylene Protection & Anti-Bruise)",
        packagingType: "Cushioned Corrugated Boxes",
        compatibleCategories: ["fruit_delicate", "vegetable_perishable"],
        forbiddenMix: ["cash_crop_bulk", "extreme_cold"]
    },
    Other: {
        name: "Other Crops",
        category: "general_cargo",
        fragility: "Medium",
        recommendedVehicles: [
            "Mini Pickup",
            "Tata Ace / Mini Truck",
            "Small Goods Carrier",
            "Medium Goods Truck",
            "Large Goods Truck"
        ],
        specialHandling: "Standard Agri-Logistics Covered Haulage",
        packagingType: "Standard Farm Packaging",
        compatibleCategories: ["general_cargo", "vegetable_semi_perishable", "grain_bulk"],
        forbiddenMix: []
    }
};

/**
 * Get profile for any crop name with graceful fallback
 */
function getCropProfile(cropName) {
    if (!cropName) return CROP_TRANSPORT_PROFILES.Other;
    const clean = String(cropName).trim();
    // Match exact or contains
    for (const key of Object.keys(CROP_TRANSPORT_PROFILES)) {
        if (clean.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(clean.toLowerCase())) {
            return CROP_TRANSPORT_PROFILES[key];
        }
    }
    return {
        ...CROP_TRANSPORT_PROFILES.Other,
        name: clean
    };
}

/**
 * Evaluate if two crops can safely share the same vehicle cargo space
 */
function areCropsCompatibleForSharedTransport(cropA, cropB) {
    if (!cropA || !cropB) return true;
    const profA = getCropProfile(cropA);
    const profB = getCropProfile(cropB);

    if (profA.name === profB.name) return true;

    // Check forbidden mixes
    if (profA.forbiddenMix.includes(profB.category) || profB.forbiddenMix.includes(profA.category)) {
        return false;
    }

    // Perishables with high cooling requirements cannot mix with dry bulky grains/cotton
    if (profA.category === "fruit_delicate" && (profB.category === "cash_crop_bulk" || profB.category === "grain_bulk")) {
        return false;
    }
    if (profB.category === "fruit_delicate" && (profA.category === "cash_crop_bulk" || profA.category === "grain_bulk")) {
        return false;
    }

    return true;
}

/**
 * Check if routes are compatible for shared pooling
 */
function areRoutesCompatible(routeAOrigin, routeADest, routeBOrigin, routeBDest) {
    const oA = String(routeAOrigin || "").toLowerCase().trim();
    const dA = String(routeADest || "").toLowerCase().trim();
    const oB = String(routeBOrigin || "").toLowerCase().trim();
    const dB = String(routeBDest || "").toLowerCase().trim();

    // Direct match
    if (oA === oB && dA === dB) return true;

    // Substring / District match (e.g., Pune to Mumbai / Vashi)
    const sameOrigin = oA.includes(oB) || oB.includes(oA);
    const sameDest = dA.includes(dB) || dB.includes(dA) || (dA.includes("mumbai") && dB.includes("vashi")) || (dA.includes("vashi") && dB.includes("mumbai"));

    return sameOrigin && sameDest;
}

/**
 * Check if two dates are compatible (same day or within 1 day)
 */
function areDatesCompatible(dateA, dateB, maxDaysDiff = 1) {
    if (!dateA || !dateB) return true;
    const dA = new Date(dateA);
    const dB = new Date(dateB);
    if (Number.isNaN(dA.getTime()) || Number.isNaN(dB.getTime())) return String(dateA) === String(dateB);
    const diff = Math.abs((dA.getTime() - dB.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= maxDaysDiff;
}

/**
 * Calculate transparent proportional cost sharing among pooled farmers
 */
function calculateSharedFareAllocation({ totalVehicleFare, farmers = [] }) {
    if (!farmers || farmers.length === 0) return [];
    const totalWeightKg = farmers.reduce((sum, f) => sum + (Number(f.weightKg) || 0), 0);
    const totalFare = Number(totalVehicleFare) || 0;

    return farmers.map((farmer) => {
        const weightKg = Number(farmer.weightKg) || 0;
        const proportion = totalWeightKg > 0 ? (weightKg / totalWeightKg) : (1 / farmers.length);
        const sharedCost = Math.round(totalFare * proportion);
        // An individual solo booking would have cost around ~80-100% of full vehicle trip
        const soloCost = Math.round(totalFare * Math.max(0.75, Math.min(1.0, (weightKg / (farmer.vehicleCapacityKg || totalWeightKg)) * 1.5)));
        const potentialSavings = Math.max(0, soloCost - sharedCost);
        const savingsPercent = soloCost > 0 ? Math.round((potentialSavings / soloCost) * 100) : 40;

        return {
            ...farmer,
            weightKg,
            sharedCost,
            soloCost,
            potentialSavings,
            savingsPercent,
            loadSharePercent: Math.round(proportion * 100)
        };
    });
}

module.exports = {
    UNIT_TO_KG,
    convertToKg,
    convertFromKg,
    CROP_TRANSPORT_PROFILES,
    getCropProfile,
    areCropsCompatibleForSharedTransport,
    areRoutesCompatible,
    areDatesCompatible,
    calculateSharedFareAllocation
};
