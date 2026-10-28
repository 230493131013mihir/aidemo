const http = require('http');
const path = require('path');
const assert = require('assert');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const app = require('../app');
const { User, FarmerProfile, MandiProfile, ContactRequest } = require('../models');

async function runTests() {
  console.log('\n======================================================');
  console.log('🏪 HarvestMitra AI — Dedicated APMC Mandi Procurement Tests');
  console.log('======================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const secret = process.env.JWT_SECRET || 'harvestmitra_secret';

  // 1. Create or retrieve test farmer
  let farmer = await User.findOne({ where: { email: 'test_mandi_procure_farmer@harvestmitra.test' } });
  if (!farmer) {
    farmer = await User.create({
      name: 'Ramesh Patel (Test)',
      email: 'test_mandi_procure_farmer@harvestmitra.test',
      phone: '9822000001',
      password: 'testpassword',
      role: 'farmer'
    });
    await FarmerProfile.create({
      userId: farmer.id,
      district: 'Pune',
      state: 'Maharashtra',
      village: 'Haveli',
      farmSizeAcres: 4.5,
      mainCrop: 'Cotton',
      currentHarvestKg: 500
    });
  } else {
    await ContactRequest.destroy({ where: { receiverId: farmer.id } });
  }

  // Clean up prior test requests for this isolated test farmer so test runs are idempotent
  await ContactRequest.destroy({ where: { receiverId: farmer.id } });

  // 2. Create or retrieve test mandi official
  let mandiUser = await User.findOne({ where: { email: 'test_mandi_official@harvestmitra.test' } });
  if (!mandiUser) {
    mandiUser = await User.create({
      name: 'Pune APMC Official',
      email: 'test_mandi_official@harvestmitra.test',
      phone: '9822000002',
      password: 'testpassword',
      role: 'mandi'
    });
    await MandiProfile.create({
      userId: mandiUser.id,
      mandiName: 'Pune APMC (Gultekdi)',
      licenseNumber: 'MH-APMC-PUN-2024-TEST',
      district: 'Pune',
      state: 'Maharashtra',
      operatingDays: 'Mon-Sat',
      facilities: 'Weighbridge, Cold Storage'
    });
  }

  const farmerToken = jwt.sign({ id: farmer.id, role: farmer.role, name: farmer.name }, secret, { expiresIn: '1h' });
  const mandiToken = jwt.sign({ id: mandiUser.id, role: mandiUser.role, name: mandiUser.name }, secret, { expiresIn: '1h' });

  // Test 1: Unauthenticated request to /api/auth/mandi-procurement-request is rejected with 401
  const res1 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ farmerId: farmer.id, cropName: 'Cotton', quantityKg: 250, offeredRate: 75.65 })
  });
  assert.strictEqual(res1.status, 401, 'Must reject unauthenticated procurement request with 401');
  console.log('  ✅ [PASS] 1. Unauthenticated procurement request rejected with 401');

  // Test 2: Farmer token is rejected with 403 Forbidden
  const res2 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${farmerToken}`
    },
    body: JSON.stringify({ farmerId: farmer.id, cropName: 'Cotton', quantityKg: 250, offeredRate: 75.65 })
  });
  assert.strictEqual(res2.status, 403, 'Must reject non-mandi role with 403');
  console.log('  ✅ [PASS] 2. Farmer role rejected with 403 Forbidden');

  // Test 3: Missing fields validation returns 400
  const res3 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mandiToken}`
    },
    body: JSON.stringify({ farmerId: farmer.id, cropName: 'Cotton' })
  });
  assert.strictEqual(res3.status, 400, 'Must validate missing quantityKg and offeredRate');
  console.log('  ✅ [PASS] 3. Missing fields correctly return 400 Bad Request');

  // Test 4: Mandi official successfully sends procurement request for 250 kg Cotton at ₹75.65/kg
  const res4 = await fetch(`${baseUrl}/api/auth/mandi-procurement-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mandiToken}`
    },
    body: JSON.stringify({
      farmerId: farmer.id,
      cropName: 'Cotton',
      quantityKg: 250,
      offeredRate: 75.65
    })
  });
  assert.strictEqual(res4.status, 201, 'Mandi procurement request must succeed with 201');
  const json4 = await res4.json();
  assert.strictEqual(json4.success, true);
  assert.ok(json4.alert?.message.includes('Pune APMC (Gultekdi)'), 'Alert message includes Mandi name');
  assert.ok(json4.alert?.message.includes('250 kg Cotton at ₹75.65/kg'), 'Alert message includes quantity and offered rate');
  console.log('  ✅ [PASS] 4. Mandi official issues procurement request: 250 kg Cotton at ₹75.65/kg (201 Created)');

  // Test 5: Farmer retrieves notification alert via GET /api/auth/contact-requests
  const res5 = await fetch(`${baseUrl}/api/auth/contact-requests`, {
    headers: {
      'Authorization': `Bearer ${farmerToken}`
    }
  });
  assert.strictEqual(res5.status, 200);
  const json5 = await res5.json();
  assert.strictEqual(json5.success, true);
  const matchingAlert = json5.data.find(r => r.receiverId === farmer.id && r.cropName === 'Cotton' && Number(r.quantityKg) === 250);
  assert.ok(matchingAlert, 'Farmer must receive the procurement booking inquiry alert');
  assert.strictEqual(matchingAlert.contactType, 'mandi_to_farmer');
  console.log('  ✅ [PASS] 5. Farmer views dispatched booking alert on dashboard');

  // Test 6: Mandi can fetch registered district farmers via GET /api/auth/farmers
  const res6 = await fetch(`${baseUrl}/api/auth/farmers?district=Pune`, {
    headers: {
      'Authorization': `Bearer ${mandiToken}`
    }
  });
  assert.strictEqual(res6.status, 200);
  const json6 = await res6.json();
  assert.strictEqual(json6.success, true);
  assert.ok(Array.isArray(json6.data), 'Farmers data is returned as array');
  console.log(`  ✅ [PASS] 6. Mandi fetched ${json6.data.length} registered district farmers`);

  console.log('\n======================================================');
  console.log('🎉 ALL 6 APMC MANDI PORTAL & PROCUREMENT TESTS PASSED!');
  console.log('======================================================\n');

  server.close();
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
