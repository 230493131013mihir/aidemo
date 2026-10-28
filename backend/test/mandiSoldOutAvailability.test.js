const http = require('http');
const path = require('path');
const assert = require('assert');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const app = require('../app');
const { User, FarmerProfile, MandiProfile, ContactRequest } = require('../models');

async function runTests() {
  console.log('\n================================================================');
  console.log('🌾 HarvestMitra AI — Mandi Crop Lot Sold-Out & Availability Tests');
  console.log('================================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const secret = process.env.JWT_SECRET || 'harvestmitra_secret';

  // Find or create test farmer with a 1000 kg Onion lot
  let farmer = await User.findOne({ where: { email: 'test_soldout_farmer@harvestmitra.test' } });
  if (!farmer) {
    farmer = await User.create({
      name: 'Mihir Test Farmer',
      email: 'test_soldout_farmer@harvestmitra.test',
      phone: '9822009991',
      password: 'testpassword',
      role: 'farmer'
    });
    await FarmerProfile.create({
      userId: farmer.id,
      district: 'Pune',
      state: 'Maharashtra',
      village: 'Haveli',
      farmSizeAcres: 5.0,
      mainCrop: 'Onion',
      currentHarvestKg: 1000,
      productQuantities: JSON.stringify({ Onion: 1000 })
    });
  } else {
    // Reset farmer's productQuantities to 1000 Onion
    const fp = await FarmerProfile.findOne({ where: { userId: farmer.id } });
    await fp.update({
      currentHarvestKg: 1000,
      productQuantities: JSON.stringify({ Onion: 1000 })
    });
    // Clean up previous test bookings
    await ContactRequest.destroy({ where: { receiverId: farmer.id } });
  }

  // Find or create test mandi official
  let mandiUser = await User.findOne({ where: { email: 'test_soldout_mandi@harvestmitra.test' } });
  if (!mandiUser) {
    mandiUser = await User.create({
      name: 'Pune APMC Test Mandi',
      email: 'test_soldout_mandi@harvestmitra.test',
      phone: '9822009992',
      password: 'testpassword',
      role: 'mandi'
    });
    await MandiProfile.create({
      userId: mandiUser.id,
      mandiName: 'Pune APMC Market Yard',
      licenseNumber: 'MH-APMC-PUN-TEST-SOLDOUT',
      district: 'Pune',
      state: 'Maharashtra',
      operatingDays: 'Mon-Sat',
      facilities: 'Weighbridge'
    });
  }

  const farmerToken = jwt.sign({ id: farmer.id, role: farmer.role, name: farmer.name }, secret, { expiresIn: '1h' });
  const mandiToken = jwt.sign({ id: mandiUser.id, role: mandiUser.role, name: mandiUser.name }, secret, { expiresIn: '1h' });

  // 1. Initial State: 1000 kg Onion listed, 0 kg booked, 1000 kg available
  console.log('1. Checking Initial Crop Lot Availability via GET /api/auth/farmers:');
  const res1 = await fetch(`${baseUrl}/api/auth/farmers?district=Pune`, {
    headers: { 'Authorization': `Bearer ${mandiToken}` }
  });
  assert.strictEqual(res1.status, 200);
  const json1 = await res1.json();
  const testFarmer1 = json1.data.find(f => f.id === farmer.id);
  assert.ok(testFarmer1, 'Test farmer must be returned in farmers list');
  const onionCrop1 = testFarmer1.crops.find(c => c.crop.toLowerCase() === 'onion');
  assert.strictEqual(onionCrop1.originalQty, 1000, 'Original lot quantity must be 1000 kg');
  assert.strictEqual(onionCrop1.bookedKg, 0, 'Initial booked quantity must be 0 kg');
  assert.strictEqual(onionCrop1.availableKg, 1000, 'Available quantity must be 1000 kg');
  assert.strictEqual(onionCrop1.isSoldOut, false, 'isSoldOut must be false initially');
  assert.strictEqual(onionCrop1.isPartiallyBooked, false, 'isPartiallyBooked must be false initially');
  console.log('  ✅ [PASS] Initial lot correctly reflects 1,000 kg available, 0 kg booked, isSoldOut = false');

  // 2. Over-Booking Rejection: Mandi attempts to book 1,500 kg (> 1,000 kg available)
  console.log('\n2. Testing Over-Booking Prevention:');
  const res2 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mandiToken}`
    },
    body: JSON.stringify({
      farmerId: farmer.id,
      cropName: 'Onion',
      quantityKg: 1500,
      offeredRate: 28.50
    })
  });
  assert.strictEqual(res2.status, 400, 'Over-booking request must be rejected with 400 Bad Request');
  const json2 = await res2.json();
  assert.strictEqual(json2.success, false);
  assert.ok(json2.message.includes('exceeds') && json2.message.includes('available'), 'Error message must specify quantity exceeds available');
  console.log('  ✅ [PASS] Request for 1,500 kg (exceeding 1,000 kg lot) rejected with 400 Bad Request');

  // 3. Partial Booking: Mandi books 600 kg Onion
  console.log('\n3. Testing Partial Booking (600 kg of 1,000 kg):');
  const res3 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mandiToken}`
    },
    body: JSON.stringify({
      farmerId: farmer.id,
      cropName: 'Onion',
      quantityKg: 600,
      offeredRate: 28.50
    })
  });
  assert.strictEqual(res3.status, 201, 'Valid booking request must succeed with 201 Created');
  const json3 = await res3.json();
  const booking1Id = json3.data.id;

  // Farmer accepts the 600 kg booking
  const resAccept1 = await fetch(`${baseUrl}/api/auth/contact-requests/${booking1Id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${farmerToken}`
    },
    body: JSON.stringify({ status: 'accepted' })
  });
  assert.strictEqual(resAccept1.status, 200, 'Accepting booking must succeed');

  // Verify availability after 600 kg accepted: available = 400 kg, isPartiallyBooked = true
  const res4 = await fetch(`${baseUrl}/api/auth/farmers?district=Pune`, {
    headers: { 'Authorization': `Bearer ${mandiToken}` }
  });
  const json4 = await res4.json();
  const testFarmer4 = json4.data.find(f => f.id === farmer.id);
  const onionCrop4 = testFarmer4.crops.find(c => c.crop.toLowerCase() === 'onion');
  assert.strictEqual(onionCrop4.originalQty, 1000);
  assert.strictEqual(onionCrop4.bookedKg, 600, 'Booked quantity must now be 600 kg');
  assert.strictEqual(onionCrop4.availableKg, 400, 'Available quantity must now be 400 kg');
  assert.strictEqual(onionCrop4.isPartiallyBooked, true, 'isPartiallyBooked must be true');
  assert.strictEqual(onionCrop4.isSoldOut, false, 'isSoldOut must still be false');
  console.log('  ✅ [PASS] After 600 kg accepted: 400 kg available, 600 kg booked, isPartiallyBooked = true');

  // 4. Over-Booking Against Remaining: Mandi attempts to book 500 kg (> 400 kg remaining)
  console.log('\n4. Testing Over-Booking Against Remaining 400 kg:');
  const res5 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mandiToken}`
    },
    body: JSON.stringify({
      farmerId: farmer.id,
      cropName: 'Onion',
      quantityKg: 500,
      offeredRate: 28.50
    })
  });
  assert.strictEqual(res5.status, 400, 'Requesting 500 kg when only 400 kg available must fail');
  console.log('  ✅ [PASS] Request for 500 kg against 400 kg remaining rejected with 400 Bad Request');

  // 5. Full Allocation / Sold Out: Mandi books remaining 400 kg Onion
  console.log('\n5. Testing Full Allocation to SOLD OUT:');
  const res6 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mandiToken}`
    },
    body: JSON.stringify({
      farmerId: farmer.id,
      cropName: 'Onion',
      quantityKg: 400,
      offeredRate: 28.50
    })
  });
  assert.strictEqual(res6.status, 201);
  const json6 = await res6.json();
  const booking2Id = json6.data.id;

  // Farmer accepts the remaining 400 kg booking
  const resAccept2 = await fetch(`${baseUrl}/api/auth/contact-requests/${booking2Id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${farmerToken}`
    },
    body: JSON.stringify({ status: 'accepted' })
  });
  assert.strictEqual(resAccept2.status, 200);

  // Verify availability: available = 0 kg, isSoldOut = true, isFullyBooked = true
  const res7 = await fetch(`${baseUrl}/api/auth/farmers?district=Pune`, {
    headers: { 'Authorization': `Bearer ${mandiToken}` }
  });
  const json7 = await res7.json();
  const testFarmer7 = json7.data.find(f => f.id === farmer.id);
  const onionCrop7 = testFarmer7.crops.find(c => c.crop.toLowerCase() === 'onion');
  assert.strictEqual(onionCrop7.originalQty, 1000);
  assert.strictEqual(onionCrop7.bookedKg, 1000, 'Booked quantity must be 1,000 kg');
  assert.strictEqual(onionCrop7.availableKg, 0, 'Available quantity must be 0 kg');
  assert.strictEqual(onionCrop7.isSoldOut, true, 'isSoldOut must be true');
  assert.strictEqual(testFarmer7.isFullyBooked, true, 'Farmer isFullyBooked must be true');
  console.log('  ✅ [PASS] 100% booked: available = 0 kg, isSoldOut = true, farmer isFullyBooked = true');

  // 6. Attempting to Book a Sold-Out Crop Lot returns 409 Conflict
  console.log('\n6. Testing Procurement Request Rejection on Sold-Out Lot:');
  const res8 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mandiToken}`
    },
    body: JSON.stringify({
      farmerId: farmer.id,
      cropName: 'Onion',
      quantityKg: 100,
      offeredRate: 28.50
    })
  });
  assert.strictEqual(res8.status, 409, 'Must reject booking on sold-out lot with 409 Conflict');
  const json8 = await res8.json();
  assert.strictEqual(json8.isSoldOut, true);
  console.log('  ✅ [PASS] New booking on sold-out lot rejected with 409 Conflict (isSoldOut: true)');

  // 7. Cancellation / Restoration: Cancel the second booking (400 kg) and verify quantity restoration
  console.log('\n7. Testing Booking Cancellation & Quantity Restoration:');
  const resCancel = await fetch(`${baseUrl}/api/auth/contact-requests/${booking2Id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${farmerToken}`
    },
    body: JSON.stringify({ status: 'cancelled' })
  });
  assert.strictEqual(resCancel.status, 200);

  // Verify availability after cancellation: available restores from 0 to 400 kg, isSoldOut becomes false
  const res9 = await fetch(`${baseUrl}/api/auth/farmers?district=Pune`, {
    headers: { 'Authorization': `Bearer ${mandiToken}` }
  });
  const json9 = await res9.json();
  const testFarmer9 = json9.data.find(f => f.id === farmer.id);
  const onionCrop9 = testFarmer9.crops.find(c => c.crop.toLowerCase() === 'onion');
  assert.strictEqual(onionCrop9.bookedKg, 600, 'Booked quantity restored to 600 kg');
  assert.strictEqual(onionCrop9.availableKg, 400, 'Available quantity restored to 400 kg');
  assert.strictEqual(onionCrop9.isSoldOut, false, 'isSoldOut restored to false');
  console.log('  ✅ [PASS] Cancelling booking restores 400 kg available stock; isSoldOut returns to false');

  console.log('\n================================================================');
  console.log('🎉 ALL 7 SOLD-OUT & AVAILABILITY LOGIC TESTS PASSED!');
  console.log('================================================================\n');

  server.close();
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
