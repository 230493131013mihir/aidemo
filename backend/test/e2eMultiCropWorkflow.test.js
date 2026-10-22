/**
 * e2eMultiCropWorkflow.test.js
 * End-to-End Live HTTP Integration Test
 * Verifies Steps 1 through 11:
 * - Multi-crop registration
 * - Dynamic login retrieval
 * - Live APMC market price integration
 * - Revenue calculation formula
 * - Edit crop quantity
 * - Add new crop
 * - Prevent duplicate crop
 * - Remove crop
 * - Farmer data isolation
 */

const assert = require("assert");

const API_BASE = "http://127.0.0.1:5000";

async function runE2E() {
  console.log("🚀 Starting End-to-End Multi-Crop Workflow Integration Tests...\n");

  const timestamp = Date.now();
  const farmer1Email = `ramesh_${timestamp}@harvestmitra.local`;
  const farmer2Email = `suresh_${timestamp}@harvestmitra.local`;
  const phone1 = "98" + String(Math.floor(10000000 + Math.random() * 90000000));
  const phone2 = "98" + String(Math.floor(10000000 + Math.random() * 90000000));
  const password = "Password123";

  // STEP 1: Register Farmer 1 (Ramesh) with 3 crops: Tomato (500kg), Onion (300kg), Wheat (800kg)
  console.log("TEST 1 & 2: Multi-Crop Registration for Ramesh Patel (Tomato 500kg, Onion 300kg, Wheat 800kg)");
  const reg1Res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Ramesh Patel",
      email: farmer1Email,
      phone: phone1,
      password: password,
      role: "farmer",
      district: "Pune",
      state: "Maharashtra",
      farmSizeAcres: 6.5,
      mainCrop: "Tomato, Onion, Wheat",
      productQuantities: JSON.stringify({
        Tomato: { qty: 500, unit: "kg" },
        Onion: { qty: 300, unit: "kg" },
        Wheat: { qty: 800, unit: "kg" }
      }),
      currentHarvestKg: 1600
    })
  });

  const reg1Data = await reg1Res.json();
  assert.strictEqual(reg1Res.status, 201, "Registration should return 201 Created");
  assert.strictEqual(reg1Data.success, true);
  console.log("  ✅ Ramesh successfully registered with 3 crops.");

  // STEP 2: Login as Farmer 1 (Ramesh)
  console.log("\nTEST 3: Login as Ramesh Patel & Retrieve Session");
  const login1Res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: farmer1Email, password })
  });

  const login1Data = await login1Res.json();
  assert.strictEqual(login1Res.status, 200, "Login should return 200 OK");
  assert(login1Data.token, "JWT token should be returned");
  const token1 = login1Data.token;
  console.log("  ✅ Login successful, JWT received.");

  // STEP 3: Fetch Ramesh's Registered Crops from /api/farmer/crops
  console.log("\nTEST 4: Fetch Registered Crops via GET /api/farmer/crops");
  const crops1Res = await fetch(`${API_BASE}/api/farmer/crops`, {
    headers: { Authorization: `Bearer ${token1}` }
  });

  const crops1Data = await crops1Res.json();
  assert.strictEqual(crops1Res.status, 200);
  assert.strictEqual(crops1Data.success, true);
  assert.strictEqual(crops1Data.crops.length, 3, "Ramesh should have 3 registered crops");

  const tomato = crops1Data.crops.find(c => c.cropName === "Tomato");
  const onion = crops1Data.crops.find(c => c.cropName === "Onion");
  const wheat = crops1Data.crops.find(c => c.cropName === "Wheat");

  assert(tomato, "Tomato must be present");
  assert(onion, "Onion must be present");
  assert(wheat, "Wheat must be present");

  assert.strictEqual(tomato.harvestQuantityKg, 500, "Tomato quantity must be 500 kg");
  assert.strictEqual(onion.harvestQuantityKg, 300, "Onion quantity must be 300 kg");
  assert.strictEqual(wheat.harvestQuantityKg, 800, "Wheat quantity must be 800 kg");

  assert(tomato.marketPricePerKg > 0, "Tomato APMC price must be retrieved");
  assert(onion.marketPricePerKg > 0, "Onion APMC price must be retrieved");
  assert(wheat.marketPricePerKg > 0, "Wheat APMC price must be retrieved");

  // Check mathematical revenue formula: harvestQuantityKg * marketPricePerKg
  assert.strictEqual(tomato.estimatedRevenue, Math.round(500 * tomato.marketPricePerKg));
  assert.strictEqual(onion.estimatedRevenue, Math.round(300 * onion.marketPricePerKg));
  assert.strictEqual(wheat.estimatedRevenue, Math.round(800 * wheat.marketPricePerKg));

  const totalCalculatedRev = tomato.estimatedRevenue + onion.estimatedRevenue + wheat.estimatedRevenue;
  assert.strictEqual(crops1Data.summary.totalHarvestKg, 1600, "Total harvest should be 1,600 kg");
  assert.strictEqual(crops1Data.summary.totalEstimatedRevenue, totalCalculatedRev, "Total revenue must equal sum of valid crop revenues");

  console.log(`  ✅ All 3 crops loaded separately:`);
  console.log(`     - Tomato: 500 kg @ ₹${tomato.marketPricePerKg}/kg = ₹${tomato.estimatedRevenue.toLocaleString("en-IN")}`);
  console.log(`     - Onion:  300 kg @ ₹${onion.marketPricePerKg}/kg = ₹${onion.estimatedRevenue.toLocaleString("en-IN")}`);
  console.log(`     - Wheat:  800 kg @ ₹${wheat.marketPricePerKg}/kg = ₹${wheat.estimatedRevenue.toLocaleString("en-IN")}`);
  console.log(`     - Total:  1,600 kg, Est. Gross Revenue = ₹${totalCalculatedRev.toLocaleString("en-IN")}`);

  // STEP 4: Edit Quantity for Tomato to 700 kg
  console.log("\nTEST 5: Edit Tomato Harvest Quantity to 700 kg via PUT /api/farmer/crops/Tomato");
  const editRes = await fetch(`${API_BASE}/api/farmer/crops/Tomato`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({ harvestQuantityKg: 700, unit: "kg" })
  });

  const editData = await editRes.json();
  assert.strictEqual(editRes.status, 200);
  assert.strictEqual(editData.crop.harvestQuantityKg, 700);
  assert.strictEqual(editData.summary.totalHarvestKg, 1800, "Total harvest should update to 700 + 300 + 800 = 1,800 kg");
  console.log(`  ✅ Tomato quantity updated to 700 kg, total harvest recalculated to 1,800 kg.`);

  // STEP 5: Add New Crop (Cotton: 400 kg)
  console.log("\nTEST 6: Add New Crop (Cotton: 400 kg) via POST /api/farmer/crops");
  const addRes = await fetch(`${API_BASE}/api/farmer/crops`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({ cropName: "Cotton", harvestQuantityKg: 400, unit: "kg" })
  });

  const addData = await addRes.json();
  assert.strictEqual(addRes.status, 201);
  assert.strictEqual(addData.crop.cropName, "Cotton");
  assert.strictEqual(addData.summary.totalHarvestKg, 2200, "Total harvest should update to 1800 + 400 = 2,200 kg");
  console.log("  ✅ Cotton added, total harvest updated to 2,200 kg.");

  // STEP 6: Duplicate Crop Prevention
  console.log("\nTEST 7: Duplicate Crop Prevention (Attempt adding Cotton again)");
  const dupRes = await fetch(`${API_BASE}/api/farmer/crops`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({ cropName: "Cotton", harvestQuantityKg: 200 })
  });

  assert.strictEqual(dupRes.status, 409, "Duplicate crop registration must return 409 Conflict");
  console.log("  ✅ Duplicate crop registration correctly rejected with 409 Conflict.");

  // STEP 7: Validation - Negative Quantity
  console.log("\nTEST 8: Validation Prevention (Negative / 0 Quantity)");
  const negRes = await fetch(`${API_BASE}/api/farmer/crops`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({ cropName: "Potato", harvestQuantityKg: -50 })
  });

  assert.strictEqual(negRes.status, 400, "Negative quantity must return 400 Bad Request");
  console.log("  ✅ Invalid negative quantity rejected with 400 Bad Request.");

  // STEP 8: Remove a Crop (Delete Onion)
  console.log("\nTEST 9: Remove Crop (Delete Onion via DELETE /api/farmer/crops/Onion)");
  const delRes = await fetch(`${API_BASE}/api/farmer/crops/Onion`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token1}` }
  });

  const delData = await delRes.json();
  assert.strictEqual(delRes.status, 200);
  assert.strictEqual(delData.summary.totalHarvestKg, 1900, "Total harvest should be 2200 - 300 = 1,900 kg");
  console.log("  ✅ Onion removed, total harvest updated to 1,900 kg.");

  // STEP 9: Multi-User Farmer Data Isolation
  console.log("\nTEST 10: Multi-User Farmer Data Isolation");
  // Register Suresh with only Soybean 600 kg
  const reg2Res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Suresh Farmer",
      email: farmer2Email,
      phone: phone2,
      password: password,
      role: "farmer",
      district: "Nashik",
      state: "Maharashtra",
      farmSizeAcres: 3.0,
      mainCrop: "Soybean",
      productQuantities: JSON.stringify({ Soybean: { qty: 600, unit: "kg" } }),
      currentHarvestKg: 600
    })
  });
  const reg2Data = await reg2Res.json();
  const token2 = reg2Data.token;

  // Suresh fetches crops
  const crops2Res = await fetch(`${API_BASE}/api/farmer/crops`, {
    headers: { Authorization: `Bearer ${token2}` }
  });
  const crops2Data = await crops2Res.json();
  assert.strictEqual(crops2Data.crops.length, 1);
  assert.strictEqual(crops2Data.crops[0].cropName, "Soybean");
  assert.strictEqual(crops2Data.summary.totalHarvestKg, 600);

  // Ramesh fetches crops
  const crops1FinalRes = await fetch(`${API_BASE}/api/farmer/crops`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  const crops1FinalData = await crops1FinalRes.json();
  assert.strictEqual(crops1FinalData.crops.length, 3, "Ramesh should still have 3 crops (Tomato, Wheat, Cotton)");
  assert(!crops1FinalData.crops.some(c => c.cropName === "Soybean"), "Ramesh must NOT see Suresh's Soybean");
  assert(!crops2Data.crops.some(c => c.cropName === "Tomato"), "Suresh must NOT see Ramesh's Tomato");
  console.log("  ✅ Complete isolation verified: Suresh only sees Soybean; Ramesh only sees Tomato, Wheat, Cotton.");

  console.log("\n🎉 ALL 10 END-TO-END WORKFLOW INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n");
}

runE2E()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ E2E Test Failure:", err);
    process.exit(1);
  });
