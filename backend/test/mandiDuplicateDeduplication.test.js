const http = require('http');
const path = require('path');
const assert = require('assert');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const app = require('../app');
const { User, FarmerProfile, MandiProfile, ContactRequest } = require('../models');

async function runTests() {
  console.log('\n======================================================================');
  console.log('🛡️ HarvestMitra AI — Mandi Procurement Deduplication & Idempotency Tests');
  console.log('======================================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const secret = process.env.JWT_SECRET || 'harvestmitra_secret';

  // 1. Setup isolated test farmer with 1000 kg Wheat
  let farmer = await User.findOne({ where: { email: 'test_dedup_farmer@harvestmitra.test' } });
  if (!farmer) {
    farmer = await User.create({
      name: 'Dedup Test Farmer',
      email: 'test_dedup_farmer@harvestmitra.test',
      phone: '9822008881',
      password: 'testpassword',
      role: 'farmer'
    });
    await FarmerProfile.create({
      userId: farmer.id,
      district: 'Pune',
      state: 'Maharashtra',
      village: 'Haveli',
      farmSizeAcres: 5.0,
      mainCrop: 'Wheat',
      currentHarvestKg: 1000,
      productQuantities: JSON.stringify({ Wheat: 1000 })
    });
  } else {
    const fp = await FarmerProfile.findOne({ where: { userId: farmer.id } });
    await fp.update({
      currentHarvestKg: 1000,
      productQuantities: JSON.stringify({ Wheat: 1000 })
    });
    await ContactRequest.destroy({ where: { receiverId: farmer.id } });
  }

  // 2. Setup isolated test mandi official
  let mandiUser = await User.findOne({ where: { email: 'test_dedup_mandi@harvestmitra.test' } });
  if (!mandiUser) {
    mandiUser = await User.create({
      name: 'Pune APMC Dedup Mandi',
      email: 'test_dedup_mandi@harvestmitra.test',
      phone: '9822008882',
      password: 'testpassword',
      role: 'mandi'
    });
    await MandiProfile.create({
      userId: mandiUser.id,
      mandiName: 'Pune APMC Market Yard Dedup',
      licenseNumber: 'MH-APMC-PUN-DEDUP-2026',
      district: 'Pune',
      state: 'Maharashtra',
      operatingDays: 'Mon-Sat',
      facilities: 'Weighbridge'
    });
  }

  const farmerToken = jwt.sign({ id: farmer.id, role: farmer.role, name: farmer.name }, secret, { expiresIn: '1h' });
  const mandiToken = jwt.sign({ id: mandiUser.id, role: mandiUser.role, name: mandiUser.name }, secret, { expiresIn: '1h' });

  // TEST 1: Initial Submission Creates Exactly One Procurement Request
  console.log('1. Testing Initial Single Submission:');
  const idempotencyKey1 = `test_key_${Date.now()}_1`;
  const res1 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mandiToken}`,
      'Idempotency-Key': idempotencyKey1
    },
    body: JSON.stringify({
      farmerId: farmer.id,
      cropName: 'Wheat',
      quantityKg: 400,
      offeredRate: 25.50,
      idempotencyKey: idempotencyKey1
    })
  });
  assert.strictEqual(res1.status, 201, 'First submission must succeed with 201 Created');
  const json1 = await res1.json();
  assert.strictEqual(json1.success, true);
  const booking1Id = json1.data.id;
  assert.ok(booking1Id, 'Must return persisted booking ID');
  console.log(`  ✅ [PASS] Created Booking #${booking1Id} for 400 kg Wheat (201 Created)`);

  // Count records in DB for this farmer
  const countAfter1 = await ContactRequest.count({ where: { receiverId: farmer.id, cropName: 'Wheat' } });
  assert.strictEqual(countAfter1, 1, 'Exactly one record must exist in database');
  console.log('  ✅ [PASS] Database contains exactly 1 record after first submission');

  // TEST 2: Repeating the Request With the Same Idempotency Key Does NOT Create a Duplicate
  console.log('\n2. Testing Idempotency Protection (Same Idempotency-Key):');
  const res2 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mandiToken}`,
      'Idempotency-Key': idempotencyKey1
    },
    body: JSON.stringify({
      farmerId: farmer.id,
      cropName: 'Wheat',
      quantityKg: 400,
      offeredRate: 25.50,
      idempotencyKey: idempotencyKey1
    })
  });
  assert.ok(res2.status === 200 || res2.status === 201, 'Idempotent request must return cached response');
  const json2 = await res2.json();
  assert.strictEqual(json2.data.id, booking1Id, 'Must return the same booking ID as original request');

  const countAfter2 = await ContactRequest.count({ where: { receiverId: farmer.id, cropName: 'Wheat' } });
  assert.strictEqual(countAfter2, 1, 'Database must still contain exactly 1 record');
  console.log('  ✅ [PASS] Repeated request with same idempotency key returned existing booking without duplicating');

  // TEST 3: Rapid Double-Click / Resubmission Protection (Different Key, but within 60s window & pending)
  console.log('\n3. Testing Anti-Double-Click & Pending Guard:');
  const idempotencyKey2 = `test_key_${Date.now()}_different`;
  const res3 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mandiToken}`,
      'Idempotency-Key': idempotencyKey2
    },
    body: JSON.stringify({
      farmerId: farmer.id,
      cropName: 'Wheat',
      quantityKg: 400,
      offeredRate: 25.50,
      idempotencyKey: idempotencyKey2
    })
  });
  assert.strictEqual(res3.status, 200, 'Duplicate submission must return 200 with existing record');
  const json3 = await res3.json();
  assert.strictEqual(json3.isExisting, true, 'Response must flag isExisting: true');
  assert.strictEqual(json3.data.id, booking1Id, 'Must reference the existing booking');

  const countAfter3 = await ContactRequest.count({ where: { receiverId: farmer.id, cropName: 'Wheat' } });
  assert.strictEqual(countAfter3, 1, 'Database must STILL contain exactly 1 record');
  console.log('  ✅ [PASS] Rapid resubmission intercepted: returned existing request, 0 duplicate rows created');

  // TEST 4: Farmer Confirmation Updates Existing Record (Does Not Create Another Row)
  console.log('\n4. Testing Farmer Confirmation Status Transition:');
  const resAccept = await fetch(`${baseUrl}/api/auth/contact-requests/${booking1Id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${farmerToken}`
    },
    body: JSON.stringify({ status: 'accepted' })
  });
  assert.strictEqual(resAccept.status, 200, 'Farmer accepting request must succeed with 200');
  const jsonAccept = await resAccept.json();
  assert.strictEqual(jsonAccept.data.status, 'accepted', 'Booking status must transition to accepted');
  assert.strictEqual(jsonAccept.data.id, booking1Id, 'Booking ID must remain unchanged');

  const countAfterAccept = await ContactRequest.count({ where: { receiverId: farmer.id, cropName: 'Wheat' } });
  assert.strictEqual(countAfterAccept, 1, 'Database count must remain strictly 1 after confirmation');
  console.log(`  ✅ [PASS] Farmer confirmed Booking #${booking1Id}; no new record was created (count = 1)`);

  // TEST 5: Mandi Dashboard Queries Return Distinct Bookings
  console.log('\n5. Testing Mandi Dashboard Query Distinctness:');
  const resBookings = await fetch(`${baseUrl}/api/auth/contact-requests`, {
    headers: { 'Authorization': `Bearer ${mandiToken}` }
  });
  assert.strictEqual(resBookings.status, 200);
  const jsonBookings = await resBookings.json();
  const mandiWheatBookings = jsonBookings.data.filter(
    r => r.senderId === mandiUser.id && r.cropName === 'Wheat'
  );
  assert.strictEqual(mandiWheatBookings.length, 1, 'Mandi dashboard query must return exactly 1 booking');
  assert.strictEqual(mandiWheatBookings[0].id, booking1Id);
  assert.strictEqual(mandiWheatBookings[0].status, 'accepted');
  console.log('  ✅ [PASS] Mandi dashboard contact-requests endpoint returns exactly 1 distinct booking');

  // TEST 6: Availability Reflection & Competing Over-Booking Prevention
  console.log('\n6. Testing Remaining Crop Availability (1000 - 400 = 600 kg):');
  const resFarmers = await fetch(`${baseUrl}/api/auth/farmers?district=Pune`, {
    headers: { 'Authorization': `Bearer ${mandiToken}` }
  });
  const jsonFarmers = await resFarmers.json();
  const testFarmerRecord = jsonFarmers.data.find(f => f.id === farmer.id);
  const wheatCrop = testFarmerRecord.crops.find(c => c.crop.toLowerCase() === 'wheat');
  assert.strictEqual(wheatCrop.originalQty, 1000);
  assert.strictEqual(wheatCrop.bookedKg, 400, 'Booked quantity must be 400 kg');
  assert.strictEqual(wheatCrop.availableKg, 600, 'Available quantity must be 600 kg');
  assert.strictEqual(wheatCrop.isPartiallyBooked, true);
  console.log('  ✅ [PASS] Farmer availability correctly updated: 600 kg available, 400 kg booked');

  // Attempting to book 700 kg (> 600 kg remaining) must fail
  const resOver = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mandiToken}`
    },
    body: JSON.stringify({
      farmerId: farmer.id,
      cropName: 'Wheat',
      quantityKg: 700,
      offeredRate: 25.50
    })
  });
  assert.strictEqual(resOver.status, 400, 'Over-booking against remaining stock must return 400');
  console.log('  ✅ [PASS] Request exceeding remaining 600 kg rejected with 400 Bad Request');

  console.log('\n======================================================================');
  console.log('🎉 ALL 6 DEDUPLICATION & IDEMPOTENCY INTEGRATION TESTS PASSED!');
  console.log('======================================================================\n');

  server.close();
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
