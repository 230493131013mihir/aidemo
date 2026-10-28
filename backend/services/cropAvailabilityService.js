const { Op } = require("sequelize");
const { ContactRequest } = require("../models");

// Active reservation statuses that reserve produce stock
// Any status outside of this list (e.g., 'declined', 'cancelled', 'rejected') releases the reservation
const ACTIVE_RESERVATION_STATUSES = ['pending', 'accepted', 'confirmed', 'completed'];

/**
 * Normalizes crop names for robust comparison (e.g., "Cotton", "cotton", " Cotton ")
 */
function normalizeCropName(name) {
  if (!name) return "";
  return String(name).trim().toLowerCase();
}

/**
 * Parses all crops listed by a farmer from FarmerProfile.
 * Supports:
 * 1. productQuantities JSON (string or object):
 *    e.g. { "Cotton": 200 } or { "Cotton": { qty: 200, harvestQuantityKg: 200, unit: "kg", expectedPricePerKg: 75.65 } }
 * 2. Fallback to mainCrop (comma-separated or single) + currentHarvestKg
 */
function parseFarmerCrops(farmerProfile) {
  if (!farmerProfile) return [];

  // 1. Check productQuantities
  if (farmerProfile.productQuantities) {
    try {
      const parsed = typeof farmerProfile.productQuantities === 'string'
        ? JSON.parse(farmerProfile.productQuantities)
        : farmerProfile.productQuantities;

      if (parsed && typeof parsed === 'object') {
        const crops = [];
        for (const [cropKey, val] of Object.entries(parsed)) {
          if (!cropKey || !cropKey.trim()) continue;
          if (typeof val === 'object' && val !== null) {
            const qty = Number(val.harvestQuantityKg !== undefined ? val.harvestQuantityKg : (val.qty !== undefined ? val.qty : val.quantityKg)) || 0;
            crops.push({
              crop: cropKey.trim(),
              totalKg: Math.max(0, qty),
              unit: val.unit || 'kg',
              expectedPrice: Number(val.expectedPricePerKg) || null
            });
          } else {
            const qty = Number(val) || 0;
            crops.push({
              crop: cropKey.trim(),
              totalKg: Math.max(0, qty),
              unit: 'kg',
              expectedPrice: null
            });
          }
        }
        if (crops.length > 0) return crops;
      }
    } catch (_) {
      // JSON parse error, proceed to fallback
    }
  }

  // 2. Fallback to mainCrop / customCrop
  const main = farmerProfile.mainCrop || farmerProfile.customCrop || '';
  if (main && String(main).trim()) {
    const list = String(main).split(',').map(s => s.trim()).filter(Boolean);
    const harvestKg = Number(farmerProfile.currentHarvestKg) || 0;
    return list.map(c => ({
      crop: c,
      totalKg: Math.max(0, harvestKg),
      unit: 'kg',
      expectedPrice: null
    }));
  }

  return [];
}

/**
 * Retrieves sum of reserved quantity for each crop of a farmer from active ContactRequests
 */
async function getFarmerActiveReservations(farmerId, transaction = null) {
  if (!farmerId) return {};

  const queryOptions = {
    where: {
      receiverId: Number(farmerId),
      status: { [Op.in]: ACTIVE_RESERVATION_STATUSES }
    }
  };

  if (transaction) {
    queryOptions.transaction = transaction;
    if (transaction.LOCK && process.env.DB_DIALECT !== 'sqlite') {
      queryOptions.lock = transaction.LOCK.UPDATE;
    }
  }

  const requests = await ContactRequest.findAll(queryOptions);

  const reservations = {};
  for (const r of requests) {
    const cropKey = normalizeCropName(r.cropName);
    const qty = Number(r.quantityKg) || 0;
    reservations[cropKey] = (reservations[cropKey] || 0) + Math.max(0, qty);
  }

  return reservations;
}

/**
 * Computes authoritative availability for all crops of a farmer
 */
async function calculateFarmerCropsAvailability(farmerId, farmerProfile, transaction = null) {
  const parsedCrops = parseFarmerCrops(farmerProfile);
  const reservations = await getFarmerActiveReservations(farmerId, transaction);

  const crops = parsedCrops.map(item => {
    const norm = normalizeCropName(item.crop);
    const bookedKg = reservations[norm] || 0;
    const totalKg = Math.max(0, item.totalKg);
    const availableKg = Math.max(0, totalKg - bookedKg);
    const isSoldOut = availableKg <= 0;

    return {
      crop: item.crop,
      totalKg,
      bookedKg,
      availableKg,
      isSoldOut,
      unit: item.unit || 'kg',
      expectedPrice: item.expectedPrice
    };
  });

  const totalLotKg = crops.reduce((acc, c) => acc + c.totalKg, 0);
  const totalBookedKg = crops.reduce((acc, c) => acc + c.bookedKg, 0);
  const totalAvailableKg = crops.reduce((acc, c) => acc + c.availableKg, 0);
  const isAllSoldOut = crops.length === 0 || crops.every(c => c.isSoldOut);

  return {
    crops,
    totalLotKg,
    totalBookedKg,
    totalAvailableKg,
    isAllSoldOut
  };
}

/**
 * Computes availability for a single crop
 */
async function calculateSingleCropAvailability(farmerId, farmerProfile, cropName, transaction = null) {
  const all = await calculateFarmerCropsAvailability(farmerId, farmerProfile, transaction);
  const targetNorm = normalizeCropName(cropName);

  const matched = all.crops.find(c => normalizeCropName(c.crop) === targetNorm);
  if (matched) {
    return {
      exists: true,
      ...matched
    };
  }

  // Not listed in profile
  return {
    exists: false,
    crop: cropName,
    totalKg: 0,
    bookedKg: 0,
    availableKg: 0,
    isSoldOut: true
  };
}

module.exports = {
  ACTIVE_RESERVATION_STATUSES,
  normalizeCropName,
  parseFarmerCrops,
  getFarmerActiveReservations,
  calculateFarmerCropsAvailability,
  calculateSingleCropAvailability
};
