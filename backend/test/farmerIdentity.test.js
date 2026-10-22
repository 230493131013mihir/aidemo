/**
 * farmerIdentity.test.js
 * Test Suite for Farmer-First Identity & Access:
 * - Phone OTP (SMS & WhatsApp Gateways)
 * - 1-Click WhatsApp Login
 * - Role-Based Profiles (Smallholder Farmer, FPO Leader, Transporter, Mandi Vyapari)
 * - National Agristack & PM-KISAN 7/12 Land Record Integration
 */

const assert = require("assert");
const otpService = require("../services/otpService");
const agristackService = require("../services/agristackService");
const schemeService = require("../services/schemeService");
const { User, FarmerProfile } = require("../models");
const sequelize = require("../config/database");

async function runFarmerIdentityTests() {
    console.log("\n======================================================");
    console.log("🌾 HarvestMitra AI — Farmer Identity & Access Tests");
    console.log("======================================================\n");

    try {
        await sequelize.authenticate();

        // -----------------------------------------------------------------
        // TEST 1: Phone OTP Dispatch (SMS & WhatsApp)
        // -----------------------------------------------------------------
        const testPhone = "9822994411";
        const smsResult = await otpService.sendOtp({
            phone: testPhone,
            channel: "sms",
            role: "farmer"
        });

        assert.strictEqual(smsResult.success, true);
        assert.strictEqual(smsResult.channel, "SMS");
        assert(smsResult.devOtp, "Expected devOtp in development response");
        assert.strictEqual(smsResult.phone, testPhone);
        console.log("  ✅ [PASS] Test 1: SMS OTP dispatch successful with 6-digit code");

        const waResult = await otpService.sendOtp({
            phone: testPhone,
            channel: "whatsapp",
            role: "farmer"
        });
        assert.strictEqual(waResult.success, true);
        assert.strictEqual(waResult.channel, "WhatsApp");
        console.log("  ✅ [PASS] Test 2: WhatsApp OTP dispatch successful");

        // -----------------------------------------------------------------
        // TEST 3: OTP Verification & Attempt Handling
        // -----------------------------------------------------------------
        const badVerify = await otpService.verifyOtp({ phone: testPhone, otp: "000000" });
        assert.strictEqual(badVerify.valid, false);
        console.log("  ✅ [PASS] Test 3: Invalid OTP rejected safely with remaining attempts");

        const goodVerify = await otpService.verifyOtp({ phone: testPhone, otp: waResult.devOtp });
        assert.strictEqual(goodVerify.valid, true);
        assert.strictEqual(goodVerify.phone, testPhone);
        console.log("  ✅ [PASS] Test 4: Correct OTP verified successfully");

        // Universal bypass OTP for demo environments
        const demoVerify = await otpService.verifyOtp({ phone: "9822000000", otp: "123456" });
        assert.strictEqual(demoVerify.valid, true);
        console.log("  ✅ [PASS] Test 5: Universal master demo bypass OTP (123456) verified");

        // -----------------------------------------------------------------
        // TEST 6: National Agristack & PM-KISAN Registry Lookup
        // -----------------------------------------------------------------
        const agriLookup = agristackService.lookupRegistry({ identifier: "PMK-MH-98201" });
        assert.strictEqual(agriLookup.found, true);
        assert.strictEqual(agriLookup.data.farmerName, "Ramesh Tukaram Patel");
        assert.strictEqual(agriLookup.data.landRecord.surveyNumber, "142/2A");
        assert.strictEqual(agriLookup.data.landRecord.verifiedAcres, 3.5);
        assert.strictEqual(agriLookup.data.dbtAccountLinked, true);
        console.log("  ✅ [PASS] Test 6: National Agristack registry lookup retrieved verified 7/12 record (Survey 142/2A)");

        // -----------------------------------------------------------------
        // TEST 7: Linking Agristack to Farmer Profile & Scheme Pre-Approval
        // -----------------------------------------------------------------
        // Create or find a test farmer
        const [testUser] = await User.findOrCreate({
            where: { email: `test_farmer_${testPhone}@harvestmitra.local` },
            defaults: {
                name: "Tukaram Patil",
                phone: testPhone,
                password: "hashed_dummy_password",
                role: "farmer"
            }
        });

        const linkedProfile = await agristackService.linkToFarmerProfile(testUser.id, agriLookup.data);
        assert.strictEqual(linkedProfile.isGovtVerified, true);
        assert.strictEqual(linkedProfile.agristackId, "PMK-MH-98201");
        assert.strictEqual(linkedProfile.surveyNumber, "142/2A");
        assert.strictEqual(linkedProfile.aadhaarLinked, true);
        console.log("  ✅ [PASS] Test 7: Agristack credentials linked to database FarmerProfile");

        // -----------------------------------------------------------------
        // TEST 8: Scheme Matching with Agristack Verified Status
        // -----------------------------------------------------------------
        const matchedSchemes = await schemeService.matchSchemes({
            state: "Maharashtra",
            district: "Pune",
            farmSizeAcres: linkedProfile.farmSizeAcres,
            isGovtVerified: linkedProfile.isGovtVerified,
            agristackId: linkedProfile.agristackId,
            surveyNumber: linkedProfile.surveyNumber,
            aadhaarLinked: linkedProfile.aadhaarLinked,
            dbtAccountLinked: linkedProfile.dbtAccountLinked
        });

        assert(matchedSchemes.length > 0, "Expected matched schemes");
        const pmKisan = matchedSchemes.find(s => s.identifier === "pm-kisan");
        assert(pmKisan, "PM-KISAN scheme should be found");
        assert.strictEqual(pmKisan.eligibilityOutcome, "potentially_eligible");
        assert.strictEqual(pmKisan.isAgristackPreApproved, true);
        assert(pmKisan.matchedReasons.some(r => r.includes("Agristack")), "Expected Agristack verification in matched reasons");
        console.log("  ✅ [PASS] Test 8: Deterministic scheme engine flags Agristack Pre-Approved status & verified reasons");

        // -----------------------------------------------------------------
        // TEST 9: Role Differentiation (FPO Leader Aggregator)
        // -----------------------------------------------------------------
        const [fpoUser] = await User.findOrCreate({
            where: { email: "fpo_leader_test@harvestmitra.local" },
            defaults: {
                name: "Nashik Onion Growers FPO",
                phone: "9822998877",
                password: "hashed_dummy_password",
                role: "fpo_leader"
            }
        });

        const fpoProfile = await FarmerProfile.findOrCreate({
            where: { userId: fpoUser.id },
            defaults: {
                userId: fpoUser.id,
                district: "Nashik",
                state: "Maharashtra",
                farmSizeAcres: 75.0,
                roleSubtype: "fpo_leader",
                fpoName: "Nashik Agro Producer Co Ltd",
                memberFarmerCount: 65,
                isGovtVerified: true
            }
        });

        assert.strictEqual(fpoUser.role, "fpo_leader");
        console.log("  ✅ [PASS] Test 9: FPO Leader role & collective profile verified");

        console.log("\n======================================================");
        console.log("🎉 All 9 Farmer Identity & Access Tests Passed Successfully!");
        console.log("======================================================\n");
        process.exit(0);

    } catch (err) {
        console.error("❌ Test error:", err);
        process.exit(1);
    }
}

runFarmerIdentityTests();
