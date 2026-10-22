/**
 * transport_security.test.js
 * Security & RBAC verification suite for Transport module
 * HarvestMitra AI
 *
 * Tests:
 * 1. Transporter B cannot progress or reject Transporter A's trip (403)
 * 2. A second transporter accepting an already accepted request gets 409
 * 3. A transporter with an active trip accepting another gets 409
 * 4. Invalid status jump (accepted -> delivered) gets 400
 * 5. Transporter A's my-requests does not include Transporter B's trips
 * 6. Farmer A cannot see Farmer B's my-requests
 * 7. Farmer token gets 403 on open-cargo and transporter-stats
 */

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon";

const assert = require("assert");
const http = require("http");
const jwt = require("jsonwebtoken");
const app = require("../app");
const sequelize = require("../config/database");
const { User, TransportRequest, TransporterProfile } = require("../models");

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

async function runTransportSecurityTests() {
  console.log("\n======================================================");
  console.log("🚚 HarvestMitra AI — Transport Security & Isolation Tests");
  console.log("======================================================\n");

  await sequelize.authenticate();
  await sequelize.sync();
  await startServer();

  try {
    // 1. Seed test users
    const [farmerA] = await User.findOrCreate({
      where: { email: "farmerA_sec@harvestmitra.local" },
      defaults: {
        name: "Farmer A",
        email: "farmerA_sec@harvestmitra.local",
        role: "farmer",
        phone: "9811111111",
        password: "Demo@12345"
      }
    });

    const [farmerB] = await User.findOrCreate({
      where: { email: "farmerB_sec@harvestmitra.local" },
      defaults: {
        name: "Farmer B",
        email: "farmerB_sec@harvestmitra.local",
        role: "farmer",
        phone: "9822222222",
        password: "Demo@12345"
      }
    });

    const [transporterA] = await User.findOrCreate({
      where: { email: "transporterA_sec@harvestmitra.local" },
      defaults: {
        name: "Transporter A",
        email: "transporterA_sec@harvestmitra.local",
        role: "transporter",
        phone: "9833333333",
        password: "Demo@12345"
      }
    });

    const [transporterB] = await User.findOrCreate({
      where: { email: "transporterB_sec@harvestmitra.local" },
      defaults: {
        name: "Transporter B",
        email: "transporterB_sec@harvestmitra.local",
        role: "transporter",
        phone: "9844444444",
        password: "Demo@12345"
      }
    });

    await TransporterProfile.findOrCreate({
      where: { userId: transporterA.id },
      defaults: {
        userId: transporterA.id,
        driverName: "Transporter A",
        phone: "9833333333",
        vehicleType: "Tata Ace",
        vehicleNumber: "MH-12-TA-9901",
        capacityKg: 3000,
        baseMandi: "Pune APMC",
        ratePerKm: 25,
        isAvailable: true
      }
    });

    await TransporterProfile.findOrCreate({
      where: { userId: transporterB.id },
      defaults: {
        userId: transporterB.id,
        driverName: "Transporter B",
        phone: "9844444444",
        vehicleType: "Bolero Pickup",
        vehicleNumber: "MH-12-BP-9902",
        capacityKg: 3000,
        baseMandi: "Pune APMC",
        ratePerKm: 25,
        isAvailable: true
      }
    });

    const farmerAToken = signToken(farmerA);
    const farmerBToken = signToken(farmerB);
    const transporterAToken = signToken(transporterA);
    const transporterBToken = signToken(transporterB);

    // Clean up any existing transport requests created in earlier runs for test isolation
    await TransportRequest.destroy({
      where: {
        userId: [farmerA.id, farmerB.id]
      }
    });

    // Test 1a: Create trip assigned to Transporter A
    const tripA = await TransportRequest.create({
      userId: farmerA.id,
      farmerName: farmerA.name,
      farmerPhone: farmerA.phone,
      transporterId: transporterA.id,
      cropName: "Tomato",
      cropCategory: "vegetable",
      pickupLocation: "Baramati, Pune",
      destinationMarket: "Pune APMC",
      pickupDate: new Date().toISOString().slice(0, 10),
      weightKg: 500,
      status: "accepted"
    });

    // Transporter B cannot progress Transporter A's trip (403)
    const progressRes = await makeRequest({
      method: "PUT",
      path: `/api/transport/requests/${tripA.id}/progress`,
      body: { nextStatus: "in_transit" },
      token: transporterBToken
    });
    assert.strictEqual(progressRes.statusCode, 403, "Transporter B progressing Transporter A's trip should be 403");
    assert.strictEqual(progressRes.data.message, "Not your trip.");
    console.log("  ✅ [PASS] Transporter B cannot progress Transporter A's trip (403 Forbidden)");

    // Test 1b: Transporter B cannot reject Transporter A's trip (403)
    const rejectRes = await makeRequest({
      method: "PUT",
      path: `/api/transport/bookings/${tripA.id}/reject`,
      body: { reason: "Not available" },
      token: transporterBToken
    });
    assert.strictEqual(rejectRes.statusCode, 403, "Transporter B rejecting Transporter A's trip should be 403");
    assert.match(rejectRes.data.message, /Not authorized|Not your trip/i);
    console.log("  ✅ [PASS] Transporter B cannot reject Transporter A's trip (403 Forbidden)");

    // Test 2: Second transporter accepting an already accepted request gets 409
    const secondAcceptRes = await makeRequest({
      method: "PUT",
      path: `/api/transport/requests/${tripA.id}/accept`,
      body: {},
      token: transporterBToken
    });
    assert.strictEqual(secondAcceptRes.statusCode, 409, "Accepting already accepted request should return 409");
    assert.strictEqual(secondAcceptRes.data.message, "Already taken or no longer open.");
    console.log("  ✅ [PASS] A second transporter accepting an already accepted request gets 409");

    // Test 3: A transporter with an active trip accepting another gets 409
    // Transporter A currently has tripA in "accepted" status.
    const tripOpen = await TransportRequest.create({
      userId: farmerA.id,
      farmerName: farmerA.name,
      cropName: "Onion",
      cropCategory: "vegetable",
      pickupLocation: "Narayangaon, Pune",
      destinationMarket: "Pune APMC",
      pickupDate: new Date().toISOString().slice(0, 10),
      weightKg: 400,
      status: "open"
    });

    const activeTripLockRes = await makeRequest({
      method: "PUT",
      path: `/api/transport/requests/${tripOpen.id}/accept`,
      body: {},
      token: transporterAToken
    });
    assert.strictEqual(activeTripLockRes.statusCode, 409, "Transporter with active trip accepting another must get 409");
    assert.strictEqual(activeTripLockRes.data.message, "Finish your active trip first.");
    console.log("  ✅ [PASS] A transporter with an active trip accepting another gets 409");

    // Test 4: Invalid status jump (accepted -> delivered) gets 400
    const invalidJumpRes = await makeRequest({
      method: "PUT",
      path: `/api/transport/requests/${tripA.id}/progress`,
      body: { status: "delivered" },
      token: transporterAToken
    });
    assert.strictEqual(invalidJumpRes.statusCode, 400, "Invalid status jump (accepted -> delivered) must get 400");
    assert.match(invalidJumpRes.data.message, /Invalid status transition/i);
    console.log("  ✅ [PASS] Invalid status jump (accepted -> delivered) gets 400");

    // Test 5: Transporter A's my-requests does not include Transporter B's trips
    const tripB = await TransportRequest.create({
      userId: farmerB.id,
      farmerName: farmerB.name,
      transporterId: transporterB.id,
      cropName: "Wheat",
      cropCategory: "grain",
      pickupLocation: "Shirur, Pune",
      destinationMarket: "Pune APMC",
      pickupDate: new Date().toISOString().slice(0, 10),
      weightKg: 600,
      status: "in_transit"
    });

    const transporterAMyRequests = await makeRequest({
      method: "GET",
      path: "/api/transport/my-requests",
      token: transporterAToken
    });
    assert.strictEqual(transporterAMyRequests.statusCode, 200);
    assert.ok(Array.isArray(transporterAMyRequests.data.data));
    assert.ok(transporterAMyRequests.data.data.every((r) => Number(r.transporterId) === Number(transporterA.id)));
    assert.ok(!transporterAMyRequests.data.data.some((r) => Number(r.transporterId) === Number(transporterB.id)));
    console.log("  ✅ [PASS] Transporter A's my-requests does not include Transporter B's trips");

    // Test 6: Farmer A cannot see Farmer B's my-requests
    const farmerAMyRequests = await makeRequest({
      method: "GET",
      path: "/api/transport/my-requests",
      token: farmerAToken
    });
    assert.strictEqual(farmerAMyRequests.statusCode, 200);
    assert.ok(Array.isArray(farmerAMyRequests.data.data));
    assert.ok(farmerAMyRequests.data.data.every((r) => Number(r.userId) === Number(farmerA.id)));
    assert.ok(!farmerAMyRequests.data.data.some((r) => Number(r.userId) === Number(farmerB.id)));
    console.log("  ✅ [PASS] Farmer A cannot see Farmer B's my-requests");

    // Test 7: Farmer token gets 403 on open-cargo and transporter-stats
    const openCargoFarmerRes = await makeRequest({
      method: "GET",
      path: "/api/transport/open-cargo",
      token: farmerAToken
    });
    assert.strictEqual(openCargoFarmerRes.statusCode, 403, "Farmer accessing /open-cargo must get 403");

    const statsFarmerRes = await makeRequest({
      method: "GET",
      path: "/api/transport/transporter-stats",
      token: farmerAToken
    });
    assert.strictEqual(statsFarmerRes.statusCode, 403, "Farmer accessing /transporter-stats must get 403");
    console.log("  ✅ [PASS] Farmer token gets 403 on open-cargo and transporter-stats");

    console.log("\n======================================================");
    console.log("🎉 All 7 Transport Security & RBAC Tests Passed!");
    console.log("======================================================\n");
  } finally {
    await stopServer();
  }
}

if (require.main === module) {
  runTransportSecurityTests().catch((err) => {
    console.error("Fatal transport security test error:", err);
    process.exit(1);
  });
}

module.exports = { runTransportSecurityTests };
