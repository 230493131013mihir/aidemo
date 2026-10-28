const http = require('http');
const path = require('path');
const assert = require('assert');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const app = require('../app');
const { User, FarmerProfile, MandiProfile, ContactRequest } = require('../models');
const { 
  calculateSingleCropAvailability, 
  calculateFarmerCropsAvailability 
} = require('../services/cropAvailabilityService');

async function runTests() {
  console.log('\n======================================================');
  console.log('🛡️ HarvestMitra AI — Sold-Out Crop & Procurement Guard Tests');
  console.log('======================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const secret = process.env.JWT_SECRET || 'harvestmitra_secret';

  // 1. Setup isolated test farmer (Prashant with 200 kg Cotton)
  let farmer = await User.findOne({ where: { email: 'test_prashant_cotton_farmer@harvestmitra.test' } });
  if (!farmer) {
    farmer = await User.create({
      name: 'Prashant Warule (Test Farmer)',
      email: 'test_prashant_cotton_farmer@harvestmitra.test',
      phone: '9822990001',
      password: 'testpassword',
      role: 'farmer'
    });
    await FarmerProfile.create({
      userId: farmer.id,
      district: 'Pune',
      state: 'Maharashtra',
      village: 'Indapur',
      farmSizeAcres: 5.0,
      mainCrop: 'Cotton',
      currentHarvestKg: 200,
      productQuantities: JSON.stringify({ Cotton: { qty: 200, unit: 'kg', expectedPricePerKg: 75.65 } })
    });
  } else {
    const profile = await FarmerProfile.findOne({ where: { userId: farmer.id } });
    if (profile) {
      profile.productQuantities = JSON.stringify({ Cotton: { qty: 200, unit: 'kg', expectedPricePerKg: 75.65 } });
      profile.currentHarvestKg = 200;
      await profile.save();
    }
  }

  // Clear any existing test bookings for clean, deterministic test execution
  await ContactRequest.destroy({ where: { receiverId: farmer.id } });

  // 2. Setup isolated test Mandi official
  let mandiUser = await User.findOne({ where: { email: 'test_mandi_guard_official@harvestmitra.test' } });
  if (!mandiUser) {
    mandiUser = await User.create({
      name: 'Pune APMC Procurement Desk',
      email: 'test_mandi_guard_official@harvestmitra.test',
      phone: '9822990002',
      password: 'testpassword',
      role: 'mandi'
    });
    await MandiProfile.create({
      userId: mandiUser.id,
      mandiName: 'Pune APMC (Gultekdi)',
      licenseNumber: 'MH-APMC-PUN-GUARD-2024',
      district: 'Pune',
      state: 'Maharashtra'
    });
  }

  const mandiToken = jwt.sign({ id: mandiUser.id, role: mandiUser.role, name: mandiUser.name }, secret, { expiresIn: '1h' });

  // -----------------------------------------------------------------------------------
  // TEST 1: Baseline availability calculation
  // -----------------------------------------------------------------------------------
  const profile = await FarmerProfile.findOne({ where: { userId: farmer.id } });
  const initAvail = await calculateSingleCropAvailability(farmer.id, profile, 'Cotton');
  assert.strictEqual(initAvail.totalKg, 200, 'Total Cotton quantity must be 200 kg');
  assert.strictEqual(initAvail.bookedKg, 0, 'Initial booked quantity must be 0 kg');
  assert.strictEqual(initAvail.availableKg, 200, 'Initial available quantity must be 200 kg');
  assert.strictEqual(initAvail.isSoldOut, false, 'Listing must not be sold out initially');
  console.log('  ✅ [PASS] 1. Baseline availability calculated correctly (Total: 200 kg, Available: 200 kg, isSoldOut: false)');

  // -----------------------------------------------------------------------------------
  // TEST 2: Rejection of 0 kg and negative quantity requests (400 Bad Request)
  // -----------------------------------------------------------------------------------
  const resZero = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mandiToken}` },
    body: JSON.stringify({ farmerId: farmer.id, cropName: 'Cotton', quantityKg: 0, offeredRate: 75.65 })
  });
  assert.strictEqual(resZero.status, 400, '0 kg procurement request must return 400');

  const resNeg = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mandiToken}` },
    body: JSON.stringify({ farmerId: farmer.id, cropName: 'Cotton', quantityKg: -50, offeredRate: 75.65 })
  });
  assert.strictEqual(resNeg.status, 400, 'Negative quantity procurement request must return 400');
  console.log('  ✅ [PASS] 2. 0 kg and negative quantity requests rejected with 400 Bad Request');

  // -----------------------------------------------------------------------------------
  // TEST 3: Rejection of request exceeding available quantity (250 kg when 200 kg available)
  // -----------------------------------------------------------------------------------
  const resExceed = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mandiToken}` },
    body: JSON.stringify({ farmerId: farmer.id, cropName: 'Cotton', quantityKg: 250, offeredRate: 75.65 })
  });
  assert.strictEqual(resExceed.status, 400, 'Overbooking request must return 400');
  const exceedJson = await resExceed.json();
  assert.strictEqual(exceedJson.code, 'EXCEEDS_AVAILABLE_QUANTITY');
  assert.ok(exceedJson.message.includes('exceeds remaining available quantity'), 'Error message specifies overbooking');
  console.log('  ✅ [PASS] 3. Overbooking request (250 kg on 200 kg available) rejected with EXCEEDS_AVAILABLE_QUANTITY');

  // -----------------------------------------------------------------------------------
  // TEST 4: Valid procurement request (50 kg) accepted and updates available quantity
  // -----------------------------------------------------------------------------------
  const resValid1 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mandiToken}` },
    body: JSON.stringify({ farmerId: farmer.id, cropName: 'Cotton', quantityKg: 50, offeredRate: 75.65 })
  });
  assert.strictEqual(resValid1.status, 201, 'Valid 50 kg request must return 201 Created');
  const valid1Json = await resValid1.json();
  assert.strictEqual(valid1Json.remainingAvailableKg, 150, 'Remaining available must now be 150 kg');
  const book1 = valid1Json.data;

  const availAfter1 = await calculateSingleCropAvailability(farmer.id, profile, 'Cotton');
  assert.strictEqual(availAfter1.bookedKg, 50, 'Booked quantity is now 50 kg');
  assert.strictEqual(availAfter1.availableKg, 150, 'Available quantity is now 150 kg');
  assert.strictEqual(availAfter1.isSoldOut, false, 'Listing is not yet sold out');
  console.log('  ✅ [PASS] 4. Valid booking for 50 kg accepted (201 Created); remaining stock is 150 kg');

  // -----------------------------------------------------------------------------------
  // TEST 5: Second procurement request takes remaining 150 kg; available becomes 0 kg
  // -----------------------------------------------------------------------------------
  const resValid2 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mandiToken}` },
    body: JSON.stringify({ farmerId: farmer.id, cropName: 'Cotton', quantityKg: 150, offeredRate: 75.65 })
  });
  assert.strictEqual(resValid2.status, 201, 'Valid 150 kg request must return 201 Created');
  const valid2Json = await resValid2.json();
  assert.strictEqual(valid2Json.remainingAvailableKg, 0, 'Remaining available must now be 0 kg');
  const book2 = valid2Json.data;

  const availAfter2 = await calculateSingleCropAvailability(farmer.id, profile, 'Cotton');
  assert.strictEqual(availAfter2.totalKg, 200);
  assert.strictEqual(availAfter2.bookedKg, 200, 'Total booked is 200 kg');
  assert.strictEqual(availAfter2.availableKg, 0, 'Available quantity is 0 kg');
  assert.strictEqual(availAfter2.isSoldOut, true, 'Listing is now officially SOLD OUT');
  console.log('  ✅ [PASS] 5. Remaining 150 kg booked; listing transitions to SOLD OUT (0 kg available)');

  // -----------------------------------------------------------------------------------
  // TEST 6: Direct API request for sold-out listing is strictly rejected (409 Conflict)
  // -----------------------------------------------------------------------------------
  const resSoldOut = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mandiToken}` },
    body: JSON.stringify({ farmerId: farmer.id, cropName: 'Cotton', quantityKg: 20, offeredRate: 75.65 })
  });
  assert.strictEqual(resSoldOut.status, 409, 'Request for sold out crop must return 409 Conflict');
  const soldOutJson = await resSoldOut.json();
  assert.strictEqual(soldOutJson.code, 'SOLD_OUT');
  assert.strictEqual(soldOutJson.availableKg, 0);
  assert.ok(soldOutJson.message.includes('SOLD OUT (0 kg available)'), 'Error message clearly indicates sold out');
  console.log('  ✅ [PASS] 6. Direct API request on sold-out listing rejected with 409 Conflict (code: SOLD_OUT)');

  // -----------------------------------------------------------------------------------
  // TEST 7: GET /api/auth/farmers includes authoritative cropsAvailability and isAllSoldOut
  // -----------------------------------------------------------------------------------
  const resFarmers = await fetch(`${baseUrl}/api/auth/farmers?district=Pune`, {
    headers: { 'Authorization': `Bearer ${mandiToken}` }
  });
  assert.strictEqual(resFarmers.status, 200);
  const farmersJson = await resFarmers.json();
  const testFarmerRecord = farmersJson.data.find(f => f.id === farmer.id);
  assert.ok(testFarmerRecord, 'Test farmer must be in farmers directory');
  assert.strictEqual(testFarmerRecord.isAllSoldOut, true, 'Test farmer isAllSoldOut must be true');
  const cottonCrop = testFarmerRecord.cropsAvailability.find(c => c.crop === 'Cotton');
  assert.ok(cottonCrop, 'Cotton crop availability must be present');
  assert.strictEqual(cottonCrop.totalKg, 200);
  assert.strictEqual(cottonCrop.bookedKg, 200);
  assert.strictEqual(cottonCrop.availableKg, 0);
  assert.strictEqual(cottonCrop.isSoldOut, true);
  console.log('  ✅ [PASS] 7. GET /api/auth/farmers returns authoritative sold-out metadata (isAllSoldOut: true, availableKg: 0)');

  // -----------------------------------------------------------------------------------
  // TEST 8: Releasing / Cancelling a booking restores stock availability
  // -----------------------------------------------------------------------------------
  // Cancel booking 2 (150 kg)
  const resCancel = await fetch(`${baseUrl}/api/auth/contact-requests/${book2.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mandiToken}` },
    body: JSON.stringify({ status: 'cancelled' })
  });
  assert.strictEqual(resCancel.status, 200);

  const availAfterCancel = await calculateSingleCropAvailability(farmer.id, profile, 'Cotton');
  assert.strictEqual(availAfterCancel.bookedKg, 50, 'Booked quantity decreases back to 50 kg');
  assert.strictEqual(availAfterCancel.availableKg, 150, 'Available quantity restores back to 150 kg');
  assert.strictEqual(availAfterCancel.isSoldOut, false, 'Listing is no longer sold out');
  console.log('  ✅ [PASS] 8. Cancelling 150 kg booking releases reservation back to available stock (150 kg available)');

  // -----------------------------------------------------------------------------------
  // TEST 9: Concurrent booking requests cannot overbook produce
  // -----------------------------------------------------------------------------------
  // Current available is 150 kg. We fire two simultaneous requests for 100 kg each (100 + 100 = 200 > 150).
  const [conc1, conc2] = await Promise.all([
    fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mandiToken}` },
      body: JSON.stringify({ farmerId: farmer.id, cropName: 'Cotton', quantityKg: 100, offeredRate: 75.65 })
    }),
    fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mandiToken}` },
      body: JSON.stringify({ farmerId: farmer.id, cropName: 'Cotton', quantityKg: 100, offeredRate: 75.65 })
    })
  ]);

  const statuses = [conc1.status, conc2.status].sort();
  // One must succeed (201) and one must be rejected (400 or 409)
  assert.strictEqual(statuses[0], 201, 'Exactly one concurrent request must succeed');
  assert.ok(statuses[1] === 400 || statuses[1] === 409, 'Second concurrent request must be rejected (cannot overbook)');
  console.log(`  ✅ [PASS] 9. Concurrency guard prevents double-booking: statuses=[${conc1.status}, ${conc2.status}]`);

  // Final availability check: 50 + 100 = 150 kg booked, remaining = 50 kg
  const finalAvail = await calculateSingleCropAvailability(farmer.id, profile, 'Cotton');
  assert.strictEqual(finalAvail.bookedKg, 150, 'Total booked is exactly 150 kg');
  assert.strictEqual(finalAvail.availableKg, 50, 'Available quantity is 50 kg');
  console.log('  ✅ [PASS] 10. Stock integrity preserved: exactly 50 kg remains available');

  console.log('\n======================================================');
  console.log('🎉 ALL 10 APMC SOLD-OUT & PROCUREMENT GUARD TESTS PASSED!');
  console.log('======================================================\n');

  server.close();
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
