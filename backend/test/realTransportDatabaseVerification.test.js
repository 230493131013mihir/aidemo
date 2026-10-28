/**
 * realTransportDatabaseVerification.test.js
 * Comprehensive Verification Suite for Real Database-Backed Transport Records
 * HarvestMitra AI
 */

const assert = require("assert");
const http = require("http");
const app = require("../app");
const sequelize = require("../config/database");
const { Vehicle, User, TransporterProfile, TransportRequest } = require("../models");

function makeRequest(port, method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: "127.0.0.1",
            port,
            path,
            method,
            headers: {
                "Content-Type": "application/json",
                ...headers
            }
        }, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, headers: res.headers, data: parsed });
            });
        });
        req.on("error", reject);
        if (body) {
            req.write(typeof body === "string" ? body : JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log("\n==================================================================");
    console.log("🚚 Real Database Transport Source of Truth — Verification Suite");
    console.log("==================================================================\n");

    await sequelize.authenticate();

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;

    try {
        // Create an isolated farmer token for API calls
        const farmerUser = await User.findOrCreate({
            where: { email: "transport_audit_farmer@harvestmitra.local" },
            defaults: {
                name: "Transport Audit Farmer",
                email: "transport_audit_farmer@harvestmitra.local",
                phone: "9822998877",
                password: "HashedPassword123",
                role: "farmer"
            }
        });

        const jwt = require("jsonwebtoken");
        const token = jwt.sign(
            { id: farmerUser[0].id, email: farmerUser[0].email, role: farmerUser[0].role },
            process.env.JWT_SECRET || "harvestmitra_jwt_super_secret_dev_key_2026",
            { expiresIn: "1h" }
        );

        // TEST 1: Default production GET /api/transport/vehicles excludes seed demo records
        console.log("TEST 1: Production query excludes seeded demo account records...");
        const resProd = await makeRequest(port, "GET", "/api/transport/vehicles", null, {
            Authorization: `Bearer ${token}`
        });

        assert.strictEqual(resProd.status, 200, "Must return 200 OK");
        assert.strictEqual(resProd.data.success, true, "Response must indicate success");
        assert.ok(Array.isArray(resProd.data.data), "data must be an array");

        const hasDemoPatil = resProd.data.data.some(v => 
            v.User?.email === "transporter@harvestmitra.local" || v.driverName === "Santosh More"
        );
        assert.strictEqual(hasDemoPatil, false, "Production listing must NOT contain demo seeded vehicles (Rajesh Patil / Santosh More)");
        console.log(`  ✅ [PASS] Production query returned ${resProd.data.data.length} real verified vehicles. 0 demo records included.`);

        // TEST 2: Prem and Warule are returned as genuine database records
        console.log("\nTEST 2: Verifying Prem and Warule appear from database...");
        const prem = resProd.data.data.find(v => v.driverName?.toLowerCase() === "prem");
        const warule = resProd.data.data.find(v => v.driverName?.toLowerCase() === "warule");

        assert.ok(prem, "Prem must be returned by the database-backed API");
        assert.strictEqual(prem.registrationNumber, "MH-12-AB-1212", "Prem registration must match database");
        assert.strictEqual(prem.capacityKg, 2000, "Prem capacity must match database value");

        assert.ok(warule, "Warule must be returned by the database-backed API");
        assert.strictEqual(warule.registrationNumber, "MH-19-JK=6789", "Warule registration must match database");
        assert.strictEqual(warule.capacityKg, 2000, "Warule capacity must match database value");
        console.log("  ✅ [PASS] Prem (MH-12-AB-1212) and Warule (MH-19-JK=6789) verified directly from database.");

        // TEST 3: Deduplication — No duplicate vehicle IDs in returned list
        console.log("\nTEST 3: Verifying zero duplicate vehicles in API response...");
        const ids = resProd.data.data.map(v => v.id);
        const uniqueIds = new Set(ids);
        assert.strictEqual(ids.length, uniqueIds.size, "Every returned vehicle must have a unique ID (no duplicate joins)");
        console.log(`  ✅ [PASS] All ${ids.length} returned vehicle records have unique, stable database IDs.`);

        // TEST 4: Explicit includeDemo=true allows demo records for testing
        console.log("\nTEST 4: Explicit includeDemo=true includes demo fleet...");
        const resDemo = await makeRequest(port, "GET", "/api/transport/vehicles?includeDemo=true", null, {
            Authorization: `Bearer ${token}`
        });
        assert.strictEqual(resDemo.status, 200);
        const hasDemoInDemoMode = resDemo.data.data.some(v => v.driverName === "Rajesh Patil");
        assert.strictEqual(hasDemoInDemoMode, true, "includeDemo=true should include demo fleet when explicitly requested");
        console.log(`  ✅ [PASS] Demo mode correctly returned ${resDemo.data.data.length} vehicles including demo fleet.`);

        // TEST 5: Active Booking correctly reserves capacity from vehicle
        console.log("\nTEST 5: Capacity reservation calculation...");
        // Book 500 kg on Prem's vehicle
        const testBooking = await TransportRequest.create({
            bookingId: `BK-TEST-${Date.now()}`,
            userId: farmerUser[0].id,
            farmerName: "Transport Audit Farmer",
            cropName: "Tomato",
            pickupLocation: "Pune, Maharashtra",
            destinationMarket: "Mumbai Vashi APMC",
            pickupDate: new Date().toISOString().slice(0, 10),
            weightKg: 500,
            vehicleId: prem.id,
            vehicleNumber: prem.registrationNumber,
            driverName: prem.driverName,
            status: "accepted"
        });

        const resAfterBooking = await makeRequest(port, "GET", `/api/transport/vehicles`, null, {
            Authorization: `Bearer ${token}`
        });

        const premAfter = resAfterBooking.data.data.find(v => v.id === prem.id);
        assert.ok(premAfter, "Prem vehicle still available for remaining capacity");
        assert.strictEqual(premAfter.bookedWeightKg, 500, "Booked weight must reflect active 500 kg reservation");
        assert.strictEqual(premAfter.remainingCapacityKg, 1500, "Remaining capacity must be 2000 - 500 = 1500 kg");
        console.log(`  ✅ [PASS] Prem capacity updated: 2000 kg total - 500 kg booked = ${premAfter.remainingCapacityKg} kg remaining.`);

        // Clean up test booking
        await testBooking.destroy();

        // TEST 6: POST /api/transport/match uses real database vehicles and excludes demo
        console.log("\nTEST 6: POST /api/transport/match excludes demo records...");
        const resMatch = await makeRequest(port, "POST", "/api/transport/match", {
            farmerName: "Audit Farmer",
            location: "Pune",
            destination: "Mumbai Vashi Mega APMC",
            quantity: 500,
            crop: "Tomato"
        }, {
            Authorization: `Bearer ${token}`
        });

        assert.strictEqual(resMatch.status, 200);
        assert.ok(Array.isArray(resMatch.data.matches), "Matches must be an array");
        const hasDemoInMatch = resMatch.data.matches.some(m => m.driverName === "Santosh More" || m.driverName === "Rajesh Patil");
        assert.strictEqual(hasDemoInMatch, false, "Production match must NOT include demo vehicles");
        console.log(`  ✅ [PASS] POST /api/transport/match verified: ${resMatch.data.matches.length} matches, 0 demo records.`);

        // TEST 7: Backend Health Check for NetworkStatusBadge
        console.log("\nTEST 7: GET /api/health returns ok for live status badge...");
        const resHealth = await makeRequest(port, "GET", "/api/health");
        assert.strictEqual(resHealth.status, 200);
        assert.strictEqual(resHealth.data.status, "ok");
        console.log("  ✅ [PASS] GET /api/health returned status: 'ok'. Network status badge correctly validates connectivity.");

        console.log("\n==================================================================");
        console.log("🎉 ALL 7 REAL TRANSPORT DATABASE VERIFICATION TESTS PASSED!");
        console.log("==================================================================\n");

    } finally {
        server.close();
    }
}

runTests().then(() => process.exit(0)).catch(e => {
    console.error("Test failure:", e);
    process.exit(1);
});
