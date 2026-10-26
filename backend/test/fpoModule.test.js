const http = require('http');
const path = require('path');
const assert = require('assert');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const app = require('../app');
const { 
  User, 
  FarmerProfile, 
  MandiProfile, 
  FpoMembership, 
  CropAggregation, 
  AggregationItem, 
  FpoProcurementOffer, 
  TransportRequest 
} = require('../models');

async function runTests() {
  console.log('\n======================================================');
  console.log('🌾 HarvestMitra AI — Complete FPO Module Test Suite');
  console.log('======================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const secret = process.env.JWT_SECRET || 'harvestmitra_secret';

  // 1. Setup Test Users
  // FPO Leader
  let fpoUser = await User.findOne({ where: { email: 'fpo_test_leader@harvestmitra.test' } });
  if (!fpoUser) {
    fpoUser = await User.create({
      name: 'Nashik Agro FPO Leader',
      email: 'fpo_test_leader@harvestmitra.test',
      phone: '9822990001',
      password: 'testpassword',
      role: 'fpo_leader'
    });
    await FarmerProfile.create({
      userId: fpoUser.id,
      fpoName: 'Nashik Agro Producers Cooperative',
      fpoRegistrationNumber: 'FPO-MH-NSK-2024-TEST',
      district: 'Nashik',
      state: 'Maharashtra',
      village: 'Niphad',
      farmSizeAcres: 50.0,
      mainCrop: 'Onion, Tomato',
      roleSubtype: 'fpo_leader'
    });
  }

  // Member Farmer 1
  let memberFarmer1 = await User.findOne({ where: { email: 'fpo_farmer_member_1@harvestmitra.test' } });
  if (!memberFarmer1) {
    memberFarmer1 = await User.create({
      name: 'Balasaheb Shinde',
      email: 'fpo_farmer_member_1@harvestmitra.test',
      phone: '9822990002',
      password: 'testpassword',
      role: 'farmer'
    });
    await FarmerProfile.create({
      userId: memberFarmer1.id,
      district: 'Nashik',
      state: 'Maharashtra',
      village: 'Pimpalgaon',
      farmSizeAcres: 5.0,
      mainCrop: 'Onion',
      productQuantities: JSON.stringify({ Onion: { qty: 2500, unit: 'kg' } })
    });
  }

  // Member Farmer 2
  let memberFarmer2 = await User.findOne({ where: { email: 'fpo_farmer_member_2@harvestmitra.test' } });
  if (!memberFarmer2) {
    memberFarmer2 = await User.create({
      name: 'Ganesh Jadhav',
      email: 'fpo_farmer_member_2@harvestmitra.test',
      phone: '9822990003',
      password: 'testpassword',
      role: 'farmer'
    });
    await FarmerProfile.create({
      userId: memberFarmer2.id,
      district: 'Nashik',
      state: 'Maharashtra',
      village: 'Lasalgaon',
      farmSizeAcres: 6.5,
      mainCrop: 'Onion',
      productQuantities: JSON.stringify({ Onion: { qty: 3500, unit: 'kg' } })
    });
  }

  // Non-member Regular Farmer (for RBAC & invite test)
  let nonMemberFarmer = await User.findOne({ where: { email: 'fpo_non_member@harvestmitra.test' } });
  if (!nonMemberFarmer) {
    nonMemberFarmer = await User.create({
      name: 'Sunil Pawar',
      email: 'fpo_non_member@harvestmitra.test',
      phone: '9822990004',
      password: 'testpassword',
      role: 'farmer'
    });
    await FarmerProfile.create({
      userId: nonMemberFarmer.id,
      district: 'Nashik',
      state: 'Maharashtra',
      village: 'Yeola',
      farmSizeAcres: 3.0,
      mainCrop: 'Tomato'
    });
  }

  // Mandi Official
  let mandiUser = await User.findOne({ where: { email: 'fpo_test_mandi@harvestmitra.test' } });
  if (!mandiUser) {
    mandiUser = await User.create({
      name: 'Vashi APMC Official',
      email: 'fpo_test_mandi@harvestmitra.test',
      phone: '9822990005',
      password: 'testpassword',
      role: 'mandi'
    });
    await MandiProfile.create({
      userId: mandiUser.id,
      mandiName: 'Vashi APMC (Navi Mumbai Wholesale Market)',
      licenseNumber: 'MH-VSH-2024-TEST',
      district: 'Thane',
      state: 'Maharashtra',
      facilities: 'Cold Storage, Electronic Auction, Bulk Weighbridge'
    });
  }

  // Ensure test idempotency: clear prior test memberships and aggregations for test users
  await FpoMembership.destroy({ where: { fpoId: fpoUser.id, farmerId: nonMemberFarmer.id } });
  await FpoProcurementOffer.destroy({ where: { fpoId: fpoUser.id } });
  await CropAggregation.destroy({ where: { fpoId: fpoUser.id } });

  // Ensure initial active membership for Farmer 1 and Farmer 2
  for (const f of [memberFarmer1, memberFarmer2]) {
    const existing = await FpoMembership.findOne({ where: { fpoId: fpoUser.id, farmerId: f.id } });
    if (!existing) {
      await FpoMembership.create({
        fpoId: fpoUser.id,
        farmerId: f.id,
        status: 'active',
        invitedBy: 'fpo',
        consentShareCrops: true,
        consentShareContact: true,
        joinedAt: new Date()
      });
    }
  }

  // Auth Tokens
  const fpoToken = jwt.sign({ id: fpoUser.id, email: fpoUser.email, role: fpoUser.role, name: fpoUser.name }, secret, { expiresIn: '1h' });
  const farmerToken = jwt.sign({ id: nonMemberFarmer.id, email: nonMemberFarmer.email, role: nonMemberFarmer.role, name: nonMemberFarmer.name }, secret, { expiresIn: '1h' });
  const mandiToken = jwt.sign({ id: mandiUser.id, email: mandiUser.email, role: mandiUser.role, name: mandiUser.name }, secret, { expiresIn: '1h' });

  let testsPassed = 0;
  let testsFailed = 0;

  function record(pass, msg) {
    if (pass) {
      testsPassed++;
      console.log(`  ✅ PASS: ${msg}`);
    } else {
      testsFailed++;
      console.error(`  ❌ FAIL: ${msg}`);
    }
  }

  // Helper fetch function
  async function api(endpoint, options = {}, token = fpoToken) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json };
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Strict RBAC Isolation
    // -------------------------------------------------------------------------
    console.log('--- 1. Testing Role-Based Access Control (RBAC) Isolation ---');
    const rbacRes = await api('/api/fpo/overview', {}, farmerToken);
    record(rbacRes.status === 403, `Regular farmer blocked with 403 Forbidden (got ${rbacRes.status})`);

    // -------------------------------------------------------------------------
    // TEST 2: FPO Overview Endpoint
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing FPO Overview Endpoint ---');
    const overviewRes = await api('/api/fpo/overview', {}, fpoToken);
    record(
      overviewRes.status === 200 && overviewRes.data.success && overviewRes.data.data.stats.totalMembers >= 2,
      `FPO overview returns real stats (Members: ${overviewRes.data.data?.stats?.totalMembers})`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Member Roster & Consent Masking
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Member Roster Listing & Privacy Protection ---');
    const rosterRes = await api('/api/fpo/members', {}, fpoToken);
    record(
      rosterRes.status === 200 && Array.isArray(rosterRes.data.data) && rosterRes.data.data.length >= 2,
      `Roster listed ${rosterRes.data.data?.length} member farmers`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Member Enrollment & Duplicate Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Member Enrollment & Duplicate Prevention ---');
    // Attempt duplicate addition of memberFarmer1
    const dupRes = await api('/api/fpo/members', {
      method: 'POST',
      body: JSON.stringify({ farmerId: memberFarmer1.id })
    }, fpoToken);
    record(dupRes.status === 409, `Duplicate member addition rejected with 409 Conflict (got ${dupRes.status})`);

    // Enroll new farmer
    const addRes = await api('/api/fpo/members', {
      method: 'POST',
      body: JSON.stringify({ farmerId: nonMemberFarmer.id, notes: 'Newly joined farmer' })
    }, fpoToken);
    record(
      addRes.status === 201 && addRes.data.success,
      `New member enrolled successfully: ${nonMemberFarmer.name}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Crop Availability & Uncommitted Stock Computation
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Member Crop Availability & Uncommitted Inventory ---');
    const cropAvailRes = await api('/api/fpo/crop-availability', {}, fpoToken);
    record(
      cropAvailRes.status === 200 && Array.isArray(cropAvailRes.data.data) && cropAvailRes.data.data.length > 0,
      `Calculated uncommitted stock for ${cropAvailRes.data.data?.length} farmer lots`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Aggregation Creation & Over-allocation Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Collective Lot Aggregation & Over-allocation Guard ---');
    // Attempt over-allocation (asking for 10,000 kg when farmer only has 2,500 kg)
    const overAllocRes = await api('/api/fpo/aggregations', {
      method: 'POST',
      body: JSON.stringify({
        cropName: 'Onion',
        expectedRatePerKg: 32,
        pickupDistrict: 'Nashik',
        items: [
          { farmerId: memberFarmer1.id, committedQuantityKg: 99999 }
        ]
      })
    }, fpoToken);
    record(
      overAllocRes.status === 400 && overAllocRes.data.message.includes('only has'),
      `Over-allocation prevented with 400 Bad Request: "${overAllocRes.data.message}"`
    );

    // Valid Aggregation pooling Farmer 1 and Farmer 2
    const aggRes = await api('/api/fpo/aggregations', {
      method: 'POST',
      body: JSON.stringify({
        cropName: 'Onion',
        variety: 'Garwa / Red Onion',
        grade: 'Grade A Export',
        expectedRatePerKg: 32.5,
        pickupDistrict: 'Nashik',
        pickupHub: 'Lasalgaon FPO Aggregation Hub',
        notes: 'Graded and cured onions in 50kg ventilated mesh bags.',
        items: [
          { farmerId: memberFarmer1.id, committedQuantityKg: 1000 },
          { farmerId: memberFarmer2.id, committedQuantityKg: 1500 }
        ]
      })
    }, fpoToken);

    record(
      aggRes.status === 201 && aggRes.data.data?.totalQuantityKg === 2500,
      `Pooled 2,500 kg Onion lot created (${aggRes.data.data?.aggregationCode})`
    );
    const createdAgg = aggRes.data.data;

    // -------------------------------------------------------------------------
    // TEST 7: Bulk Mandi Procurement Offer Submission
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Bulk Mandi Procurement Offer ---');
    const offerRes = await api('/api/fpo/offers', {
      method: 'POST',
      body: JSON.stringify({
        aggregationId: createdAgg.id,
        mandiId: mandiUser.id,
        mandiName: 'Vashi APMC (Navi Mumbai Wholesale Market)',
        requestedRatePerKg: 32.5,
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
        notes: 'Bulk consignment directly from farmer collective.'
      })
    }, fpoToken);

    record(
      offerRes.status === 201 && offerRes.data.data?.offerCode,
      `Dispatched bulk offer ${offerRes.data.data?.offerCode} for 2,500 kg to Vashi APMC`
    );
    const createdOffer = offerRes.data.data;

    // -------------------------------------------------------------------------
    // TEST 8: Mandi Counter-Quotation Submission
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing Mandi Official Counter-Quotation ---');
    const quoteRes = await api(`/api/fpo/offers/${createdOffer.id}/quote`, {
      method: 'PATCH',
      body: JSON.stringify({
        quotedRatePerKg: 31.0,
        mandiNotes: 'Accepted for Grade A Onion at ₹31.0/kg basis current market arrivals.'
      })
    }, mandiToken);

    record(
      quoteRes.status === 200 && quoteRes.data.data?.quotedRatePerKg === 31,
      `Mandi submitted counter-quotation of ₹31/kg (Status: ${quoteRes.data.data?.status})`
    );

    // -------------------------------------------------------------------------
    // TEST 9: FPO Leader Accepts Counter-Quotation (Contract Confirmation)
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Testing FPO Acceptance & Contract Confirmation ---');
    const acceptRes = await api(`/api/fpo/offers/${createdOffer.id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'accept' })
    }, fpoToken);

    const expectedGross = 31 * 2500; // ₹77,500
    record(
      acceptRes.status === 200 && 
      acceptRes.data.data?.status === 'confirmed' && 
      Number(acceptRes.data.data?.settlementAmount) === expectedGross,
      `Deal confirmed! Agreed Rate: ₹31/kg, Gross Contract Value: ₹${expectedGross.toLocaleString('en-IN')}`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Collective Transport Scheduling Integration
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Testing Collective Transport Scheduling Integration ---');
    const transportRes = await api('/api/fpo/transport', {
      method: 'POST',
      body: JSON.stringify({
        offerId: createdOffer.id,
        vehicleType: 'Tata 407 Agri LCV (3.5 MT)',
        pickupDate: new Date().toISOString().slice(0, 10),
        notes: 'Direct transit from Lasalgaon Hub to Vashi Mandi Gate No 2.'
      })
    }, fpoToken);

    record(
      transportRes.status === 201 && 
      transportRes.data.data?.transportRequest?.bookingType === 'fpo_collective' &&
      transportRes.data.data?.transportRequest?.bookingId,
      `Scheduled collective transport #${transportRes.data.data?.transportRequest?.id} (${transportRes.data.data?.transportRequest?.bookingId})`
    );

    // -------------------------------------------------------------------------
    // TEST 11: Orders History & Financial Transparency Breakdown
    // -------------------------------------------------------------------------
    console.log('\n--- 11. Testing Orders History & Financial Payout Ledger ---');
    const ordersRes = await api('/api/fpo/orders', {}, fpoToken);
    const targetOrder = ordersRes.data.data?.find(o => o.id === createdOffer.id);

    record(
      ordersRes.status === 200 && targetOrder !== undefined,
      `Order found in financial ledger with gross value ₹${targetOrder?.financials?.grossValue}`
    );

    if (targetOrder) {
      const breakdown = targetOrder.farmerBreakdown || [];
      const farmer1Share = breakdown.find(b => b.farmerId === memberFarmer1.id);
      const farmer2Share = breakdown.find(b => b.farmerId === memberFarmer2.id);

      record(
        farmer1Share && farmer2Share && (farmer1Share.sharePercentage + farmer2Share.sharePercentage === 100),
        `Proportional payout verified: Farmer 1 has ${farmer1Share?.sharePercentage}%, Farmer 2 has ${farmer2Share?.sharePercentage}%`
      );
      record(
        farmer1Share && farmer1Share.netPayable > 0 && farmer1Share.grossShare > farmer1Share.netPayable,
        `Transparent deductions: Farmer 1 Gross ₹${farmer1Share?.grossShare} - Freight ₹${farmer1Share?.transportShare} = Net ₹${farmer1Share?.netPayable}`
      );
    }

  } catch (err) {
    console.error('Unhandled test execution error:', err);
    testsFailed++;
  } finally {
    server.close();
  }

  console.log('\n======================================================');
  console.log(`🏁 FPO Module Test Summary: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
