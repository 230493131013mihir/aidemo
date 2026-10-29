const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { sequelize } = require('../config/database');
const { User, TransportRequest, Vehicle } = require('../models');

function apiRequest(port, method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
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
  console.log('🚚 Testing Driver Contact & Details in Farmer My Bookings');
  console.log('======================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    // 1. Setup Test Farmer
    let farmer = await User.findOne({ where: { email: 'farmer_booking_test@harvestmitra.local' } });
    if (!farmer) {
      farmer = await User.create({
        name: 'Rameshwar Patil',
        email: 'farmer_booking_test@harvestmitra.local',
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'farmer',
        phone: '9850119988'
      });
    }
    const farmerToken = makeToken(farmer);

    // 2. Setup Transporter User and Vehicle
    let transporter = await User.findOne({ where: { email: 'driver_test_transporter@harvestmitra.local' } });
    if (!transporter) {
      transporter = await User.create({
        name: 'Warule Logistics',
        email: 'driver_test_transporter@harvestmitra.local',
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'transporter',
        phone: '9876543210'
      });
    }

    let vehicle = await Vehicle.findOne({ where: { registrationNumber: 'MH-19-JH-4789' } });
    if (!vehicle) {
      vehicle = await Vehicle.create({
        userId: transporter.id,
        registrationNumber: 'MH-19-JH-4789',
        vehicleType: 'Mahindra Bolero Maxi Truck',
        capacityKg: 2500,
        driverName: 'Warule',
        driverPhone: '9876543210',
        ratePerKm: 28,
        isAvailable: true,
        status: 'available'
      });
    }

    // 3. Create Booking WITH assigned vehicle and driver
    const assignedBooking = await TransportRequest.create({
      userId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      cropName: 'Cotton',
      weightKg: 200,
      pickupLocation: 'Pune, Maharashtra',
      destinationMarket: 'Pune APMC',
      pickupDate: '2026-10-30',
      status: 'delivered',
      bookingId: 'BK-TEST-DRIVER-01',
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.registrationNumber,
      vehicleType: vehicle.vehicleType,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone
    });

    // 4. Create Booking WITHOUT assigned driver (pending)
    const unassignedBooking = await TransportRequest.create({
      userId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      cropName: 'Tomato',
      weightKg: 300,
      pickupLocation: 'Pune, Maharashtra',
      destinationMarket: 'Pune APMC',
      pickupDate: '2026-10-30',
      status: 'pending',
      bookingId: 'BK-TEST-UNASSIGNED-02',
      vehicleId: null,
      vehicleNumber: null,
      driverName: null,
      driverPhone: null
    });

    // 5. Test GET /api/transport/my-bookings
    console.log('--- TEST 1: Retrieve farmer bookings with enriched driver details ---');
    const res = await apiRequest(port, 'GET', '/api/transport/my-bookings', farmerToken);
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Expected 200 OK, got ${res.status}: ${JSON.stringify(res.body)}`);
    }

    const bookings = res.body.data;
    const testAssigned = bookings.find(b => b.bookingId === 'BK-TEST-DRIVER-01');
    const testUnassigned = bookings.find(b => b.bookingId === 'BK-TEST-UNASSIGNED-02');

    if (!testAssigned) throw new Error('Assigned booking BK-TEST-DRIVER-01 not found in my-bookings');
    if (!testUnassigned) throw new Error('Unassigned booking BK-TEST-UNASSIGNED-02 not found in my-bookings');

    console.log(`  ✅ [PASS] Found assigned booking: Driver="${testAssigned.driverName}", Phone="${testAssigned.driverPhone}", Vehicle="${testAssigned.vehicleNumber}", Model="${testAssigned.vehicleModel || testAssigned.vehicleType}"`);
    if (testAssigned.driverPhone !== '9876543210') {
      throw new Error(`Expected driverPhone 9876543210, got ${testAssigned.driverPhone}`);
    }
    if (testAssigned.driverName !== 'Warule') {
      throw new Error(`Expected driverName Warule, got ${testAssigned.driverName}`);
    }
    if (testAssigned.vehicleNumber !== 'MH-19-JH-4789') {
      throw new Error(`Expected vehicleNumber MH-19-JH-4789, got ${testAssigned.vehicleNumber}`);
    }

    console.log('\n--- TEST 2: Graceful handling when driver is not assigned ---');
    console.log(`  ✅ [PASS] Unassigned booking correctly has driverPhone=${testUnassigned.driverPhone}, driverName=${testUnassigned.driverName}`);
    if (testUnassigned.driverPhone !== null) {
      throw new Error('Unassigned booking must have null driverPhone');
    }

    // 6. Test Authorization Isolation: Another farmer cannot see these bookings
    console.log('\n--- TEST 3: Authorization & Privacy Isolation between farmers ---');
    let otherFarmer = await User.findOne({ where: { email: 'other_farmer_sec@harvestmitra.local' } });
    if (!otherFarmer) {
      otherFarmer = await User.create({
        name: 'Shivaji Rao',
        email: 'other_farmer_sec@harvestmitra.local',
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'farmer',
        phone: '9850998877'
      });
    }
    const otherToken = makeToken(otherFarmer);
    const otherRes = await apiRequest(port, 'GET', '/api/transport/my-bookings', otherToken);
    const leaked = (otherRes.body.data || []).find(b => b.bookingId === 'BK-TEST-DRIVER-01');
    if (leaked) {
      throw new Error('Privacy breach! Other farmer could see Rameshwar Patil\'s booking');
    }
    console.log('  ✅ [PASS] Confirmed: Another farmer cannot access booking or driver details of other farmers.');

    console.log('\n======================================================');
    console.log('🎉 ALL DRIVER CONTACT & MY BOOKINGS TESTS PASSED WITH 100% SUCCESS!');
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
