/**
 * farmerCrops.test.js
 * Comprehensive Test Suite for Dynamic Multi-Crop Farmer Registration,
 * Harvest Quantities, Mandi APMC Rates & Revenue Calculation
 * HarvestMitra AI
 */

const assert = require("assert");
const jwt = require("jsonwebtoken");
const sequelize = require("../config/database");
const { User, FarmerProfile, Crop, Market, MarketPrice } = require("../models");
const farmerController = require("../controllers/farmer.controller");

async function runTests() {
  console.log("🌾 Running Farmer Crops & Revenue Test Suite...");

  await sequelize.authenticate();
  await sequelize.sync();

  const JWT_SECRET = process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon";

  // Test 1: Seed / Ensure Market & Crop price data
  const [cropTomato] = await Crop.findOrCreate({
    where: { nameEn: "Tomato" },
    defaults: { nameEn: "Tomato", nameGu: "ટામેટા", nameHi: "टमाटर", category: "vegetable" }
  });

  const [cropOnion] = await Crop.findOrCreate({
    where: { nameEn: "Onion" },
    defaults: { nameEn: "Onion", nameGu: "ડુંગળી", nameHi: "प्याज", category: "vegetable" }
  });

  const [marketPune] = await Market.findOrCreate({
    where: { name: "Pune APMC" },
    defaults: { name: "Pune APMC", district: "Pune", state: "Maharashtra" }
  });

  const today = new Date().toISOString().slice(0, 10);
  await MarketPrice.findOrCreate({
    where: { cropId: cropTomato.id, marketId: marketPune.id, priceDate: today },
    defaults: {
      cropId: cropTomato.id,
      marketId: marketPune.id,
      pricePerKg: 20.00,
      pricePerQuintal: 2000,
      minPrice: 1840,
      maxPrice: 2160,
      dataType: "verified_live",
      priceDate: today
    }
  });

  await MarketPrice.findOrCreate({
    where: { cropId: cropOnion.id, marketId: marketPune.id, priceDate: today },
    defaults: {
      cropId: cropOnion.id,
      marketId: marketPune.id,
      pricePerKg: 25.00,
      pricePerQuintal: 2500,
      minPrice: 2300,
      maxPrice: 2700,
      dataType: "verified_live",
      priceDate: today
    }
  });

  // Test 2: Create a test farmer user
  const testEmail = `farmer_test_${Date.now()}@test.local`;
  const farmerUser = await User.create({
    name: "Ramesh Farmer",
    email: testEmail,
    phone: "9876543210",
    password: "hashedpassword123",
    role: "farmer"
  });

  // Test 3: Initialize multi-crop profile (Tomato: 500 kg, Onion: 300 kg)
  const initialQuantities = {
    Tomato: { qty: 500, unit: "kg", harvestQuantityKg: 500 },
    Onion: { qty: 300, unit: "kg", harvestQuantityKg: 300 }
  };

  const profile = await FarmerProfile.create({
    userId: farmerUser.id,
    district: "Pune",
    state: "Maharashtra",
    farmSizeAcres: 5.0,
    mainCrop: "Tomato, Onion",
    currentHarvestKg: 800, // 500 + 300
    productQuantities: JSON.stringify(initialQuantities)
  });

  console.log("  ✅ Test Farmer created with Tomato (500kg) & Onion (300kg)");

  // Test 4: Mock GET /api/farmer/crops
  {
    const req = { user: { id: farmerUser.id, role: "farmer" } };
    let responseData = null;
    let statusCode = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
          }
        };
      }
    };

    await farmerController.getCrops(req, res);
    assert.strictEqual(statusCode, 200, "getCrops should return 200");
    assert.strictEqual(responseData.success, true, "getCrops should succeed");
    assert.strictEqual(responseData.crops.length, 2, "Should return 2 crops");

    const tomato = responseData.crops.find(c => c.cropName === "Tomato");
    const onion = responseData.crops.find(c => c.cropName === "Onion");

    assert(tomato, "Tomato should be in crops list");
    assert(onion, "Onion should be in crops list");
    assert.strictEqual(tomato.harvestQuantityKg, 500, "Tomato quantity should be 500 kg");
    assert.strictEqual(onion.harvestQuantityKg, 300, "Onion quantity should be 300 kg");

    // Check pricing dynamically: harvestQuantityKg * marketPricePerKg
    assert(tomato.marketPricePerKg > 0, "Tomato price per kg should be greater than 0");
    assert.strictEqual(tomato.estimatedRevenue, Math.round(500 * tomato.marketPricePerKg), "Tomato revenue should equal 500 * pricePerKg");
    assert(onion.marketPricePerKg > 0, "Onion price per kg should be greater than 0");
    assert.strictEqual(onion.estimatedRevenue, Math.round(300 * onion.marketPricePerKg), "Onion revenue should equal 300 * pricePerKg");

    assert.strictEqual(responseData.summary.totalHarvestKg, 800, "Total harvest should be 800 kg");
    const expectedTotalRev = tomato.estimatedRevenue + onion.estimatedRevenue;
    assert.strictEqual(responseData.summary.totalEstimatedRevenue, expectedTotalRev, "Total revenue should equal sum of valid crop revenues");
    console.log(`  ✅ getCrops correctly returned dynamic crops, live prices, and revenue (₹${expectedTotalRev.toLocaleString('en-IN')})`);
  }

  // Test 5: Mock POST /api/farmer/crops (Add Wheat: 800 kg)
  {
    const req = {
      user: { id: farmerUser.id, role: "farmer" },
      body: { cropName: "Wheat", harvestQuantityKg: 800, unit: "kg" }
    };
    let responseData = null;
    let statusCode = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
          }
        };
      }
    };

    await farmerController.addCrop(req, res);
    assert.strictEqual(statusCode, 201, "addCrop should return 201");
    assert.strictEqual(responseData.success, true, "addCrop should succeed");
    assert.strictEqual(responseData.crop.cropName, "Wheat");
    assert.strictEqual(responseData.crop.harvestQuantityKg, 800);
    assert.strictEqual(responseData.summary.totalHarvestKg, 1600, "Total should be 500 + 300 + 800 = 1600 kg");
    console.log("  ✅ addCrop added Wheat (800kg), total harvest updated to 1600kg");
  }

  // Test 6: Duplicate Crop Prevention
  {
    const req = {
      user: { id: farmerUser.id, role: "farmer" },
      body: { cropName: "Tomato", harvestQuantityKg: 200 }
    };
    let statusCode = null;
    let responseData = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
          }
        };
      }
    };

    await farmerController.addCrop(req, res);
    assert.strictEqual(statusCode, 409, "Duplicate crop must return 409 Conflict");
    assert.strictEqual(responseData.success, false);
    console.log("  ✅ Duplicate crop correctly rejected with 409 Conflict");
  }

  // Test 7: Mock PUT /api/farmer/crops/:cropName (Update Tomato quantity to 700 kg)
  {
    const req = {
      user: { id: farmerUser.id, role: "farmer" },
      params: { cropName: "Tomato" },
      body: { harvestQuantityKg: 700, unit: "kg" }
    };
    let responseData = null;
    let statusCode = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
          }
        };
      }
    };

    await farmerController.updateCropQuantity(req, res);
    assert.strictEqual(statusCode, 200, "updateCropQuantity should return 200");
    assert.strictEqual(responseData.crop.estimatedRevenue, Math.round(700 * responseData.crop.marketPricePerKg), "700 * marketPricePerKg");
    assert.strictEqual(responseData.summary.totalHarvestKg, 1800, "700 + 300 + 800 = 1800 kg");
    console.log(`  ✅ updateCropQuantity updated Tomato to 700kg, revenue recalculates to ₹${responseData.crop.estimatedRevenue.toLocaleString('en-IN')}`);
  }

  // Test 8: Unit conversion tests (1 Tonne = 1000 kg, 2 Quintals = 200 kg)
  {
    const req = {
      user: { id: farmerUser.id, role: "farmer" },
      body: { cropName: "Cotton", harvestQuantityKg: 2, unit: "tonne" }
    };
    let responseData = null;
    const res = {
      status: () => ({
        json: (data) => { responseData = data; }
      })
    };

    await farmerController.addCrop(req, res);
    assert.strictEqual(responseData.crop.harvestQuantityKg, 2000, "2 tonnes must convert to 2000 kg");
    console.log("  ✅ Unit conversion: 2 tonnes correctly converted to 2000 kg");
  }

  // Test 9: Mock DELETE /api/farmer/crops/:cropName (Remove Cotton)
  {
    const req = {
      user: { id: farmerUser.id, role: "farmer" },
      params: { cropName: "Cotton" }
    };
    let responseData = null;
    let statusCode = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { responseData = data; }
        };
      }
    };

    await farmerController.removeCrop(req, res);
    assert.strictEqual(statusCode, 200, "removeCrop should return 200");
    assert.strictEqual(responseData.success, true);
    assert.strictEqual(responseData.summary.totalHarvestKg, 1800, "Total harvest restored to 1800 kg");
    console.log("  ✅ removeCrop correctly deleted crop and updated total harvest");
  }

  // Test 10: Missing Market Price handling (Unlisted crop: DragonFruit)
  {
    const req = {
      user: { id: farmerUser.id, role: "farmer" },
      body: { cropName: "DragonFruitSpecialXYZ", harvestQuantityKg: 100 }
    };
    let responseData = null;
    const res = {
      status: () => ({
        json: (data) => { responseData = data; }
      })
    };

    await farmerController.addCrop(req, res);
    assert.strictEqual(responseData.crop.marketPricePerKg, null, "Unlisted crop must have null price");
    assert.strictEqual(responseData.crop.priceStatus, "UNAVAILABLE", "Status must be UNAVAILABLE");
    assert.strictEqual(responseData.crop.estimatedRevenue, null, "Must NOT invent estimated revenue when price is unavailable");
    console.log("  ✅ Unverified crop correctly returns 'Market price unavailable' with null revenue (no fake prices)");
  }

  // Clean up test records
  await FarmerProfile.destroy({ where: { userId: farmerUser.id } });
  await User.destroy({ where: { id: farmerUser.id } });

  console.log("🎉 ALL FARMER CROPS & REVENUE TESTS PASSED SUCCESSFULLY!\n");
}

if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Test failed:", err);
      process.exit(1);
    });
}

module.exports = runTests;
