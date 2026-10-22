/**
 * escrow_rating.test.js
 * Test suite for Transporter Escrow Payments and Driver 5-Star Ratings
 * HarvestMitra AI - Mihir Jadav
 */

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon";

const assert = require("assert");
const http = require("http");
const jwt = require("jsonwebtoken");
const app = require("../app");
const sequelize = require("../config/database");
const { User, TransportRequest, TransporterProfile } = require("../models");
const transportRoutes = require("../routes/transport.routes");

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
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data });
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

async function runTests() {
  console.log("\n======================================================");
  console.log("💳 HarvestMitra AI — Freight Escrow & Driver Rating Tests");
  console.log("Lead Architect: Mihir Jadav (@230493131013mihir)");
  console.log("======================================================\n");

  await sequelize.sync({ force: false });
  await transportRoutes.ensureTransportSchema();
  await startServer();

  try {
    // 1. Create or find test farmer and transporter
    let farmer = await User.findOne({ where: { email: "escrow_farmer@test.local" } });
    if (!farmer) {
      farmer = await User.create({
        name: "Escrow Test Farmer",
        email: "escrow_farmer@test.local",
        password: "Password123!",
        role: "farmer",
        phone: "9111111111"
      });
    }

    let otherFarmer = await User.findOne({ where: { email: "other_farmer@test.local" } });
    if (!otherFarmer) {
      otherFarmer = await User.create({
        name: "Other Test Farmer",
        email: "other_farmer@test.local",
        password: "Password123!",
        role: "farmer",
        phone: "9222222222"
      });
    }

    let transporter = await User.findOne({ where: { email: "escrow_transporter@test.local" } });
    if (!transporter) {
      transporter = await User.create({
        name: "Escrow Transporter",
        email: "escrow_transporter@test.local",
        password: "Password123!",
        role: "transporter",
        phone: "9333333333"
      });
    }

    let profile = await TransporterProfile.findOne({ where: { userId: transporter.id } });
    if (!profile) {
      profile = await TransporterProfile.create({
        userId: transporter.id,
        driverName: "Dinesh Patil",
        phone: "9333333333",
        vehicleType: "Tata Ace",
        vehicleNumber: "MH-12-EP-5555",
        capacityKg: 1500,
        baseMandi: "Pune APMC",
        ratePerKm: 20,
        rating: 4.8,
        totalRatings: 1
      });
    } else {
      await profile.update({ rating: 4.8, totalRatings: 1 });
    }

    await TransportRequest.destroy({ where: { transporterId: transporter.id } });

    const farmerToken = generateToken(farmer);
    const otherFarmerToken = generateToken(otherFarmer);

    // 2. Create test booking
    const booking = await TransportRequest.create({
      userId: farmer.id,
      transporterId: transporter.id,
      farmerName: farmer.name,
      cropName: "Tomato",
      pickupLocation: "Baramati, Pune",
      destinationMarket: "Pune APMC",
      pickupDate: new Date().toISOString().slice(0, 10),
      weightKg: 800,
      estimatedSharedCost: 1450,
      status: "driver_assigned",
      paymentStatus: "unpaid"
    });

    // Test 1: Farmer locks freight fare in escrow via simulated UPI
    console.log("--- [TASK 4.1] UPI / Escrow Freight Payment Lock ---");
    const payRes = await makeRequest({
      method: "POST",
      path: `/api/transport/bookings/${booking.id}/pay`,
      token: farmerToken
    });
    assert.strictEqual(payRes.status, 200, `Expected 200 OK, got ${payRes.status}`);
    assert.strictEqual(payRes.body.success, true);
    assert.strictEqual(payRes.body.data.paymentStatus, "in_escrow");
    assert.strictEqual(payRes.body.data.escrowAmount, 1450);
    assert(payRes.body.data.transactionId.startsWith("TXN-UPI-"));
    console.log("  ✅ [PASS] Farmer locked ₹1450 freight fare in HarvestMitra Escrow (200 OK)");

    // Test 2: Another farmer cannot pay or modify this booking
    const unauthPay = await makeRequest({
      method: "POST",
      path: `/api/transport/bookings/${booking.id}/pay`,
      token: otherFarmerToken
    });
    assert.strictEqual(unauthPay.status, 403, `Expected 403 Forbidden, got ${unauthPay.status}`);
    console.log("  ✅ [PASS] Unauthorized farmer cannot pay for another user's booking (403 Forbidden)");

    // Test 3: Cannot review trip before delivery
    console.log("\n--- [TASK 4.2] Driver 5-Star Rating & Review Engine ---");
    const prematureReview = await makeRequest({
      method: "POST",
      path: `/api/transport/bookings/${booking.id}/review`,
      body: { rating: 5, review: "Great ride!" },
      token: farmerToken
    });
    assert.strictEqual(prematureReview.status, 400);
    console.log("  ✅ [PASS] Rating rejected before cargo delivery has occurred (400 Bad Request)");

    // Progress trip to delivered
    await booking.update({ status: "delivered" });

    // Test 4: Confirming delivery releases escrow funds to paid
    const confirmRes = await makeRequest({
      method: "PUT",
      path: `/api/transport/requests/${booking.id}/confirm`,
      token: farmerToken
    });
    assert.strictEqual(confirmRes.status, 200);
    assert.strictEqual(confirmRes.body.data.status, "completed");
    assert.strictEqual(confirmRes.body.data.paymentStatus, "paid");
    console.log("  ✅ [PASS] Delivery confirmation automatically released escrow funds to paid status (200 OK)");

    // Test 5: Farmer submits 5-star driver review
    const reviewRes = await makeRequest({
      method: "POST",
      path: `/api/transport/bookings/${booking.id}/review`,
      body: {
        rating: 5,
        review: "Dinesh arrived exactly on time! Crated tomatoes carefully and tied tarp well."
      },
      token: farmerToken
    });
    assert.strictEqual(reviewRes.status, 200);
    assert.strictEqual(reviewRes.body.data.driverRating, 5);
    console.log("  ✅ [PASS] 5-Star driver rating and review recorded successfully (200 OK)");

    // Test 6: Verify updated transporter rating and recent reviews
    const ratingRes = await makeRequest({
      method: "GET",
      path: `/api/transport/transporters/${transporter.id}/rating`,
      token: farmerToken
    });
    assert.strictEqual(ratingRes.status, 200);
    assert.strictEqual(ratingRes.body.success, true);
    assert(ratingRes.body.data.rating >= 4.8);
    assert.strictEqual(ratingRes.body.data.totalRatings, 2);
    assert(ratingRes.body.data.reviews.length >= 1);
    console.log(`  ✅ [PASS] Transporter score updated to ${ratingRes.body.data.rating}★ across ${ratingRes.body.data.totalRatings} ratings`);

    console.log("\n======================================================");
    console.log("🎉 ALL FREIGHT ESCROW & DRIVER RATING TESTS PASSED!");
    console.log("======================================================\n");
  } finally {
    await stopServer();
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
