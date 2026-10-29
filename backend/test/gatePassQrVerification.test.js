const { sequelize } = require('../config/database');
const { User, TransportRequest, Vehicle, FarmerProfile } = require('../models');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const http = require('http');
const app = require('../app');

let serverPort = 5000;

function apiRequest(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request({
      hostname: '127.0.0.1',
      port: serverPort,
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function makeToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone
    },
    process.env.JWT_SECRET || 'harvestmitra_super_secret_jwt_token_key_2026_hackathon',
    { expiresIn: '7d' }
  );
}

async function runTests() {
  console.log('======================================================');
  console.log('📱 HarvestMitra AI — Real QR Code & Gate Pass Verification Tests');
  console.log('======================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  serverPort = server.address().port;

  try {
    // Find or create test farmer
    let testFarmer = await User.findOne({ where: { email: 'qr_test_farmer@harvestmitra.local' } });
  if (!testFarmer) {
    testFarmer = await User.create({
      name: 'Balasaheb Shinde',
      email: 'qr_test_farmer@harvestmitra.local',
      password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'farmer',
      phone: '9822998877',
      location: 'Dindori, Nashik'
    });
    await FarmerProfile.create({
      userId: testFarmer.id,
      village: 'Dindori',
      taluka: 'Dindori',
      district: 'Nashik',
      state: 'Maharashtra',
      mainCrop: 'Tomato, Onion'
    });
  }

  // Find or create test Mandi Official
  let mandiOfficial = await User.findOne({ where: { email: 'qr_test_mandi@harvestmitra.local' } });
  if (!mandiOfficial) {
    mandiOfficial = await User.create({
      name: 'Nashik APMC Gate Operator',
      email: 'qr_test_mandi@harvestmitra.local',
      password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'mandi',
      phone: '9822334455'
    });
  }

  const mandiToken = makeToken(mandiOfficial);

  // Clean up any old test gate passes
  await TransportRequest.destroy({
    where: {
      gatePassCode: [
        'MH-APMC-TEST-VALID-01',
        'MH-APMC-TEST-CANCEL-02',
        'MH-APMC-TEST-USED-03',
        'MH-APMC-TEST-EXPIRED-04'
      ]
    }
  });

  // 1. Create a VALID active gate pass in MySQL
  const validPass = await TransportRequest.create({
    userId: testFarmer.id,
    farmerName: 'Balasaheb Shinde',
    farmerPhone: '9822998877',
    cropName: 'Tomato',
    weightKg: 1800,
    quantityUnit: 'kg',
    pickupLocation: 'Dindori Farm Cluster, Nashik',
    destinationMarket: 'Nashik APMC Mandi',
    pickupDate: new Date().toISOString().slice(0, 10),
    vehicleNumber: 'MH-15-EG-4488',
    vehicleType: 'Mahindra Bolero Maxi Truck',
    status: 'driver_assigned',
    gatePassCode: 'MH-APMC-TEST-VALID-01',
    bookingId: 'TR-TEST-VALID-01'
  });

  // 2. Create a CANCELLED gate pass
  await TransportRequest.create({
    userId: testFarmer.id,
    farmerName: 'Balasaheb Shinde',
    farmerPhone: '9822998877',
    cropName: 'Onion',
    weightKg: 1200,
    pickupLocation: 'Dindori, Nashik',
    destinationMarket: 'Pune APMC',
    pickupDate: new Date().toISOString().slice(0, 10),
    status: 'cancelled',
    cancellationReason: 'Route blocked due to heavy rainfall',
    gatePassCode: 'MH-APMC-TEST-CANCEL-02',
    bookingId: 'TR-TEST-CANCEL-02'
  });

  // 3. Create a USED gate pass
  await TransportRequest.create({
    userId: testFarmer.id,
    farmerName: 'Balasaheb Shinde',
    farmerPhone: '9822998877',
    cropName: 'Pomegranate',
    weightKg: 800,
    pickupLocation: 'Dindori, Nashik',
    destinationMarket: 'Mumbai Vashi APMC',
    pickupDate: '2026-10-25',
    status: 'arrived_destination',
    actualDeliveryTime: new Date('2026-10-26T10:30:00Z'),
    gatePassCode: 'MH-APMC-TEST-USED-03',
    bookingId: 'TR-TEST-USED-03'
  });

  // 4. Create an EXPIRED gate pass (dated 10 days ago, not in transit)
  await TransportRequest.create({
    userId: testFarmer.id,
    farmerName: 'Balasaheb Shinde',
    farmerPhone: '9822998877',
    cropName: 'Grapes',
    weightKg: 500,
    pickupLocation: 'Dindori, Nashik',
    destinationMarket: 'Surat APMC',
    pickupDate: '2026-10-15',
    status: 'confirmed',
    gatePassCode: 'MH-APMC-TEST-EXPIRED-04',
    bookingId: 'TR-TEST-EXPIRED-04'
  });

  // TEST 1: QR Code Generation Quality & Specification
  console.log('--- TEST 1: Authentic QR Code Generation & HTTPS URL Specification ---');
  const expectedUrl = `https://aidemo-c4b9.onrender.com/verify-gate-pass/${validPass.gatePassCode}`;
  const qrDataUrl = await QRCode.toDataURL(expectedUrl, {
    errorCorrectionLevel: 'M',
    margin: 3,
    width: 320,
    color: { dark: '#000000', light: '#ffffff' }
  });
  if (!qrDataUrl.startsWith('data:image/png;base64,')) {
    throw new Error('QR Data URL did not generate a valid base64 PNG');
  }
  console.log('  ✅ [PASS] Authentic QR Code generated with standard ISO/IEC 18004 spec (Level M, quiet zone margin 3)');
  console.log(`  ✅ [PASS] QR Code encodes authoritative HTTPS verification URL: ${expectedUrl}`);

  // TEST 2: Public Mobile Camera Scan (Unauthenticated) on VALID Gate Pass
  console.log('\n--- TEST 2: Public Mobile Phone Scan (Unauthenticated) ---');
  const pubRes = await apiRequest('GET', `/api/transport/gatepass/verify/${validPass.gatePassCode}`, null);
  console.log(`  HTTP ${pubRes.status}, status: ${pubRes.body.status || pubRes.body.verificationStatus}`);
  if (pubRes.status !== 200 || pubRes.body.status !== 'VALID') {
    throw new Error('Public scan of valid pass did not return VALID status');
  }
  const pubData = pubRes.body.data;
  if (!pubData || pubData.passId !== validPass.gatePassCode) {
    throw new Error('Public scan payload missing passId or data object');
  }
  // Verify Farmer Privacy Protection (No phone number or full personal PII leaked to public scanner)
  if (pubRes.body.farmerPhone || pubData.farmerPhone) {
    throw new Error('SECURITY VIOLATION: Farmer phone number leaked to public scanner!');
  }
  if (!pubData.farmerMaskedName.includes('Balasaheb')) {
    throw new Error('Masked farmer name not generated properly');
  }
  console.log(`  ✅ [PASS] Status: VALID, Crop: ${pubData.cropName}, Weight: ${pubData.weightKg} kg, Destination: ${pubData.destinationMarket}`);
  console.log(`  ✅ [PASS] Privacy Protected: Full phone hidden, masked name returned: "${pubData.farmerMaskedName}"`);

  // TEST 3: Authorized Mandi Official Scan (Authenticated with JWT)
  console.log('\n--- TEST 3: Authorized APMC Mandi Official Scan (Authenticated) ---');
  const authRes = await apiRequest('GET', `/api/transport/gatepass/verify/${validPass.gatePassCode}`, mandiToken);
  console.log(`  HTTP ${authRes.status}, isAuthorized: ${authRes.body.isAuthorized}`);
  if (authRes.status !== 200 || !authRes.body.isAuthorized) {
    throw new Error('Mandi Official was not recognized as authorized operator');
  }
  const authData = authRes.body.data;
  if (authData.farmerPhone !== '9822998877' || authData.farmerName !== 'Balasaheb Shinde') {
    throw new Error('Authorized operator should receive full verified farmer details');
  }
  if (!authData.canCheckIn) {
    throw new Error('Mandi official must have canCheckIn permission for active valid pass');
  }
  console.log(`  ✅ [PASS] Full farmer name "${authData.farmerName}" and phone "${authData.farmerPhone}" unlocked for staff`);
  console.log('  ✅ [PASS] canCheckIn control flag enabled for Mandi Official');

  // TEST 4: Querying Non-Existent Gate Pass
  console.log('\n--- TEST 4: Non-Existent Gate Pass Record ---');
  const notFoundRes = await apiRequest('GET', '/api/transport/gatepass/verify/MH-APMC-NON-EXISTENT-999', null);
  console.log(`  HTTP ${notFoundRes.status}, message: "${notFoundRes.body.message}"`);
  if (notFoundRes.status !== 404 || notFoundRes.body.status !== 'INVALID') {
    throw new Error('Non-existent gate pass should return 404 with status INVALID');
  }
  console.log('  ✅ [PASS] Correctly rejected: "Gate pass not found or invalid." (Never falsely shows VALID)');

  // TEST 5: Cancelled Gate Pass Verification
  console.log('\n--- TEST 5: Cancelled Gate Pass Verification ---');
  const cancelRes = await apiRequest('GET', '/api/transport/gatepass/verify/MH-APMC-TEST-CANCEL-02', null);
  console.log(`  HTTP ${cancelRes.status}, status: ${cancelRes.body.status}`);
  if (cancelRes.body.status !== 'CANCELLED' || cancelRes.body.valid === true) {
    throw new Error('Cancelled gate pass should return status CANCELLED and valid=false');
  }
  console.log(`  ✅ [PASS] Cancelled status verified: "${cancelRes.body.message || cancelRes.body.data?.statusReason}"`);

  // TEST 6: Used / Arrived Gate Pass Verification
  console.log('\n--- TEST 6: Used / Completed Gate Pass Verification ---');
  const usedRes = await apiRequest('GET', '/api/transport/gatepass/verify/MH-APMC-TEST-USED-03', null);
  console.log(`  HTTP ${usedRes.status}, status: ${usedRes.body.status}`);
  if (usedRes.body.status !== 'USED') {
    throw new Error('Used gate pass should return status USED');
  }
  console.log('  ✅ [PASS] Correctly flagged as USED: "Gate pass has already been used. Consignment arrival..."');

  // TEST 7: Expired Gate Pass Verification
  console.log('\n--- TEST 7: Expired Gate Pass Verification ---');
  const expiredRes = await apiRequest('GET', '/api/transport/gatepass/verify/MH-APMC-TEST-EXPIRED-04', null);
  console.log(`  HTTP ${expiredRes.status}, status: ${expiredRes.body.status}`);
  if (expiredRes.body.status !== 'EXPIRED' || expiredRes.body.valid === true) {
    throw new Error('Expired gate pass should return status EXPIRED and valid=false');
  }
  console.log('  ✅ [PASS] Correctly flagged as EXPIRED (past transit window)');

  // TEST 8: Mandi Official Gate Arrival Check-in
  console.log('\n--- TEST 8: Authorized Mandi Gate Arrival Check-in (POST /api/transport/gatepass/checkin) ---');
  const checkinRes = await apiRequest('POST', '/api/transport/gatepass/checkin', mandiToken, {
    gatePassCode: validPass.gatePassCode,
    checkInNotes: 'Arrival verified via QR Scanner at Gate #2 weighbridge',
    arrivalWeightKg: 1800
  });
  console.log(`  HTTP ${checkinRes.status}, response: "${checkinRes.body.message}"`);
  if (checkinRes.status !== 200 || !checkinRes.body.success) {
    throw new Error('Failed to record gate arrival check-in');
  }

  // Re-verify: now the pass must show USED!
  const afterCheckinRes = await apiRequest('GET', `/api/transport/gatepass/verify/${validPass.gatePassCode}`, null);
  console.log(`  Post check-in status: ${afterCheckinRes.body.status}`);
  if (afterCheckinRes.body.status !== 'USED') {
    throw new Error('Gate pass status did not transition to USED after check-in');
  }
  console.log('  ✅ [PASS] Gate pass successfully transitioned from VALID -> USED upon confirmed arrival!');

  // TEST 9: Duplicate Check-in Prevention
  console.log('\n--- TEST 9: Duplicate Check-in Prevention ---');
  const dupCheckin = await apiRequest('POST', '/api/transport/gatepass/checkin', mandiToken, {
    gatePassCode: validPass.gatePassCode
  });
  console.log(`  HTTP ${dupCheckin.status}, message: "${dupCheckin.body.message}"`);
  if (dupCheckin.status !== 400) {
    throw new Error('Duplicate check-in should be rejected with HTTP 400');
  }
  console.log('  ✅ [PASS] Duplicate check-in safely rejected with 400 Bad Request');

  console.log('\n======================================================');
  console.log('🎉 ALL 9 QR SCANNING & GATE PASS VERIFICATION TESTS PASSED!');
  console.log('======================================================\n');
  } finally {
    server.close();
  }
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
