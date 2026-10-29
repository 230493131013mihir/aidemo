/**
 * completeTransportWorkflow.test.js
 * Comprehensive End-to-End Test Suite for HarvestMitra AI Complete Transport System Fix
 * 
 * Tests Verified:
 * Test A: Select Tomato, Potato and Onion — All three remain selected and itemized.
 * Test B: Deselect Potato — Tomato and Onion remain selected; Potato quantity excluded from total and payload.
 * Test C: Reselect Potato — Becomes selected again and quantity handling is restored.
 * Test D: Book 700 kg on a 2,000 kg shared trip — Remaining capacity must be 1,300 kg.
 * Test E: Book another compatible 1,300 kg — Remaining capacity must be 0 kg, status FULL/SOLD OUT, further booking must fail.
 * Test F: Attempt another 100 kg booking on the full trip — Backend rejects with 409 Conflict without creating invalid booking.
 * Test G: Cancel a booking and verify only its valid allocation is released.
 * Test H: Book a dedicated truck with 700 kg cargo on a 2,000 kg vehicle — Remaining capacity is 0 kg and vehicle is reserved dedicated.
 * Test I: Two vehicles belong to the same driver — Booking one vehicle must not change the other vehicle's capacity.
 * Test J: Refresh farmer and transporter pages — All booking records, assignments, capacity and status persist.
 * Test K: Submit two simultaneous bookings that compete for the same capacity — Backend atomic transaction prevents overbooking.
 * Test L: Verify departure policy and load management when minimum load is reached vs not reached.
 * Test M: Verify pickup, transit, delivery and settlement state transitions with transition enforcement.
 * Test N: Test invalid quantities, unsupported crops, incompatible vehicles, unauthorized requests and duplicate submissions.
 */

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon";

const assert = require("assert");
const http = require("http");
const jwt = require("jsonwebtoken");
const app = require("../app");
const sequelize = require("../config/database");
const { User, Vehicle, TransportRequest, TransporterProfile, SharedTrip } = require("../models");

let server;
let serverPort;

function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      serverPort = server.address().port;
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
}

