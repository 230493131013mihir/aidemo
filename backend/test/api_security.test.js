/**
 * api_security.test.js
 * JWT Authentication & Role-Based Access Control Security Tests
 * HarvestMitra AI — ISSUE-05, ISSUE-07, ISSUE-09
 *
 * Tests:
 *   1. POST /api/auth/login returns a valid JWT token for demo farmer
 *   2. POST /api/auth/login returns a valid JWT token for admin
 *   3. GET  /api/admin/users with farmer token → 403 Forbidden
 *   4. GET  /api/admin/users with admin token → 200 OK + user list
 *   5. GET  /api/admin/overview with farmer token → 403 Forbidden
 *   6. GET  /api/admin/overview with admin token → 200 OK + stats
 *   7. GET  /api/auth/me with valid farmer token → 200 OK
 *   8. GET  /api/auth/me with no token → 401 Unauthorized
 *   9. GET  /api/admin/users with invalid/garbage token → 401 Unauthorized
 */

const assert = require("assert");
const http = require("http");
process.env.JWT_SECRET = process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon";
const app = require("../app");

// ---------------------------------------------------------------------------
// Shared HTTP helper (same pattern as chatApi.test.js)
// ---------------------------------------------------------------------------
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

function makeRequest({ method = "GET", path = "/", body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const reqHeaders = {
      ...headers,
      ...(payload
        ? {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          }
        : {}),
    };

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: serverPort,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Test variables
// ---------------------------------------------------------------------------
let farmerToken = null;
let adminToken = null;

// Use demo seeded credentials
const FARMER_CREDENTIALS = {
  email: "demo@harvestmitra.local",
  password: "Demo@12345",
};

const ADMIN_CREDENTIALS = {
  email: "admin@harvestmitra.local",
  password: "Admin@12345",
};

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------
async function runSecurityTests() {
  console.log("\n======================================================");
  console.log("🔐 HarvestMitra AI — API Security & RBAC Tests");
  console.log("======================================================\n");

  let passed = 0;
  let failed = 0;

  function pass(msg) {
    passed++;
    console.log(`  ✅ [PASS] ${msg}`);
  }

  function fail(msg, err) {
    failed++;
    console.error(`  ❌ [FAIL] ${msg}`);
    if (err) console.error(`         →  ${err}`);
  }

  const bcrypt = require("bcryptjs");
  const sequelize = require("../config/database");
  const { User } = require("../models");
  const seed = require("../seed");

  // Ensure test database is connected and synchronized
  await sequelize.authenticate();
  await sequelize.sync();
  try {
    const migrateIdentity = require("../scripts/migrate-identity");
    if (typeof migrateIdentity === "function") await migrateIdentity();
  } catch (mErr) {
    // ignore
  }

  // Ensure demo and admin accounts are properly seeded and match test credentials
  let adminUser = await User.findOne({ where: { email: ADMIN_CREDENTIALS.email } });
  let farmerUser = await User.findOne({ where: { email: FARMER_CREDENTIALS.email } });

  if (!adminUser || !farmerUser) {
    if (typeof seed === "function") {
      await seed();
    }
    adminUser = await User.findOne({ where: { email: ADMIN_CREDENTIALS.email } });
    farmerUser = await User.findOne({ where: { email: FARMER_CREDENTIALS.email } });
  }

  if (adminUser) {
    const isMatch = await bcrypt.compare(ADMIN_CREDENTIALS.password, adminUser.password);
    if (!isMatch) {
      adminUser.password = await bcrypt.hash(ADMIN_CREDENTIALS.password, 10);
      adminUser.role = "admin";
      await adminUser.save();
    }
  }

  if (farmerUser) {
    const isMatch = await bcrypt.compare(FARMER_CREDENTIALS.password, farmerUser.password);
    if (!isMatch) {
      farmerUser.password = await bcrypt.hash(FARMER_CREDENTIALS.password, 10);
      farmerUser.role = "farmer";
      await farmerUser.save();
    }
  }

  await startServer();

  try {
    // -----------------------------------------------------------------
    // TEST 1: Farmer login returns JWT token
    // -----------------------------------------------------------------
    try {
      const res = await makeRequest({
        method: "POST",
        path: "/api/auth/login",
        body: FARMER_CREDENTIALS,
      });

      assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
      assert.strictEqual(res.data.success, true, "Login should succeed");
      assert.ok(res.data.token, "Response must include a JWT token");
      assert.ok(res.data.token.split(".").length === 3, "Token must be a valid JWT (3 segments)");

      farmerToken = res.data.token;
      pass("POST /api/auth/login (farmer) → 200 with valid JWT");
    } catch (err) {
      fail("POST /api/auth/login (farmer) → 200 with valid JWT", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 2: Admin login returns JWT token
    // -----------------------------------------------------------------
    try {
      const res = await makeRequest({
        method: "POST",
        path: "/api/auth/login",
        body: ADMIN_CREDENTIALS,
      });

      assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
      assert.strictEqual(res.data.success, true, "Login should succeed");
      assert.ok(res.data.token, "Response must include a JWT token");
      assert.ok(res.data.token.split(".").length === 3, "Token must be a valid JWT (3 segments)");
      assert.strictEqual(res.data.user.role, "admin", "User role should be admin");

      adminToken = res.data.token;
      pass("POST /api/auth/login (admin) → 200 with valid JWT & admin role");
    } catch (err) {
      fail("POST /api/auth/login (admin) → 200 with valid JWT & admin role", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 3: GET /api/admin/users with farmer token → 403 Forbidden
    // -----------------------------------------------------------------
    try {
      assert.ok(farmerToken, "Farmer token required; login test must pass first");

      const res = await makeRequest({
        method: "GET",
        path: "/api/admin/users",
        headers: { Authorization: `Bearer ${farmerToken}` },
      });

      assert.strictEqual(res.statusCode, 403, `Expected 403 Forbidden, got ${res.statusCode}`);
      assert.strictEqual(res.data.success, false, "success should be false");
      pass("GET /api/admin/users (farmer token) → 403 Forbidden");
    } catch (err) {
      fail("GET /api/admin/users (farmer token) → 403 Forbidden", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 4: GET /api/admin/users with admin token → 200 OK + user list
    // -----------------------------------------------------------------
    try {
      assert.ok(adminToken, "Admin token required; login test must pass first");

      const res = await makeRequest({
        method: "GET",
        path: "/api/admin/users",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
      assert.strictEqual(res.data.success, true, "success should be true");
      assert.ok(Array.isArray(res.data.data), "Response data must be an array of users");
      assert.ok(res.data.data.length > 0, "At least one user should exist (seeded data)");

      // Verify password is never leaked
      for (const user of res.data.data) {
        assert.strictEqual(user.password, undefined, "Password must never be exposed in API response");
      }

      pass("GET /api/admin/users (admin token) → 200 OK with user list (no passwords leaked)");
    } catch (err) {
      fail("GET /api/admin/users (admin token) → 200 OK with user list", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 5: GET /api/admin/overview with farmer token → 403 Forbidden
    // -----------------------------------------------------------------
    try {
      assert.ok(farmerToken, "Farmer token required");

      const res = await makeRequest({
        method: "GET",
        path: "/api/admin/overview",
        headers: { Authorization: `Bearer ${farmerToken}` },
      });

      assert.strictEqual(res.statusCode, 403, `Expected 403, got ${res.statusCode}`);
      pass("GET /api/admin/overview (farmer token) → 403 Forbidden");
    } catch (err) {
      fail("GET /api/admin/overview (farmer token) → 403 Forbidden", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 6: GET /api/admin/overview with admin token → 200 OK + stats
    // -----------------------------------------------------------------
    try {
      assert.ok(adminToken, "Admin token required");

      const res = await makeRequest({
        method: "GET",
        path: "/api/admin/overview",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
      assert.strictEqual(res.data.success, true);
      assert.ok(typeof res.data.data.users === "number", "Overview must include user count");
      assert.ok(typeof res.data.data.markets === "number", "Overview must include market count");
      pass("GET /api/admin/overview (admin token) → 200 OK with system stats");
    } catch (err) {
      fail("GET /api/admin/overview (admin token) → 200 OK with system stats", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 7: GET /api/auth/me with valid farmer token → 200 OK
    // -----------------------------------------------------------------
    try {
      assert.ok(farmerToken, "Farmer token required");

      const res = await makeRequest({
        method: "GET",
        path: "/api/auth/me",
        headers: { Authorization: `Bearer ${farmerToken}` },
      });

      assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.user, "Response must include user object");
      assert.ok(res.data.user.id, "User must have an id");
      assert.strictEqual(res.data.user.password, undefined, "Password must not be exposed");
      pass("GET /api/auth/me (valid token) → 200 OK with user profile");
    } catch (err) {
      fail("GET /api/auth/me (valid token) → 200 OK with user profile", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 8: GET /api/auth/me with no token → 401 Unauthorized
    // -----------------------------------------------------------------
    try {
      const res = await makeRequest({
        method: "GET",
        path: "/api/auth/me",
      });

      assert.strictEqual(res.statusCode, 401, `Expected 401, got ${res.statusCode}`);
      assert.strictEqual(res.data.success, false);
      pass("GET /api/auth/me (no token) → 401 Unauthorized");
    } catch (err) {
      fail("GET /api/auth/me (no token) → 401 Unauthorized", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 9: GET /api/admin/users with garbage token → 401 Unauthorized
    // -----------------------------------------------------------------
    try {
      const res = await makeRequest({
        method: "GET",
        path: "/api/admin/users",
        headers: { Authorization: "Bearer this.is.garbage" },
      });

      assert.strictEqual(res.statusCode, 401, `Expected 401, got ${res.statusCode}`);
      assert.strictEqual(res.data.success, false);
      pass("GET /api/admin/users (garbage token) → 401 Unauthorized");
    } catch (err) {
      fail("GET /api/admin/users (garbage token) → 401 Unauthorized", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 10: POST /api/chat/message with no token → 401 Unauthorized
    // -----------------------------------------------------------------
    try {
      const res = await makeRequest({
        method: "POST",
        path: "/api/chat/message",
        body: { message: "Hello" }
      });
      assert.strictEqual(res.statusCode, 401, `Expected 401, got ${res.statusCode}`);
      pass("POST /api/chat/message (no token) → 401 Unauthorized");
    } catch (err) {
      fail("POST /api/chat/message (no token) → 401 Unauthorized", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 11: GET /api/reports/farm-decision with no token → 401 Unauthorized
    // -----------------------------------------------------------------
    try {
      const res = await makeRequest({
        method: "GET",
        path: "/api/reports/farm-decision",
      });
      assert.strictEqual(res.statusCode, 401, `Expected 401, got ${res.statusCode}`);
      pass("GET /api/reports/farm-decision (no token) → 401 Unauthorized");
    } catch (err) {
      fail("GET /api/reports/farm-decision (no token) → 401 Unauthorized", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 12: POST /api/market/sync with no token → 401 Unauthorized
    // -----------------------------------------------------------------
    try {
      const res = await makeRequest({
        method: "POST",
        path: "/api/market/sync",
      });
      assert.strictEqual(res.statusCode, 401, `Expected 401, got ${res.statusCode}`);
      pass("POST /api/market/sync (no token) → 401 Unauthorized");
    } catch (err) {
      fail("POST /api/market/sync (no token) → 401 Unauthorized", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 13: POST /api/market/sync with farmer token → 403 Forbidden
    // -----------------------------------------------------------------
    try {
      assert.ok(farmerToken, "Farmer token required");
      const res = await makeRequest({
        method: "POST",
        path: "/api/market/sync",
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      assert.strictEqual(res.statusCode, 403, `Expected 403, got ${res.statusCode}`);
      pass("POST /api/market/sync (farmer token) → 403 Forbidden");
    } catch (err) {
      fail("POST /api/market/sync (farmer token) → 403 Forbidden", err.message);
    }

    // -----------------------------------------------------------------
    // TEST 14: POST /api/market/sync with admin token → 200 OK
    // -----------------------------------------------------------------
    try {
      assert.ok(adminToken, "Admin token required");
      const res = await makeRequest({
        method: "POST",
        path: "/api/market/sync",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
      pass("POST /api/market/sync (admin token) → 200 OK");
    } catch (err) {
      fail("POST /api/market/sync (admin token) → 200 OK", err.message);
    }
  } finally {
    await stopServer();
  }

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  console.log("\n======================================================");
  if (failed === 0) {
    console.log(`🎉 All ${passed} API Security Tests Passed!`);
  } else {
    console.log(`⚠️  ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  }
  console.log("======================================================\n");

  if (failed > 0) process.exit(1);
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------
if (require.main === module) {
  runSecurityTests().catch((err) => {
    console.error("Fatal security test error:", err);
    process.exit(1);
  });
}

module.exports = { runSecurityTests };
