/**
 * transporter_registration_db_fix.test.js
 * Comprehensive Integration & Verification Tests for:
 * 1. Database Connection Diagnostics & DNS ENOTFOUND handling
 * 2. Transporter Registration (Validation, Profile, Vehicle Fleet sync, Password Hashing)
 * 3. Duplicate Account & Vehicle Prevention
 * 4. Shared Farmer Registration & Login Verification
 * 5. Role Separation
 */

const assert = require("assert");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sequelize = require("../config/database");
const { User, TransporterProfile, FarmerProfile, Vehicle } = require("../models");
const app = require("../app");
const http = require("http");

async function makeRequest(port, method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = data ? JSON.stringify(data) : null;
        const options = {
            hostname: "127.0.0.1",
            port,
            path,
            method,
            headers: {
                "Content-Type": "application/json",
                ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = "";
            res.on("data", chunk => { body += chunk; });
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = body ? JSON.parse(body) : null;
                } catch {
                    parsed = body;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on("error", reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log("==================================================================");
    console.log("🚚 HarvestMitra AI — Transporter Registration & DB Fix Test Suite");
    console.log("==================================================================");

    // Ensure database connection is active
    await sequelize.authenticate();
    await sequelize.sync();

    const server = http.createServer(app);
    await new Promise(res => server.listen(0, "127.0.0.1", res));
    const port = server.address().port;

    try {
        // -------------------------------------------------------------
        // TEST 1: Diagnostic Error Formatter for ENOTFOUND / DNS Failure
        // -------------------------------------------------------------
        console.log("\n--- TEST 1: Database Error Diagnostic Formatter ---");
        const mockDnsError = new Error("getaddrinfo ENOTFOUND mysql-3da41197-mihir-7616.d.aivencloud.com");
        mockDnsError.code = "ENOTFOUND";
        mockDnsError.original = { code: "ENOTFOUND" };

        const formatted = sequelize.formatConnectionError(mockDnsError);
        assert(formatted.includes("ENOTFOUND"), "Should mention ENOTFOUND");
        assert(formatted.includes("Database Hostname Unresolvable"), "Should clearly state hostname is unresolvable");
        console.log("  ✅ PASS: Formatted DNS error clearly instructs user on hostname / provider status.");
        console.log(`     Output: "${formatted}"`);

        // -------------------------------------------------------------
        // TEST 2: Transporter Registration — Validation of Required Fields
        // -------------------------------------------------------------
        console.log("\n--- TEST 2: Transporter Registration Validation ---");
        // Missing name
        const resInvalidName = await makeRequest(port, "POST", "/api/auth/register", {
            email: "transporter_test@harvestmitra.local",
            phone: "9876543210",
            password: "password123",
            role: "transporter"
        });
        assert.strictEqual(resInvalidName.status, 400);
        assert(resInvalidName.data.message.includes("full name"));
        console.log("  ✅ PASS: Missing full name rejected with 400 Bad Request");

        // Invalid capacity
        const resInvalidCap = await makeRequest(port, "POST", "/api/auth/register", {
            name: "Rajesh Shinde",
            email: "transporter_test@harvestmitra.local",
            phone: "9876543210",
            password: "password123",
            role: "transporter",
            capacityKg: -500
        });
        assert.strictEqual(resInvalidCap.status, 400);
        assert(resInvalidCap.data.message.includes("capacity"));
        console.log("  ✅ PASS: Negative payload capacity rejected with 400 Bad Request");

        // -------------------------------------------------------------
        // TEST 3: Transporter Registration — Successful Creation
        // -------------------------------------------------------------
        console.log("\n--- TEST 3: Successful Transporter Registration ---");
        const testTimestamp = Date.now();
        const transporterEmail = `transporter_${testTimestamp}@test.local`;
        const transporterPhone = String(Math.floor(6000000000 + Math.random() * 3999999999));
        const transporterVehNum = `MH-14-TR-${Math.floor(1000 + Math.random() * 9000)}`;

        const regData = {
            name: "Ganesh Transport Fleet",
            email: transporterEmail,
            phone: transporterPhone,
            password: "securePassword123!",
            role: "transporter",
            district: "Pune",
            state: "Maharashtra",
            vehicleType: "Tata 407 Agri LCV",
            vehicleNumber: transporterVehNum,
            capacityKg: 3500,
            baseMandi: "Pune APMC",
            ratePerKm: 30
        };

        const resReg = await makeRequest(port, "POST", "/api/auth/register", regData);
        assert.strictEqual(resReg.status, 201, `Expected 201 Created but got ${resReg.status}: ${JSON.stringify(resReg.data)}`);
        assert.strictEqual(resReg.data.success, true);
        assert(resReg.data.token, "JWT token must be returned");
        assert.strictEqual(resReg.data.role, "transporter");

        const registeredUser = resReg.data.user;
        assert.strictEqual(registeredUser.name, "Ganesh Transport Fleet");
        assert.strictEqual(registeredUser.role, "transporter");
        assert(registeredUser.TransporterProfile, "TransporterProfile must be included");
        assert.strictEqual(registeredUser.TransporterProfile.vehicleNumber, transporterVehNum);
        assert.strictEqual(registeredUser.TransporterProfile.capacityKg, 3500);
        assert.strictEqual(registeredUser.TransporterProfile.baseMandi, "Pune APMC");
        assert.strictEqual(registeredUser.TransporterProfile.ratePerKm, 30);
        console.log("  ✅ PASS: Transporter registered with TransporterProfile and JWT token.");

        // Verify password was hashed in database
        const dbUser = await User.findByPk(registeredUser.id);
        assert(dbUser, "User must exist in DB");
        assert.notStrictEqual(dbUser.password, "securePassword123!", "Password must be hashed");
        const isMatch = await bcrypt.compare("securePassword123!", dbUser.password);
        assert.strictEqual(isMatch, true, "Hashed password must match input with bcrypt");
        console.log("  ✅ PASS: Password safely hashed with bcrypt (salt rounds: 10).");

        // Verify Vehicle fleet entry was created
        const dbVehicle = await Vehicle.findOne({ where: { registrationNumber: transporterVehNum } });
        assert(dbVehicle, "Initial Vehicle record must be created in vehicles table");
        assert.strictEqual(dbVehicle.userId, registeredUser.id);
        assert.strictEqual(dbVehicle.capacityKg, 3500);
        assert.strictEqual(dbVehicle.baseLocation, "Pune APMC");
        console.log("  ✅ PASS: Initial Vehicle fleet record linked and synchronized.");

        // -------------------------------------------------------------
        // TEST 4: Duplicate Prevention (Email, Phone, Vehicle Number)
        // -------------------------------------------------------------
        console.log("\n--- TEST 4: Duplicate Account & Vehicle Prevention ---");
        // Duplicate email
        const resDupEmail = await makeRequest(port, "POST", "/api/auth/register", {
            ...regData,
            phone: String(Math.floor(6000000000 + Math.random() * 3999999999)),
            vehicleNumber: `MH-14-TR-${Math.floor(1000 + Math.random() * 9000)}`
        });
        assert.strictEqual(resDupEmail.status, 409);
        assert(resDupEmail.data.message.includes("email address is already registered"));
        console.log("  ✅ PASS: Duplicate email rejected with 409 Conflict");

        // Duplicate phone
        const resDupPhone = await makeRequest(port, "POST", "/api/auth/register", {
            ...regData,
            email: `another_${Date.now()}@test.local`,
            vehicleNumber: `MH-14-TR-${Math.floor(1000 + Math.random() * 9000)}`
        });
        assert.strictEqual(resDupPhone.status, 409);
        assert(resDupPhone.data.message.includes("mobile number is already registered"));
        console.log("  ✅ PASS: Duplicate phone rejected with 409 Conflict");

        // Duplicate vehicle registration number
        const resDupVeh = await makeRequest(port, "POST", "/api/auth/register", {
            ...regData,
            email: `fresh_${Date.now()}@test.local`,
            phone: String(Math.floor(6000000000 + Math.random() * 3999999999)),
            vehicleNumber: transporterVehNum
        });
        assert.strictEqual(resDupVeh.status, 409);
        assert(resDupVeh.data.message.includes("already registered"));
        console.log("  ✅ PASS: Duplicate vehicle number rejected with 409 Conflict");

        // -------------------------------------------------------------
        // TEST 5: Farmer Registration on Shared Database Configuration
        // -------------------------------------------------------------
        console.log("\n--- TEST 5: Farmer Registration on Shared DB Config ---");
        const farmerEmail = `farmer_${Date.now()}@test.local`;
        const farmerPhone = String(Math.floor(6000000000 + Math.random() * 3999999999));

        const farmerData = {
            name: "Sopan Patil",
            email: farmerEmail,
            phone: farmerPhone,
            password: "farmerPass456!",
            role: "farmer",
            district: "Pune",
            state: "Maharashtra",
            village: "Khed",
            farmSizeAcres: 4.0,
            mainCrop: "Tomato, Onion",
            currentHarvestKg: 1200
        };

        const resFarmer = await makeRequest(port, "POST", "/api/auth/register", farmerData);
        assert.strictEqual(resFarmer.status, 201);
        assert.strictEqual(resFarmer.data.role, "farmer");
        assert(resFarmer.data.user.FarmerProfile, "FarmerProfile must be included");
        assert.strictEqual(resFarmer.data.user.FarmerProfile.district, "Pune");
        console.log("  ✅ PASS: Farmer registered successfully without impacting Transporter configuration.");

        // -------------------------------------------------------------
        // TEST 6: Login for Both Transporter and Farmer
        // -------------------------------------------------------------
        console.log("\n--- TEST 6: Login Verification for Both Roles ---");
        // Transporter Login via email
        const resTransLogin = await makeRequest(port, "POST", "/api/auth/login", {
            email: transporterEmail,
            password: "securePassword123!"
        });
        assert.strictEqual(resTransLogin.status, 200);
        assert.strictEqual(resTransLogin.data.user.role, "transporter");
        assert(resTransLogin.data.token, "JWT token must be present");
        console.log("  ✅ PASS: Transporter login successful.");

        // Farmer Login via phone
        const resFarmerLogin = await makeRequest(port, "POST", "/api/auth/login", {
            email: farmerPhone,
            password: "farmerPass456!"
        });
        assert.strictEqual(resFarmerLogin.status, 200);
        assert.strictEqual(resFarmerLogin.data.user.role, "farmer");
        assert(resFarmerLogin.data.token, "JWT token must be present");
        console.log("  ✅ PASS: Farmer login via mobile number successful.");

        // -------------------------------------------------------------
        // TEST 7: Role Separation & Protected Endpoints
        // -------------------------------------------------------------
        console.log("\n--- TEST 7: Role Separation & Protected Endpoints ---");
        // Transporter cannot access admin endpoints
        const resAdminBlock = await makeRequest(port, "GET", "/api/admin/overview", null, {
            Authorization: `Bearer ${resTransLogin.data.token}`
        });
        assert.strictEqual(resAdminBlock.status, 403, "Transporter should receive 403 Forbidden on admin endpoints");
        console.log("  ✅ PASS: Transporter blocked from admin endpoint (403 Forbidden).");

        // Transporter CAN access transporter-exclusive endpoints
        const resTransporterStats = await makeRequest(port, "GET", "/api/transport/transporter-stats", null, {
            Authorization: `Bearer ${resTransLogin.data.token}`
        });
        assert.strictEqual(resTransporterStats.status, 200, "Transporter should access transporter-stats with 200 OK");
        console.log("  ✅ PASS: Transporter successfully accessed transporter-stats endpoint.");

        const resOpenCargo = await makeRequest(port, "GET", "/api/transport/open-cargo", null, {
            Authorization: `Bearer ${resTransLogin.data.token}`
        });
        assert.strictEqual(resOpenCargo.status, 200, "Transporter should access open-cargo with 200 OK");
        console.log("  ✅ PASS: Transporter successfully accessed open-cargo market requests.");

        console.log("\n==================================================================");
        console.log("🎉 ALL 7 INTEGRATION TESTS PASSED WITH 100% SUCCESS!");
        console.log("==================================================================");

    } finally {
        server.close();
    }
}

runTests().catch(err => {
    console.error("❌ Test Suite Failure:", err);
    process.exit(1);
});