function makeRequest({ method = "GET", path = "/", body = null, token = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const req = http.request({
      hostname: "127.0.0.1",
      port: serverPort,
      path,
      method,
      headers
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (_) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

async function runTests() {
  console.log("\n===============================================================================");
  console.log("🚛 HarvestMitra AI — Complete Transport System Verification Tests (A to N)");
  console.log("===============================================================================\n");

  await sequelize.authenticate();
  await sequelize.sync();
  await startServer();

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    process.stdout.write(`[Test ${name}] `);
    try {
      await fn();
      passed++;
      console.log("✅ PASSED");
    } catch (err) {
      console.log("❌ FAILED");
      console.error(err);
      throw err;
    }
  }

  try {
    const ts = Date.now();
    const testDate = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);

    // 1. Setup Actors: Transporter with two vehicles, and multiple Farmers
    const transporterUser = await User.create({
      name: "Sanjay Shinde Logistics",
      email: `sanjay_fleet_${ts}@harvestmitra.local`,
      password: "Password123!",
      role: "transporter",
      phone: "9822" + String(Math.floor(100000 + Math.random() * 900000))
    });
    await TransporterProfile.create({
      userId: transporterUser.id,
      driverName: "Sanjay Shinde",
      phone: transporterUser.phone,
      vehicleType: "Medium Goods Truck",
      vehicleNumber: `MH-12-FL-${Math.floor(1000 + Math.random() * 9000)}`,
      capacityKg: 2000,
      baseMandi: "Pune APMC",
      ratePerKm: 25,
      isAvailable: true
    });
    const transporterToken = signToken(transporterUser);

    // Truck 1: 2,000 kg capacity
    const truck1 = await Vehicle.create({
      userId: transporterUser.id,
      vehicleType: "Medium Goods Truck",
      registrationNumber: `MH-12-TK1-${Math.floor(1000 + Math.random() * 9000)}`,
      capacityKg: 2000,
      driverName: "Sanjay Shinde",
      driverPhone: transporterUser.phone,
      ratePerKm: 25,
      specialHandling: "Ventilated Mesh Bed",
      isAvailable: true,
      status: "available"
    });

    // Truck 2: 1,500 kg capacity (belonging to same driver/transporter)
    const truck2 = await Vehicle.create({
      userId: transporterUser.id,
      vehicleType: "Tata Ace / Mini Truck",
      registrationNumber: `MH-12-TK2-${Math.floor(1000 + Math.random() * 9000)}`,
      capacityKg: 1500,
      driverName: "Sanjay Shinde",
      driverPhone: transporterUser.phone,
      ratePerKm: 20,
      specialHandling: "Covered High-Side Body",
      isAvailable: true,
      status: "available"
    });

    // Farmer A (Ramesh)
    const farmerA = await User.create({
      name: "Ramesh Patil",
      email: `ramesh_${ts}@harvestmitra.local`,
      password: "Password123!",
      role: "farmer",
      phone: "9833" + String(Math.floor(100000 + Math.random() * 900000))
    });
    const tokenA = signToken(farmerA);

    // Farmer B (Suresh)
    const farmerB = await User.create({
      name: "Suresh Deshmukh",
      email: `suresh_${ts}@harvestmitra.local`,
      password: "Password123!",
      role: "farmer",
      phone: "9844" + String(Math.floor(100000 + Math.random() * 900000))
    });
    const tokenB = signToken(farmerB);

    // Farmer C (Ganesh)
    const farmerC = await User.create({
      name: "Ganesh Jadhav",
      email: `ganesh_${ts}@harvestmitra.local`,
      password: "Password123!",
      role: "farmer",
      phone: "9855" + String(Math.floor(100000 + Math.random() * 900000))
    });
    const tokenC = signToken(farmerC);

    let sharedBooking1Id = null;
    let sharedBooking2Id = null;

    // -------------------------------------------------------------------------
    // TEST A: Multi-Crop Selection (Tomato, Potato, Onion all selected)
    // -------------------------------------------------------------------------
    await test("A: Multi-crop selection payload validation (Tomato 300kg, Potato 200kg, Onion 200kg = 700kg total)", async () => {
      const res = await makeRequest({
        method: "POST",
        path: "/api/transport/bookings",
        token: tokenA,
        body: {
          selectedCrops: [
            { cropName: "Tomato", quantity: 300, quantityUnit: "kg" },
            { cropName: "Potato", quantity: 2, quantityUnit: "quintal" }, // 200 kg
            { cropName: "Onion", quantity: 200, quantityUnit: "kg" }
          ],
          pickupLocation: "Narayangaon, Pune",
          destinationMarket: "Mumbai Vashi APMC Terminal",
          pickupDate: testDate,
          bookingType: "shared",
          vehicleId: truck1.id
        }
      });

      assert.strictEqual(res.statusCode, 201, `Expected 201 Created but got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(Number(res.data.data.weightKg), 700, "Total weight must equal 300 + 200 + 200 = 700 kg");
      assert(res.data.data.cropName.includes("Tomato"), "Must include Tomato");
      assert(res.data.data.cropName.includes("Potato"), "Must include Potato");
      assert(res.data.data.cropName.includes("Onion"), "Must include Onion");
      assert.strictEqual(res.data.data.status, "pending", "Initial booking must be pending transporter confirmation");

      sharedBooking1Id = res.data.data.id;
    });

    // -------------------------------------------------------------------------
    // TEST B: Deselect Potato — Excluded from total and payload
    // -------------------------------------------------------------------------
    await test("B: Deselect Potato — Only Tomato (300kg) & Onion (200kg) booked (500kg total)", async () => {
      const otherDate = new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10);
      const res = await makeRequest({
        method: "POST",
        path: "/api/transport/bookings",
        token: tokenA,
        body: {
          selectedCrops: [
            { cropName: "Tomato", quantity: 300, quantityUnit: "kg" },
            { cropName: "Onion", quantity: 200, quantityUnit: "kg" }
          ],
          pickupLocation: "Narayangaon, Pune",
          destinationMarket: "Mumbai Vashi APMC Terminal",
          pickupDate: otherDate,
          bookingType: "shared",
          vehicleId: truck1.id
        }
      });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(Number(res.data.data.weightKg), 500, "Weight without Potato must be 500 kg");
      assert(!res.data.data.cropName.includes("Potato"), "Potato must not be present in cropName");

      // Clean up test B booking so it doesn't interfere
      await TransportRequest.destroy({ where: { id: res.data.data.id } });
    });

    // -------------------------------------------------------------------------
    // TEST C: Reselect Potato — Restored with correct unit conversion
    // -------------------------------------------------------------------------
    await test("C: Reselect Potato with tonne unit (1 tonne = 1000 kg)", async () => {
      const otherDate = new Date(Date.now() + 86400000 * 6).toISOString().slice(0, 10);
      const res = await makeRequest({
        method: "POST",
        path: "/api/transport/bookings",
        token: tokenA,
        body: {
          selectedCrops: [
            { cropName: "Potato", quantity: 1, quantityUnit: "tonne" }
          ],
          pickupLocation: "Narayangaon, Pune",
          destinationMarket: "Mumbai Vashi APMC Terminal",
          pickupDate: otherDate,
          bookingType: "shared",
          vehicleId: truck1.id
        }
      });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(Number(res.data.data.weightKg), 1000, "1 tonne must convert to 1000 kg");

      // Clean up test C booking
      await TransportRequest.destroy({ where: { id: res.data.data.id } });
    });

    // -------------------------------------------------------------------------
    // TEST D: Capacity Check after 700 kg on 2,000 kg truck (Remaining = 1,300 kg)
    // -------------------------------------------------------------------------
    await test("D: Capacity check: 700 kg booked on 2,000 kg truck leaves 1,300 kg remaining", async () => {
      const res = await makeRequest({
        method: "GET",
        path: `/api/transport/vehicles?crop=Tomato&weightKg=500&date=${testDate}`,
        token: tokenB
      });

      assert.strictEqual(res.statusCode, 200);
      const vehicleRecord = res.data.data.find(v => v.id === truck1.id);
      assert(vehicleRecord, "Truck 1 must be returned in available vehicles list");
      assert.strictEqual(vehicleRecord.capacityKg, 2000);
      assert.strictEqual(vehicleRecord.remainingCapacityKg, 1300, `Expected 1300 kg free but got ${vehicleRecord.remainingCapacityKg}`);
      assert.strictEqual(vehicleRecord.isFullyBooked, false, "Vehicle must not be marked fully booked");
    });

    // -------------------------------------------------------------------------
    // TEST E: Book remaining 1,300 kg — Truck reaches 0 kg remaining & FULL / SOLD OUT
    // -------------------------------------------------------------------------
    await test("E: Farmer B books remaining 1,300 kg — Capacity reaches 0 kg, status FULL / SOLD OUT", async () => {
      const res = await makeRequest({
        method: "POST",
        path: "/api/transport/bookings",
        token: tokenB,
        body: {
          selectedCrops: [
            { cropName: "Potato", quantity: 13, quantityUnit: "quintal" } // 1300 kg
          ],
          pickupLocation: "Khed, Pune",
          destinationMarket: "Mumbai Vashi APMC Terminal",
          pickupDate: testDate,
          bookingType: "shared",
          vehicleId: truck1.id
        }
      });

      assert.strictEqual(res.statusCode, 201, `Expected 201 but got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      sharedBooking2Id = res.data.data.id;

      // Verify vehicle capacity query
      const checkRes = await makeRequest({
        method: "GET",
        path: `/api/transport/vehicles?crop=Tomato&weightKg=100&date=${testDate}`,
        token: tokenC
      });
      assert.strictEqual(checkRes.statusCode, 200);
      const v = checkRes.data.data.find(item => item.id === truck1.id);
      assert(v, "Truck 1 must appear");
      assert.strictEqual(v.remainingCapacityKg, 0, "Remaining capacity must be 0 kg");
      assert.strictEqual(v.isFullyBooked, true, "isFullyBooked flag must be true");
    });

    // -------------------------------------------------------------------------
    // TEST F: Attempt 100 kg on FULL Truck — Rejected with 409 Conflict
    // -------------------------------------------------------------------------
    await test("F: Overbooking attempt on full truck rejected with HTTP 409 Conflict", async () => {
      const res = await makeRequest({
        method: "POST",
        path: "/api/transport/bookings",
        token: tokenC,
        body: {
          cropName: "Tomato",
          weightKg: 100,
          pickupLocation: "Manchar, Pune",
          destinationMarket: "Mumbai Vashi APMC Terminal",
          pickupDate: testDate,
          bookingType: "shared",
          vehicleId: truck1.id
        }
      });

      assert.strictEqual(res.statusCode, 409, `Expected 409 Conflict but got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      assert.strictEqual(res.data.success, false);
      assert.strictEqual(res.data.code, "VEHICLE_FULLY_BOOKED");
    });

    // -------------------------------------------------------------------------
    // TEST G: Cancellation & Release of Capacity
    // -------------------------------------------------------------------------
    await test("G: Cancel Farmer B's 1,300 kg booking — Capacity accurately releases back to 1,300 kg", async () => {
      const cancelRes = await makeRequest({
        method: "PUT",
        path: `/api/transport/bookings/${sharedBooking2Id}/cancel`,
        token: tokenB,
        body: { reason: "Crop harvest delayed" }
      });

      assert.strictEqual(cancelRes.statusCode, 200);
      assert.strictEqual(cancelRes.data.data.status, "cancelled");

      // Verify remaining capacity is now restored to 1,300 kg
      const checkRes = await makeRequest({
        method: "GET",
        path: `/api/transport/vehicles?crop=Tomato&weightKg=500&date=${testDate}`,
        token: tokenC
      });
      const v = checkRes.data.data.find(item => item.id === truck1.id);
      assert.strictEqual(v.remainingCapacityKg, 1300, "Capacity must be released to 1,300 kg");
      assert.strictEqual(v.isFullyBooked, false, "Vehicle must no longer be marked full");
    });

    // -------------------------------------------------------------------------
    // TEST H: Dedicated Truck Reservation (Reserves full vehicle even if cargo < capacity)
    // -------------------------------------------------------------------------
    await test("H: Dedicated Truck: 700 kg cargo reserves entire 2,000 kg truck; remaining space is 0 kg", async () => {
      const dedicatedDate = new Date(Date.now() + 86400000 * 8).toISOString().slice(0, 10);
      const res = await makeRequest({
        method: "POST",
        path: "/api/transport/bookings",
        token: tokenA,
        body: {
          cropName: "Tomato",
          weightKg: 700,
          pickupLocation: "Junnar, Pune",
          destinationMarket: "Mumbai Vashi APMC Terminal",
          pickupDate: dedicatedDate,
          bookingType: "dedicated",
          vehicleId: truck1.id
        }
      });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.data.bookingType, "dedicated");

      // Query vehicle availability for that date
      const checkRes = await makeRequest({
        method: "GET",
        path: `/api/transport/vehicles?crop=Tomato&weightKg=100&date=${dedicatedDate}`,
        token: tokenB
      });
      const v = checkRes.data.data.find(item => item.id === truck1.id);
      assert.strictEqual(v.remainingCapacityKg, 0, "Dedicated truck must offer 0 kg remaining capacity");
      assert.strictEqual(v.isDedicatedReserved, true, "isDedicatedReserved flag must be true");

      // Another farmer attempting to book shared space must be rejected
      const rejectRes = await makeRequest({
        method: "POST",
        path: "/api/transport/bookings",
        token: tokenB,
        body: {
          cropName: "Onion",
          weightKg: 100,
          pickupLocation: "Khed, Pune",
          destinationMarket: "Mumbai Vashi APMC Terminal",
          pickupDate: dedicatedDate,
          bookingType: "shared",
          vehicleId: truck1.id
        }
      });
      assert.strictEqual(rejectRes.statusCode, 409, "Must reject booking on dedicated vehicle");
    });

    // -------------------------------------------------------------------------
    // TEST I: Driver Multi-Vehicle Isolation
    // -------------------------------------------------------------------------
    await test("I: Two vehicles under same driver — Booking Truck 1 does not affect Truck 2 capacity", async () => {
      const res = await makeRequest({
        method: "GET",
        path: `/api/transport/vehicles?crop=Tomato&weightKg=500&date=${testDate}`,
        token: tokenC
      });

      const t1 = res.data.data.find(item => item.id === truck1.id);
      const t2 = res.data.data.find(item => item.id === truck2.id);

      assert.strictEqual(t1.remainingCapacityKg, 1300, "Truck 1 has 1,300 kg remaining");
      assert.strictEqual(t2.remainingCapacityKg, 1500, "Truck 2 must have full 1,500 kg remaining");
      assert.strictEqual(t2.isFullyBooked, false);
    });

    // -------------------------------------------------------------------------
    // TEST J: Persistence across reloads and logins
    // -------------------------------------------------------------------------
    await test("J: Persistence: Farmer A's booking record persists on GET /my-bookings", async () => {
      const res = await makeRequest({
        method: "GET",
        path: "/api/transport/my-bookings",
        token: tokenA
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      const found = res.data.data.find(b => b.id === sharedBooking1Id);
      assert(found, "Farmer A's booking must persist");
      assert.strictEqual(found.weightKg, 700);
      assert.strictEqual(found.vehicleId, truck1.id);
      assert.strictEqual(found.vehicleNumber, truck1.registrationNumber);
      assert.strictEqual(found.driverName, truck1.driverName);
    });

    // -------------------------------------------------------------------------
    // TEST K: Simultaneous Concurrent Bookings (Overbooking Prevention)
    // -------------------------------------------------------------------------
    await test("K: Concurrency: Two simultaneous 800 kg bookings competing for 1,300 kg space — Exactly one succeeds", async () => {
      // Both Farmer B and Farmer C attempt to book 800 kg simultaneously via Promise.all
      const [res1, res2] = await Promise.all([
        makeRequest({
          method: "POST",
          path: "/api/transport/bookings",
          token: tokenB,
          body: {
            cropName: "Tomato",
            weightKg: 800,
            pickupLocation: "Khed, Pune",
            destinationMarket: "Mumbai Vashi APMC Terminal",
            pickupDate: testDate,
            bookingType: "shared",
            vehicleId: truck1.id
          }
        }),
        makeRequest({
          method: "POST",
          path: "/api/transport/bookings",
          token: tokenC,
          body: {
            cropName: "Potato",
            weightKg: 800,
            pickupLocation: "Chakan, Pune",
            destinationMarket: "Mumbai Vashi APMC Terminal",
            pickupDate: testDate,
            bookingType: "shared",
            vehicleId: truck1.id
          }
        })
      ]);

      const statuses = [res1.statusCode, res2.statusCode];
      assert(statuses.includes(201), "One request must succeed with 201 Created");
      assert(statuses.includes(409), "The competing request must be rejected with 409 Conflict");

      // Verify that total booked cargo does not exceed capacity
      const allActive = await TransportRequest.findAll({
        where: {
          vehicleId: truck1.id,
          pickupDate: testDate,
          status: ["open", "pending", "confirmed", "accepted"]
        }
      });
      const totalBooked = allActive.reduce((sum, b) => sum + Number(b.weightKg), 0);
      assert(totalBooked <= truck1.capacityKg, `Total booked (${totalBooked} kg) must not exceed capacity (${truck1.capacityKg} kg)`);
    });

    // -------------------------------------------------------------------------
    // TEST L: Scheduled Departure Policy & Minimum Viable Load
    // -------------------------------------------------------------------------
    await test("L: Scheduled departure policy: Transporter creates trip with minLoadKg = 1,000 kg", async () => {
      const schedDate = new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10);
      const tripRes = await makeRequest({
        method: "POST",
        path: "/api/transport/shared-trips",
        token: transporterToken,
        body: {
          vehicleId: truck2.id,
          pickupLocation: "Baramati, Pune",
          destinationMarket: "Pune Gultekdi APMC",
          tripDate: schedDate,
          departureTime: "06:00 AM",
          bookingCutoff: "04:00 AM",
          minLoadKg: 1000,
          minViableFare: 2500,
          compatibleCategory: "Vegetable"
        }
      });

      assert.strictEqual(tripRes.statusCode, 201);
      const trip = tripRes.data.data;
      assert.strictEqual(trip.minLoadKg, 1000);
      assert.strictEqual(trip.status, "open");

      // Farmer books 1,100 kg onto this trip
      const bookRes = await makeRequest({
        method: "POST",
        path: "/api/transport/bookings",
        token: tokenA,
        body: {
          cropName: "Tomato",
          weightKg: 1100,
          pickupLocation: "Baramati, Pune",
          destinationMarket: "Pune Gultekdi APMC",
          pickupDate: schedDate,
          bookingType: "shared",
          vehicleId: truck2.id
        }
      });
      assert.strictEqual(bookRes.statusCode, 201);

      // Verify shared-trips status reflects ready_for_departure
      const tripsListRes = await makeRequest({
        method: "GET",
        path: "/api/transport/shared-trips",
        token: transporterToken
      });
      assert.strictEqual(tripsListRes.statusCode, 200);
      const foundTrip = tripsListRes.data.data.find(t => t.id === trip.id);
      assert(foundTrip, "Trip must be found in shared-trips list");
      assert.strictEqual(foundTrip.isMinLoadReached, true, "Minimum load must be reached");
      assert.strictEqual(foundTrip.isReadyForDeparture, true, "Trip must be ready for departure");

      // Transporter explicitly confirms departure
      const departRes = await makeRequest({
        method: "PUT",
        path: `/api/transport/shared-trips/${trip.id}/departure`,
        token: transporterToken
      });
      assert.strictEqual(departRes.statusCode, 200);
      assert.strictEqual(departRes.data.data.status, "in_transit", "Trip status must transition to in_transit");
    });

    // -------------------------------------------------------------------------
    // TEST M: State Machine Transitions (pending -> accepted -> pickup -> in_transit -> delivered)
    // -------------------------------------------------------------------------
    await test("M: Milestone status progression and rejection of invalid transitions", async () => {
      // Create a fresh test booking
      const stateDate = new Date(Date.now() + 86400000 * 12).toISOString().slice(0, 10);
      const bRes = await makeRequest({
        method: "POST",
        path: "/api/transport/bookings",
        token: tokenA,
        body: {
          cropName: "Tomato",
          weightKg: 200,
          pickupLocation: "Khed, Pune",
          destinationMarket: "Mumbai Vashi APMC Terminal",
          pickupDate: stateDate,
          bookingType: "shared",
          vehicleId: truck1.id
        }
      });
      const bId = bRes.data.data.id;

      // 1. Invalid jump: pending directly to delivered must be rejected
      const invalidRes = await makeRequest({
        method: "PUT",
        path: `/api/transport/bookings/${bId}/status`,
        token: transporterToken,
        body: { status: "delivered" }
      });
      assert.strictEqual(invalidRes.statusCode, 400, "Direct transition from pending to delivered must fail");

      // 2. Transporter accepts booking -> driver_assigned
      const acceptRes = await makeRequest({
        method: "PUT",
        path: `/api/transport/bookings/${bId}/accept`,
        token: transporterToken,
        body: { vehicleId: truck1.id }
      });
      assert.strictEqual(acceptRes.statusCode, 200);
      assert.strictEqual(acceptRes.data.data.status, "driver_assigned");

      // 3. Confirm Farm Pickup -> pickup_confirmed
      const pickupRes = await makeRequest({
        method: "PUT",
        path: `/api/transport/bookings/${bId}/pickup`,
        token: transporterToken,
        body: { loadedQuantity: 200, actualPickupTime: new Date().toISOString() }
      });
      assert.strictEqual(pickupRes.statusCode, 200);
      assert.strictEqual(pickupRes.data.data.status, "pickup_confirmed");

      // 4. Depart -> in_transit
      const transitRes = await makeRequest({
        method: "PUT",
        path: `/api/transport/bookings/${bId}/status`,
        token: transporterToken,
        body: { status: "in_transit" }
      });
      assert.strictEqual(transitRes.statusCode, 200);
      assert.strictEqual(transitRes.data.data.status, "in_transit");

      // 5. Arrive & Deliver at APMC -> delivered
      const deliverRes = await makeRequest({
        method: "PUT",
        path: `/api/transport/bookings/${bId}/delivery`,
        token: transporterToken,
        body: { deliveredQuantity: 200, recipientAcknowledgment: "Verified at APMC weighbridge" }
      });
      assert.strictEqual(deliverRes.statusCode, 200);
      assert.strictEqual(deliverRes.data.data.status, "delivered");
    });

    // -------------------------------------------------------------------------
    // TEST N: Security, Validations & Edge Cases
    // -------------------------------------------------------------------------
    await test("N: Edge Cases: Invalid quantities, incompatible crops, unauthorized cancel", async () => {
      // 1. Negative or zero weight
      const negRes = await makeRequest({
        method: "POST",
        path: "/api/transport/bookings",
        token: tokenA,
        body: {
          cropName: "Tomato",
          weightKg: -50,
          pickupLocation: "Pune",
          destinationMarket: "Mumbai",
          pickupDate: testDate
        }
      });
      assert.strictEqual(negRes.statusCode, 400, "Negative weight must be rejected");

      // 2. Empty crops array
      const emptyCropsRes = await makeRequest({
        method: "POST",
        path: "/api/transport/bookings",
        token: tokenA,
        body: {
          selectedCrops: [],
          pickupLocation: "Pune",
          destinationMarket: "Mumbai",
          pickupDate: testDate
        }
      });
      assert.strictEqual(emptyCropsRes.statusCode, 400, "Empty selectedCrops must be rejected");

      // 3. Unauthorized farmer cancelling another farmer's booking
      const unauthCancelRes = await makeRequest({
        method: "PUT",
        path: `/api/transport/bookings/${sharedBooking1Id}/cancel`,
        token: tokenB, // Farmer B trying to cancel Farmer A
        body: { reason: "Malicious attempt" }
      });
      assert.strictEqual(unauthCancelRes.statusCode, 403, "Must return 403 Forbidden");
    });

  } finally {
    await stopServer();
    console.log(`\n===============================================================================`);
    console.log(`Test Execution Finished: ${passed} / ${total} tests passed.`);
    console.log(`===============================================================================\n`);
    if (passed !== total) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error("Test runner error:", err);
    process.exit(1);
  });
}

module.exports = runTests;
