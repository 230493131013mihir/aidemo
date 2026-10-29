const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');
const { User, TransportRequest, Vehicle, SharedTrip } = require('../models');

function apiRequest(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
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

async function runScheduledDepartureWorkflowTests() {
  console.log('================================================================');
  console.log('🚚 HarvestMitra AI — Scheduled Departure Workflow Integration Tests');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function record(testName, condition, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  try {
    // 1. Setup test users and vehicle
    let transporter = await User.findOne({ where: { email: 'dep_transporter@harvestmitra.local' } });
    if (!transporter) {
      transporter = await User.create({
        name: 'Departure Test Transporter',
        email: 'dep_transporter@harvestmitra.local',
        phone: '9888877771',
        role: 'transporter',
        password: 'password123',
        state: 'Maharashtra',
        district: 'Pune'
      });
    }
    const transporterToken = makeToken(transporter);

    let otherTransporter = await User.findOne({ where: { email: 'dep_other_transporter@harvestmitra.local' } });
    if (!otherTransporter) {
      otherTransporter = await User.create({
        name: 'Other Transporter',
        email: 'dep_other_transporter@harvestmitra.local',
        phone: '9888877772',
        role: 'transporter',
        password: 'password123',
        state: 'Maharashtra',
        district: 'Pune'
      });
    }
    const otherTransporterToken = makeToken(otherTransporter);

    let farmer1 = await User.findOne({ where: { email: 'dep_farmer1@harvestmitra.local' } });
    if (!farmer1) {
      farmer1 = await User.create({
        name: 'Departure Farmer 1',
        email: 'dep_farmer1@harvestmitra.local',
        phone: '9888877773',
        role: 'farmer',
        password: 'password123',
        state: 'Maharashtra',
        district: 'Nashik'
      });
    }
    const farmer1Token = makeToken(farmer1);

    let farmer2 = await User.findOne({ where: { email: 'dep_farmer2@harvestmitra.local' } });
    if (!farmer2) {
      farmer2 = await User.create({
        name: 'Departure Farmer 2',
        email: 'dep_farmer2@harvestmitra.local',
        phone: '9888877774',
        role: 'farmer',
        password: 'password123',
        state: 'Maharashtra',
        district: 'Nashik'
      });
    }

    let vehicle = await Vehicle.findOne({ where: { registrationNumber: 'MH-15-DEP-9999' } });
    if (!vehicle) {
      vehicle = await Vehicle.create({
        userId: transporter.id,
        transporterId: transporter.id,
        vehicleType: 'Eicher 14ft Closed Container',
        registrationNumber: 'MH-15-DEP-9999',
        capacityKg: 3000,
        ratePerKm: 28,
        status: 'available',
        isAvailable: true,
        driverName: 'Ramesh Shinde',
        driverPhone: '9888877775'
      });
    }

    // TEST A: Trip with no schedule returns scheduledDepartureTime: null
    console.log('--- Test A: Unscheduled Trip Behavior ---');
    const unscheduledBooking = await TransportRequest.create({
      userId: farmer1.id,
      farmerName: 'Farmer One',
      farmerPhone: '9888877773',
      transporterId: transporter.id,
      vehicleId: vehicle.id,
      bookingId: `BK-UNSCHED-${Date.now()}`,
      cropName: 'Tomato',
      cropCategory: 'vegetable',
      weightKg: 600,
      pickupLocation: 'Pimpalgaon Yard, Nashik',
      destinationMarket: 'Pune APMC Market Yard',
      pickupDate: '2026-11-05',
      status: 'confirmed',
      gatePassCode: `MH-APMC-UNSCHED-${Date.now()}`
    });

    const getBookingsRes = await apiRequest('GET', '/api/transport/my-bookings', transporterToken);
    const foundUnscheduled = getBookingsRes.body?.data?.find(b => b.id === unscheduledBooking.id);
    record(
      'Test A: Unscheduled trip has null scheduledDepartureTime',
      foundUnscheduled && foundUnscheduled.scheduledDepartureTime === null,
      JSON.stringify(foundUnscheduled?.scheduledDepartureTime)
    );

    // TEST B & C: Authorized transporter sets departure schedule persistently
    console.log('\n--- Test B & C: Transporter Sets Departure Schedule ---');
    const scheduledTimeISO = '2026-11-05T08:30:00.000Z';
    const scheduleRes = await apiRequest(
      'PUT',
      `/api/transport/bookings/${unscheduledBooking.id}/schedule-departure`,
      transporterToken,
      {
        scheduledDepartureTime: scheduledTimeISO,
        notes: 'Departing early morning after fruit loading'
      }
    );

    record(
      'Test B: Setting schedule returns 200 and success',
      scheduleRes.status === 200 && scheduleRes.body?.success === true,
      JSON.stringify(scheduleRes.body)
    );

    const refreshedBookingsRes = await apiRequest('GET', '/api/transport/my-bookings', transporterToken);
    const foundScheduled = refreshedBookingsRes.body?.data?.find(b => b.id === unscheduledBooking.id);
    record(
      'Test C: Scheduled departure time persists in database and is returned in my-bookings',
      foundScheduled && new Date(foundScheduled.scheduledDepartureTime).toISOString() === scheduledTimeISO,
      `Got: ${foundScheduled?.scheduledDepartureTime}`
    );

    // TEST D: Pickup date is distinct and not overwritten by departure date
    console.log('\n--- Test D: Field Distinction (Pickup Date vs Departure Schedule) ---');
    record(
      'Test D: Pickup date remains preserved as 2026-11-05 and distinct from departure timestamp',
      foundScheduled && foundScheduled.pickupDate === '2026-11-05' && foundScheduled.scheduledDepartureTime !== null,
      `pickupDate=${foundScheduled?.pickupDate}, scheduledDepartureTime=${foundScheduled?.scheduledDepartureTime}`
    );

    // TEST F: Unauthorized schedule changes and invalid statuses are rejected
    console.log('\n--- Test F: Security and Validation Controls ---');
    const unauthorizedRes = await apiRequest(
      'PUT',
      `/api/transport/bookings/${unscheduledBooking.id}/schedule-departure`,
      otherTransporterToken,
      { scheduledDepartureTime: '2026-11-05T12:00:00.000Z' }
    );
    record(
      'Test F1: Unauthorized transporter schedule change rejected with 403',
      unauthorizedRes.status === 403,
      `Status=${unauthorizedRes.status}`
    );

    const invalidDateRes = await apiRequest(
      'PUT',
      `/api/transport/bookings/${unscheduledBooking.id}/schedule-departure`,
      transporterToken,
      { scheduledDepartureTime: 'not-a-valid-date-time' }
    );
    record(
      'Test F2: Invalid date/time string rejected with 400',
      invalidDateRes.status === 400,
      `Status=${invalidDateRes.status}`
    );

    // TEST E: Starting transit records actual departure timestamp separately from scheduled departure
    console.log('\n--- Test E: Transit Departure Records Actual Timestamp ---');
    // Progress booking to in_transit
    const progressRes = await apiRequest(
      'PUT',
      `/api/transport/bookings/${unscheduledBooking.id}/status`,
      transporterToken,
      { status: 'in_transit' }
    );

    record(
      'Test E1: Status progresses to in_transit',
      progressRes.status === 200 && progressRes.body?.data?.status === 'in_transit',
      `Status: ${progressRes.status}, data.status: ${progressRes.body?.data?.status}`
    );

    const inTransitBookingRes = await apiRequest('GET', '/api/transport/my-bookings', transporterToken);
    const inTransitBooking = inTransitBookingRes.body?.data?.find(b => b.id === unscheduledBooking.id);
    record(
      'Test E2: actualDepartureTime is recorded and distinct from scheduledDepartureTime',
      inTransitBooking && inTransitBooking.actualDepartureTime !== null && inTransitBooking.scheduledDepartureTime !== null,
      `actualDepartureTime=${inTransitBooking?.actualDepartureTime}, scheduledDepartureTime=${inTransitBooking?.scheduledDepartureTime}`
    );

    // Verify departed trip rejects modifying schedule
    const scheduleAfterDepartRes = await apiRequest(
      'PUT',
      `/api/transport/bookings/${unscheduledBooking.id}/schedule-departure`,
      transporterToken,
      { scheduledDepartureTime: '2026-11-06T10:00:00.000Z' }
    );
    record(
      'Test E3: Departed trip rejects schedule modification with 400',
      scheduleAfterDepartRes.status === 400,
      `Status: ${scheduleAfterDepartRes.status}`
    );

    // TEST G: Shared Transport authoritative departure synchronization across multiple farmers
    console.log('\n--- Test G: Shared Transport Multi-Farmer Synchronization ---');
    const sharedTripCode = `TRIP-SYNC-${Date.now()}`;
    const sharedTrip = await SharedTrip.create({
      tripCode: sharedTripCode,
      transporterId: transporter.id,
      vehicleId: vehicle.id,
      pickupLocation: 'Lasalgaon Mandi, Nashik',
      destinationMarket: 'Mumbai Vashi APMC Terminal',
      tripDate: '2026-11-10',
      totalCapacityKg: 3000,
      bookedWeightKg: 1800,
      remainingCapacityKg: 1200,
      status: 'confirmed'
    });

    const sharedBooking1 = await TransportRequest.create({
      userId: farmer1.id,
      farmerName: 'Farmer One',
      farmerPhone: '9888877773',
      transporterId: transporter.id,
      vehicleId: vehicle.id,
      sharedTripId: sharedTrip.id,
      bookingId: `BK-SHARED1-${Date.now()}`,
      cropName: 'Onion',
      cropCategory: 'vegetable',
      weightKg: 1000,
      pickupLocation: 'Lasalgaon Mandi, Nashik',
      destinationMarket: 'Mumbai Vashi APMC Terminal',
      pickupDate: '2026-11-10',
      status: 'confirmed',
      bookingType: 'shared',
      gatePassCode: `MH-APMC-SH1-${Date.now()}`
    });

    const sharedBooking2 = await TransportRequest.create({
      userId: farmer2.id,
      farmerName: 'Farmer Two',
      farmerPhone: '9888877774',
      transporterId: transporter.id,
      vehicleId: vehicle.id,
      sharedTripId: sharedTrip.id,
      bookingId: `BK-SHARED2-${Date.now()}`,
      cropName: 'Potato',
      cropCategory: 'vegetable',
      weightKg: 800,
      pickupLocation: 'Lasalgaon Mandi, Nashik',
      destinationMarket: 'Mumbai Vashi APMC Terminal',
      pickupDate: '2026-11-10',
      status: 'confirmed',
      bookingType: 'shared',
      gatePassCode: `MH-APMC-SH2-${Date.now()}`
    });

    const sharedScheduleTime = '2026-11-10T06:00:00.000Z';
    // Set schedule on sharedBooking1
    const syncScheduleRes = await apiRequest(
      'PUT',
      `/api/transport/bookings/${sharedBooking1.id}/schedule-departure`,
      transporterToken,
      { scheduledDepartureTime: sharedScheduleTime }
    );

    record(
      'Test G1: Setting schedule on booking 1 returns 200',
      syncScheduleRes.status === 200,
      `Status=${syncScheduleRes.status}`
    );

    // Refresh shared trip and sibling booking 2 from database
    await sharedTrip.reload();
    await sharedBooking2.reload();

    record(
      'Test G2: Parent SharedTrip receives authoritative schedule',
      sharedTrip.scheduledDepartureTime && new Date(sharedTrip.scheduledDepartureTime).toISOString() === sharedScheduleTime,
      `sharedTrip.scheduledDepartureTime=${sharedTrip.scheduledDepartureTime}`
    );

    record(
      'Test G3: Sibling farmer booking 2 automatically receives the synchronized schedule',
      sharedBooking2.scheduledDepartureTime && new Date(sharedBooking2.scheduledDepartureTime).toISOString() === sharedScheduleTime,
      `sharedBooking2.scheduledDepartureTime=${sharedBooking2.scheduledDepartureTime}`
    );

    // TEST H & I: Existing trips remain readable and data is preserved
    console.log('\n--- Test H & I: Existing Trips and System Invariants ---');
    const existingBookings = await TransportRequest.findAll({ limit: 10 });
    record(
      'Test H: Existing bookings in database remain readable without errors',
      existingBookings.length > 0,
      `Found ${existingBookings.length} bookings`
    );

    const vehicleCapacity = await Vehicle.findByPk(vehicle.id);
    record(
      'Test I: Vehicle capacity specifications remain intact (3000 kg)',
      vehicleCapacity && vehicleCapacity.capacityKg === 3000,
      `capacityKg=${vehicleCapacity?.capacityKg}`
    );

    console.log('\n================================================================');
    console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runScheduledDepartureWorkflowTests();
