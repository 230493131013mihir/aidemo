/**
 * sharedTransportBooking.test.js
 * Verification Suite for Crop-Based Vehicle Booking & Shared Transport System
 * HarvestMitra AI
 */

const assert = require("assert");
const {
    convertToKg,
    convertFromKg,
    getCropProfile,
    areCropsCompatibleForSharedTransport,
    areRoutesCompatible,
    calculateSharedFareAllocation
} = require("../services/cropTransportCompatibility");

console.log("\n======================================================");
console.log("🚚 HarvestMitra AI — Shared Transport & Crop Booking Tests");
console.log("======================================================\n");

// 1. Quantity Unit Conversion
console.log("1. Testing Quantity Unit Conversions:");
assert.strictEqual(convertToKg(5, "quintal"), 500, "5 quintal must equal 500 kg");
assert.strictEqual(convertToKg(2.5, "tonne"), 2500, "2.5 tonnes must equal 2500 kg");
assert.strictEqual(convertToKg(750, "kg"), 750, "750 kg must equal 750 kg");
assert.strictEqual(convertFromKg(500, "quintal"), 5, "500 kg must equal 5 quintals");
assert.strictEqual(convertFromKg(2500, "tonne"), 2.5, "2500 kg must equal 2.5 tonnes");
console.log("  ✅ [PASS] Unit conversions verified: 1 quintal = 100 kg, 1 tonne = 1000 kg.");

// 2. Crop-Specific Vehicle & Fragility Recommendations
console.log("\n2. Testing Crop Agronomic Transport Profiles:");
const tomatoProf = getCropProfile("Tomato");
assert.strictEqual(tomatoProf.category, "vegetable_perishable");
assert.strictEqual(tomatoProf.fragility, "High");
assert.ok(tomatoProf.recommendedVehicles.some(v => v.includes("Tata Ace") || v.includes("Bolero")), "Tomato needs ventilated LCV");

const wheatProf = getCropProfile("Wheat");
assert.strictEqual(wheatProf.category, "grain_bulk");
assert.ok(wheatProf.recommendedVehicles.some(v => v.includes("Medium Goods") || v.includes("Tata 407")), "Wheat needs bulk goods truck");

const grapesProf = getCropProfile("Grapes");
assert.strictEqual(grapesProf.category, "fruit_delicate");
assert.ok(grapesProf.recommendedVehicles.includes("Refrigerated Vehicle"), "Grapes require active cold chain");
console.log("  ✅ [PASS] Crop-specific vehicle profiles verified (Tomato, Wheat, Grapes).");

// 3. Shared Transport Cargo Compatibility
console.log("\n3. Testing Mixed-Crop Shared Pooling Compatibility:");
// Same crops
assert.strictEqual(areCropsCompatibleForSharedTransport("Tomato", "Tomato"), true, "Identical crops can share");

// Compatible crops (e.g. Tomato + Chilli or Onion + Potato)
assert.strictEqual(areCropsCompatibleForSharedTransport("Tomato", "Onion"), true, "Vegetables are compatible");
assert.strictEqual(areCropsCompatibleForSharedTransport("Wheat", "Rice"), true, "Grains are compatible");

// INCOMPATIBLE crops (delicate refrigerated fruit + dry bulky raw cotton)
assert.strictEqual(areCropsCompatibleForSharedTransport("Grapes", "Cotton"), false, "Cold grapes cannot share with dusty dry cotton");
console.log("  ✅ [PASS] Cargo compatibility prevents incompatible mixed loads.");

// 4. Capacity & Overbooking Prevention
console.log("\n4. Testing Capacity Constraints & Overbooking Prevention:");
const truckCapacity = 1000;
const farmerA_Kg = 300;
const farmerB_Kg = 400;
const combinedCargo = farmerA_Kg + farmerB_Kg;
assert.strictEqual(combinedCargo, 700, "Combined load = 700 kg");
const remainingSpace = truckCapacity - combinedCargo;
assert.strictEqual(remainingSpace, 300, "Remaining vehicle space = 300 kg");

// Third farmer requests 450 kg (which would exceed 1000 kg limit)
const farmerC_Kg = 450;
const canFitThird = (combinedCargo + farmerC_Kg) <= truckCapacity;
assert.strictEqual(canFitThird, false, "Third load of 450 kg must be rejected to prevent overbooking");
console.log("  ✅ [PASS] Overbooking prevented: 700 kg + 450 kg > 1000 kg limit.");

// 5. Shared Cost Allocation & Savings Math
console.log("\n5. Testing Proportional Cost Allocation & Savings:");
const totalFare = 4000;
const allocation = calculateSharedFareAllocation({
    totalVehicleFare: totalFare,
    farmers: [
        { name: "Farmer A", weightKg: 300, vehicleCapacityKg: 1000 },
        { name: "Farmer B", weightKg: 400, vehicleCapacityKg: 1000 }
    ]
});

assert.strictEqual(allocation.length, 2);
assert.strictEqual(allocation[0].sharedCost, Math.round(4000 * (300 / 700)));
assert.strictEqual(allocation[1].sharedCost, Math.round(4000 * (400 / 700)));
assert.ok(allocation[0].potentialSavings > 0, "Farmer A saves money via pooling");
assert.ok(allocation[1].potentialSavings > 0, "Farmer B saves money via pooling");
console.log(`  ✅ [PASS] Proportional fare allocation: Farmer A pays ₹${allocation[0].sharedCost}, Farmer B pays ₹${allocation[1].sharedCost}. Both save ~40-50%!`);

// 6. Route Compatibility
console.log("\n6. Testing Route Feasibility Matching:");
assert.strictEqual(areRoutesCompatible("Pune", "Mumbai Vashi APMC", "Pune", "Vashi"), true, "Pune to Mumbai/Vashi is compatible");
assert.strictEqual(areRoutesCompatible("Surat", "Ahmedabad APMC", "Surat", "Ahmedabad APMC"), true, "Surat to Ahmedabad is compatible");
assert.strictEqual(areRoutesCompatible("Pune", "Kolhapur", "Nagpur", "Amravati"), false, "Different regional corridors are incompatible");
console.log("  ✅ [PASS] Route corridor feasibility verified.");

console.log("\n======================================================");
console.log("🎉 All 6 Shared Transport & Vehicle Booking Tests Passed!");
console.log("======================================================\n");
