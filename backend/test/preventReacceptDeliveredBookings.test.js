const http = require('http');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
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
  console.log('🛡️ Testing Prevention of Reaccepting Delivered / Completed Bookings');
  console.log('======================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    // 1. Setup Test Transporter & Farmer
    let transporter = await User.findOne({ where: { email: 'prevent_reaccept_transporter@harvestmitra.local' } });
    if (!transporter) {
      transporter = await User.create({
        name: 'Kisan Cargo Transporter',
        email: 'prevent_reaccept_transporter@harvestmitra.local',
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'transporter',
        phone: '9822005544'
      });
    }
    const transporterToken = makeToken(transporter);

    let farmer = await User.findOne({ where: { email: 'prevent_reaccept_farmer@harvestmitra.local' } });
    if (!farmer) {
      farmer = await User.create({
        name: 'Ganesh Shinde',
        email: 'prevent_reaccept_farmer@harvestmitra.local',
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'farmer',
        phone: '9822003322'
      });
    }

    let vehicle = await Vehicle.findOne({ where: { registrationNumber: 'MH-14-TEST-9988' } });
    if (!vehicle) {
      vehicle = await Vehicle.create({
        userId: transporter.id,
        registrationNumber: 'MH-14-TEST-9988',
        vehicleType: 'Mahindra Bolero Maxi Truck',
        capacityKg: 2500,
        driverName: 'Ganesh Driver',
        driverPhone: '9822005544',
        ratePerKm: 25,
        isAvailable: true,
        status: 'available'
      });
    }

    // Clean up any test bookings from previous runs
    await TransportRequest.destroy({
      where: {
        bookingId: {
          [Op.like]: 'BK-TEST-%'
        }
      }
    });

    // 2. Setup Bookings in various non-actionable statuses
    const deliveredBooking = await TransportRequest.create({
      userId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      cropName: 'Cotton',
      weightKg: 200,
      pickupLocation: 'Pune, Maharashtra',
      destinationMarket: 'Pune APMC',
      pickupDate: '2026-10-27',
      status: 'delivered',
      bookingId: 'BK-TEST-DELIVERED-01'
    });

    const completedBooking = await TransportRequest.create({
      userId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      cropName: 'Cotton',
      weightKg: 200,
      pickupLocation: 'Pune, Maharashtra',
      destinationMarket: 'Pune APMC',
      pickupDate: '2026-10-27',
      status: 'completed',
      bookingId: 'BK-TEST-COMPLETED-02'
    });

    const cancelledBooking = await TransportRequest.create({
      userId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      cropName: 'Tomato',
      weightKg: 300,
      pickupLocation: 'Pune, Maharashtra',
      destinationMarket: 'Pune APMC',
      pickupDate: '2026-10-27',
      status: 'cancelled',
      bookingId: 'BK-TEST-CANCELLED-03'
    });

    const rejectedBooking = await TransportRequest.create({
      userId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      cropName: 'Tomato',
      weightKg: 300,
      pickupLocation: 'Pune, Maharashtra',
      destinationMarket: 'Pune APMC',
      pickupDate: '2026-10-27',
      status: 'rejected',
      bookingId: 'BK-TEST-REJECTED-04'
    });

    const pendingBooking = await TransportRequest.create({
      userId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      cropName: 'Wheat',
      weightKg: 500,
      pickupLocation: 'Pune, Maharashtra',
      destinationMarket: 'Pune APMC',
      pickupDate: '2026-10-31',
      status: 'pending',
      bookingId: 'BK-TEST-PENDING-05'
    });

    // TEST 1: Reaccepting DELIVERED booking must be rejected
    console.log('--- TEST 1: Attempt to accept DELIVERED booking ---');
    const acceptDeliveredRes = await apiRequest(port, 'PUT', `/api/transport/bookings/${deliveredBooking.id}/accept`, transporterToken, {
      vehicleId: vehicle.id
    });
    console.log(`  HTTP ${acceptDeliveredRes.status}: "${acceptDeliveredRes.body.message}"`);
    if (acceptDeliveredRes.status !== 400 && acceptDeliveredRes.status !== 409) {
      throw new Error(`Expected 400/409, got ${acceptDeliveredRes.status}`);
    }
    if (!acceptDeliveredRes.body.message.includes('already been delivered')) {
      throw new Error(`Expected error message to mention 'already been delivered', got: ${acceptDeliveredRes.body.message}`);
    }
    console.log('  ✅ [PASS] Reaccepting delivered booking safely blocked.');

    // TEST 2: Rejecting DELIVERED booking must be rejected
    console.log('\n--- TEST 2: Attempt to reject DELIVERED booking ---');
    const rejectDeliveredRes = await apiRequest(port, 'PUT', `/api/transport/bookings/${deliveredBooking.id}/reject`, transporterToken, {
      reason: 'Should fail'
    });
    console.log(`  HTTP ${rejectDeliveredRes.status}: "${rejectDeliveredRes.body.message}"`);
    if (rejectDeliveredRes.status !== 400 && rejectDeliveredRes.status !== 409) {
      throw new Error(`Expected 400/409, got ${rejectDeliveredRes.status}`);
    }
    if (!rejectDeliveredRes.body.message.includes('already been delivered')) {
      throw new Error(`Expected message to mention 'already been delivered', got: ${rejectDeliveredRes.body.message}`);
    }
    console.log('  ✅ [PASS] Rejecting delivered booking safely blocked.');

    // TEST 3: Reaccepting COMPLETED booking must be rejected
    console.log('\n--- TEST 3: Attempt to accept COMPLETED booking ---');
    const acceptCompletedRes = await apiRequest(port, 'PUT', `/api/transport/bookings/${completedBooking.id}/accept`, transporterToken, {
      vehicleId: vehicle.id
    });
    console.log(`  HTTP ${acceptCompletedRes.status}: "${acceptCompletedRes.body.message}"`);
    if (acceptCompletedRes.status !== 400 && acceptCompletedRes.status !== 409) {
      throw new Error(`Expected 400/409, got ${acceptCompletedRes.status}`);
    }
    if (!acceptCompletedRes.body.message.includes('already been completed')) {
      throw new Error(`Expected message to mention 'already been completed', got: ${acceptCompletedRes.body.message}`);
    }
    console.log('  ✅ [PASS] Reaccepting completed booking safely blocked.');

    // TEST 4: Reaccepting CANCELLED booking must be rejected
    console.log('\n--- TEST 4: Attempt to accept CANCELLED booking ---');
    const acceptCancelledRes = await apiRequest(port, 'PUT', `/api/transport/bookings/${cancelledBooking.id}/accept`, transporterToken, {
      vehicleId: vehicle.id
    });
    console.log(`  HTTP ${acceptCancelledRes.status}: "${acceptCancelledRes.body.message}"`);
    if (acceptCancelledRes.status !== 400 && acceptCancelledRes.status !== 409) {
      throw new Error(`Expected 400/409, got ${acceptCancelledRes.status}`);
    }
    if (!acceptCancelledRes.body.message.includes('already been cancelled')) {
      throw new Error(`Expected message to mention 'already been cancelled', got: ${acceptCancelledRes.body.message}`);
    }
    console.log('  ✅ [PASS] Reaccepting cancelled booking safely blocked.');

    // TEST 5: Reaccepting REJECTED booking must be rejected
    console.log('\n--- TEST 5: Attempt to accept REJECTED booking ---');
    const acceptRejectedRes = await apiRequest(port, 'PUT', `/api/transport/bookings/${rejectedBooking.id}/accept`, transporterToken, {
      vehicleId: vehicle.id
    });
    console.log(`  HTTP ${acceptRejectedRes.status}: "${acceptRejectedRes.body.message}"`);
    if (acceptRejectedRes.status !== 400 && acceptRejectedRes.status !== 409) {
      throw new Error(`Expected 400/409, got ${acceptRejectedRes.status}`);
    }
    if (!acceptRejectedRes.body.message.includes('already been rejected')) {
      throw new Error(`Expected message to mention 'already been rejected', got: ${acceptRejectedRes.body.message}`);
    }
    console.log('  ✅ [PASS] Reaccepting rejected booking safely blocked.');

    // TEST 6: Accepting valid PENDING booking works normally
    console.log('\n--- TEST 6: Accept valid PENDING booking ---');
    const acceptPendingRes = await apiRequest(port, 'PUT', `/api/transport/bookings/${pendingBooking.id}/accept`, transporterToken, {
      vehicleId: vehicle.id
    });
    console.log(`  HTTP ${acceptPendingRes.status}: "${acceptPendingRes.body.message}"`);
    if (acceptPendingRes.status !== 200 || !acceptPendingRes.body.success) {
      throw new Error(`Expected 200 OK, got ${acceptPendingRes.status}: ${JSON.stringify(acceptPendingRes.body)}`);
    }
    await pendingBooking.reload();
    console.log(`  ✅ [PASS] Pending booking accepted, status transitioned to: ${pendingBooking.status}`);

    // TEST 7: Attempting to accept the ALREADY ACCEPTED booking again
    console.log('\n--- TEST 7: Attempt to accept the ALREADY ACCEPTED booking again ---');
    const reacceptRes = await apiRequest(port, 'PUT', `/api/transport/bookings/${pendingBooking.id}/accept`, transporterToken, {
      vehicleId: vehicle.id
    });
    console.log(`  HTTP ${reacceptRes.status}: "${reacceptRes.body.message}"`);
    if (reacceptRes.status !== 400 && reacceptRes.status !== 409) {
      throw new Error(`Expected 400/409, got ${reacceptRes.status}`);
    }
    if (!reacceptRes.body.message.includes('already been accepted') && !reacceptRes.body.message.includes('Finish your active trip') && !reacceptRes.body.message.includes('Already taken or no longer open')) {
      throw new Error(`Unexpected message: ${reacceptRes.body.message}`);
    }
    console.log('  ✅ [PASS] Double-acceptance safely rejected.');

    console.log('\n======================================================');
    console.log('🎉 ALL 7 REACCEPTANCE & STATUS GUARD TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');
  } finally {
    await TransportRequest.destroy({
      where: {
        bookingId: {
          [Op.like]: 'BK-TEST-%'
        }
      }
    }).catch(() => {});
    server.close();
  }
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
