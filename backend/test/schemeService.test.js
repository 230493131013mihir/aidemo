const assert = require("assert");
const schemeService = require("../services/schemeService");
const sequelize = require("../config/database");

async function runTests() {
  console.log("==========================================");
  console.log("  Running Government Scheme Service Tests");
  console.log("==========================================");

  // Sync DB
  await sequelize.sync();

  // Test 1: Seed verification
  console.log("Test 1: Seed initialization...");
  await schemeService.ensureSeeded();
  const listResult = await schemeService.listSchemes({ limit: 15 });
  assert.ok(listResult.total >= 10, "Should have at least 10 seeded schemes");
  assert.ok(Array.isArray(listResult.data), "Result data must be an array");
  console.log(`✅ Seeded schemes verified: Total count = ${listResult.total}`);

  // Test 2: Category Filter
  console.log("Test 2: Category filtering...");
  const dripSchemes = await schemeService.listSchemes({ category: "irrigation_water" });
  assert.ok(dripSchemes.data.length > 0, "Should return irrigation schemes");
  dripSchemes.data.forEach(s => {
    assert.strictEqual(s.category, "irrigation_water", "Category must match filter");
  });
  console.log(`✅ Category filtering verified: Found ${dripSchemes.data.length} irrigation schemes.`);

  // Test 3: Get Scheme By Identifier (PM-KISAN)
  console.log("Test 3: Scheme lookup by identifier...");
  const pmKisan = await schemeService.getSchemeById("pm-kisan");
  assert.strictEqual(pmKisan.identifier, "pm-kisan");
  assert.strictEqual(pmKisan.officialDomain, "pmkisan.gov.in");
  assert.ok(pmKisan.officialInfoUrl.startsWith("https://pmkisan.gov.in"), "Info URL must be verified official domain");
  assert.ok(Array.isArray(pmKisan.requiredDocuments), "Required documents must be array");
  console.log(`✅ Scheme lookup verified: ${pmKisan.nameEn}`);

  // Test 4: Deterministic Rule-Based Eligibility Engine
  console.log("Test 4: Deterministic matching engine...");
  const matchResult = await schemeService.matchSchemes({
    state: "Gujarat",
    district: "Surat",
    farmSizeAcres: 3.5,
    crops: ["Tomato", "Wheat"],
    irrigationMethod: "drip",
    hasLandOwnership: true,
    age: 42
  });

  assert.ok(matchResult.length > 0, "Matching engine must return results");
  const pmKisanMatch = matchResult.find(m => m.identifier === "pm-kisan");
  assert.ok(pmKisanMatch, "PM-KISAN should be in matched schemes");
  assert.strictEqual(pmKisanMatch.eligibilityOutcome, "potentially_eligible", "Small landholder with land ownership should be potentially eligible for PM-KISAN");
  assert.ok(pmKisanMatch.matchedReasons.length > 0, "Must provide explainable reasons for match");
  console.log(`✅ Matching engine verified: Outcome = ${pmKisanMatch.eligibilityOutcome}, matched reasons: ${pmKisanMatch.matchedReasons.length}`);

  // Test 5: Ineligible criteria test (non-landholder on landholding scheme)
  console.log("Test 5: Ineligibility explanation check...");
  const nonLandholderMatch = await schemeService.matchSchemes({
    state: "Gujarat",
    farmSizeAcres: 0,
    hasLandOwnership: false
  });
  const pmKisanNoLand = nonLandholderMatch.find(m => m.identifier === "pm-kisan");
  assert.strictEqual(pmKisanNoLand.eligibilityOutcome, "ineligible", "Farmer without land title should be marked ineligible for PM-KISAN");
  assert.ok(pmKisanNoLand.disqualifiedReasons.length > 0, "Must supply clear disqualification reason");
  console.log(`✅ Ineligibility explanation verified: "${pmKisanNoLand.disqualifiedReasons[0]}"`);

  console.log("==========================================");
  console.log("  All Scheme Service Tests Passed! (5/5) ✅");
  console.log("==========================================");
}

runTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
