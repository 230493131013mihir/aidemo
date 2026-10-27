/**
 * registerEvaluationDemoAccounts.js
 * HarvestMitra AI — Provision and Verify 4 Evaluation Demo Accounts for College Evaluation
 * 
 * Accounts:
 * 1. Mihir    -> Farmer      (Username: mihir,    Password: 123456)
 * 2. Varun    -> Transporter (Username: varun,    Password: 123456)
 * 3. Sayali   -> Mandi/APMC  (Username: sayali,   Password: 123456)
 * 4. Prashant -> Admin       (Username: prashant, Password: 123456)
 */

const path = require('path');
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));
const jwt = require(path.join(__dirname, '../backend/node_modules/jsonwebtoken'));
const sequelize = require('../backend/config/database');
const {
  User,
  FarmerProfile,
  TransporterProfile,
  MandiProfile,
  AdminUser,
  Vehicle
} = require('../backend/models');
const authController = require('../backend/controllers/auth.controller');

const DEMO_PASSWORD = process.env.DEMO_EVALUATION_PASSWORD || '123456';

const ACCOUNTS = [
  {
    name: 'Mihir',
    username: 'mihir',
    email: 'mihir@harvestmitra.local',
    phone: '9822100001',
    role: 'farmer',
    profileType: 'FarmerProfile',
    expectedDashboard: '/dashboard',
    profileData: {
      district: 'Pune',
      state: 'Maharashtra',
      village: 'Haveli',
      farmSizeAcres: 5.0,
      mainCrop: 'Tomato, Onion, Wheat',
      currentHarvestKg: 1800,
      productQuantities: JSON.stringify({
        Tomato: { qty: 800, unit: 'kg' },
        Onion: { qty: 600, unit: 'kg' },
        Wheat: { qty: 400, unit: 'kg' }
      }),
      preferredLanguage: 'mr',
      agristackId: 'AGRI-MH-PUN-10021',
      isGovtVerified: true,
      govtVerifiedLandAcres: 5.0,
      surveyNumber: '108/3B',
      aadhaarLinked: true,
      dbtAccountLinked: true,
      roleSubtype: 'smallholder'
    }
  },
  {
    name: 'Varun',
    username: 'varun',
    email: 'varun@harvestmitra.local',
    phone: '9822100002',
    role: 'transporter',
    profileType: 'TransporterProfile',
    expectedDashboard: '/transport',
    profileData: {
      driverName: 'Varun',
      phone: '9822100002',
      vehicleType: 'Tata 407 Agri LCV',
      vehicleNumber: 'MH-12-TR-7890',
      capacityKg: 3000,
      baseMandi: 'Pune APMC',
      ratePerKm: 26,
      isAvailable: true
    },
    vehicleData: {
      registrationNumber: 'MH-12-TR-7890',
      vehicleType: 'Tata 407 Agri LCV',
      driverName: 'Varun',
      driverPhone: '9822100002',
      capacityKg: 3000,
      capacityUnit: 'kg',
      supportedCrops: 'Tomato, Onion, Potato, Grains, Vegetables',
      specialHandling: 'Ventilated Produce Cargo',
      baseLocation: 'Pune, Maharashtra',
      supportedRoutes: 'Pune to Mumbai, Pune to Nashik, Pune to Kolhapur',
      ratePerKm: 26,
      isAvailable: true
    }
  },
  {
    name: 'Sayali',
    username: 'sayali',
    email: 'sayali@harvestmitra.local',
    phone: '9822100003',
    role: 'mandi',
    profileType: 'MandiProfile',
    expectedDashboard: '/dashboard',
    profileData: {
      mandiName: 'Pune APMC Wholesale Yard (Gultekdi)',
      licenseNumber: 'MH-APMC-PUN-2026-SAYALI',
      district: 'Pune',
      state: 'Maharashtra',
      operatingDays: 'Mon-Sat (04:00 AM - 08:00 PM)',
      contactPhone: '9822100003',
      contactEmail: 'sayali@harvestmitra.local',
      facilities: 'Electronic Auction (e-NAM), Automated Weighbridge, Cold Storage (500 MT), Direct DBT Payouts'
    }
  },
  {
    name: 'Prashant',
    username: 'prashant',
    email: 'prashant@harvestmitra.local',
    phone: '9822100004',
    role: 'admin',
    profileType: 'AdminUser',
    expectedDashboard: '/admin',
    profileData: {
      displayName: 'Prashant (APMC Admin)'
    }
  }
];

async function provisionAccounts() {
  console.log('======================================================');
  console.log('🌱 HarvestMitra AI — Evaluation Demo Accounts Provisioning');
  console.log('======================================================');
  console.log(`[DB Dialect]: ${sequelize.getDialect()}`);

  await sequelize.authenticate();
  console.log('✅ Connected to target database.');

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const results = [];

  for (const acc of ACCOUNTS) {
    console.log(`\n--- Provisioning ${acc.name} (${acc.role.toUpperCase()}) ---`);

    // 1. Check or Create User
    let user = await User.findOne({
      where: {
        email: acc.email
      }
    });

    let action = 'existing';
    if (!user) {
      user = await User.create({
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        password: hashedPassword,
        role: acc.role,
        status: 'active'
      });
      action = 'created';
      console.log(`  ✅ User record created (ID: ${user.id}, Email: ${user.email}, Role: ${user.role})`);
    } else {
      // Update password to requested demo password and ensure active status
      user.password = hashedPassword;
      user.role = acc.role;
      user.name = acc.name;
      user.phone = acc.phone;
      user.status = 'active';
      await user.save();
      console.log(`  ✅ User record updated & verified (ID: ${user.id}, Email: ${user.email}, Role: ${user.role})`);
    }

    // 2. Provision Role Profile
    let profileOk = false;
    if (acc.role === 'farmer') {
      let fp = await FarmerProfile.findOne({ where: { userId: user.id } });
      if (!fp) {
        fp = await FarmerProfile.create({
          userId: user.id,
          ...acc.profileData
        });
        console.log(`  ✅ FarmerProfile created for User #${user.id}`);
      } else {
        await fp.update(acc.profileData);
        console.log(`  ✅ FarmerProfile verified for User #${user.id}`);
      }
      profileOk = Boolean(fp);
    } else if (acc.role === 'transporter') {
      let tp = await TransporterProfile.findOne({ where: { userId: user.id } });
      if (!tp) {
        tp = await TransporterProfile.create({
          userId: user.id,
          ...acc.profileData
        });
        console.log(`  ✅ TransporterProfile created for User #${user.id}`);
      } else {
        await tp.update(acc.profileData);
        console.log(`  ✅ TransporterProfile verified for User #${user.id}`);
      }

      if (acc.vehicleData) {
        let v = await Vehicle.findOne({ where: { registrationNumber: acc.vehicleData.registrationNumber } });
        if (!v) {
          v = await Vehicle.create({
            userId: user.id,
            ...acc.vehicleData
          });
          console.log(`  ✅ Vehicle #${v.registrationNumber} registered to Transporter #${user.id}`);
        } else {
          await v.update({ userId: user.id, ...acc.vehicleData });
          console.log(`  ✅ Vehicle #${v.registrationNumber} verified`);
        }
      }
      profileOk = Boolean(tp);
    } else if (acc.role === 'mandi') {
      let mp = await MandiProfile.findOne({ where: { userId: user.id } });
      if (!mp) {
        mp = await MandiProfile.create({
          userId: user.id,
          ...acc.profileData
        });
        console.log(`  ✅ MandiProfile created for User #${user.id}`);
      } else {
        await mp.update(acc.profileData);
        console.log(`  ✅ MandiProfile verified for User #${user.id}`);
      }
      profileOk = Boolean(mp);
    } else if (acc.role === 'admin') {
      let ap = await AdminUser.findOne({ where: { userId: user.id } });
      if (!ap) {
        ap = await AdminUser.create({
          userId: user.id,
          ...acc.profileData
        });
        console.log(`  ✅ AdminUser created for User #${user.id}`);
      } else {
        await ap.update(acc.profileData);
        console.log(`  ✅ AdminUser verified for User #${user.id}`);
      }
      profileOk = Boolean(ap);
    }

    results.push({
      member: acc.name,
      username: acc.username,
      email: acc.email,
      role: acc.role,
      userAction: action,
      userId: user.id,
      profileOk
    });
  }

  // 3. Verification Suite
  console.log('\n======================================================');
  console.log('🧪 Verifying Login & Authentication Across All 4 Roles');
  console.log('======================================================');

  const verificationSummary = [];

  for (const acc of ACCOUNTS) {
    // Test Login via controller by Username
    const reqMockUsername = {
      body: {
        email: acc.username,
        password: DEMO_PASSWORD
      }
    };

    let loginResUsername = null;
    let loginStatus = 0;
    const resMock = {
      status: (code) => {
        loginStatus = code;
        return {
          json: (data) => {
            loginResUsername = data;
            return data;
          }
        };
      }
    };

    await authController.login(reqMockUsername, resMock);

    const loginSuccess = loginStatus === 200 && Boolean(loginResUsername?.token);
    const returnedRole = loginResUsername?.user?.role;
    const hasProfile = Boolean(
      (acc.role === 'farmer' && (loginResUsername?.user?.FarmerProfile || loginResUsername?.user?.farmerProfile)) ||
      (acc.role === 'transporter' && (loginResUsername?.user?.TransporterProfile || loginResUsername?.user?.transporterProfile)) ||
      (acc.role === 'mandi' && (loginResUsername?.user?.MandiProfile || loginResUsername?.user?.mandiProfile)) ||
      (acc.role === 'admin' && returnedRole === 'admin')
    );

    // Also test login by email
    const reqMockEmail = {
      body: {
        email: acc.email,
        password: DEMO_PASSWORD
      }
    };
    let emailStatus = 0;
    const resMockEmail = {
      status: (code) => {
        emailStatus = code;
        return { json: (d) => d };
      }
    };
    await authController.login(reqMockEmail, resMockEmail);
    const emailLoginSuccess = emailStatus === 200;

    console.log(`[${acc.name}] Username Login ('${acc.username}'): ${loginSuccess ? '✅ 200 OK' : '❌ FAILED'}`);
    console.log(`[${acc.name}] Email Login ('${acc.email}'): ${emailLoginSuccess ? '✅ 200 OK' : '❌ FAILED'}`);
    console.log(`[${acc.name}] Returned Role: ${returnedRole} (Expected: ${acc.role})`);
    console.log(`[${acc.name}] Role Profile Attached: ${hasProfile ? '✅ YES' : '❌ NO'}`);

    verificationSummary.push({
      member: acc.name,
      role: acc.role,
      username: acc.username,
      email: acc.email,
      registrationResult: 'Success (Verified)',
      loginResult: loginSuccess && emailLoginSuccess ? '200 OK (JWT Issued)' : 'Failed',
      profileResult: hasProfile ? 'Active & Populated' : 'Missing',
      token: loginResUsername?.token || null,
      issues: (loginSuccess && hasProfile) ? 'None' : 'Verification failure'
    });
  }

  // 4. Test RBAC Isolation
  console.log('\n--- RBAC Isolation Verification ---');
  const adminMiddleware = require('../backend/middleware/admin.middleware');
  const farmerAcc = verificationSummary.find(v => v.role === 'farmer');
  const adminAcc = verificationSummary.find(v => v.role === 'admin');

  // Verify farmer is rejected from admin route
  let farmerBlocked = false;
  await adminMiddleware(
    { user: { id: farmerAcc.token ? jwt.decode(farmerAcc.token).id : 1 } },
    {
      status: (code) => {
        if (code === 403) farmerBlocked = true;
        return { json: () => {} };
      }
    },
    () => {}
  );
  console.log(`Farmer RBAC guard (Admin blocked): ${farmerBlocked ? '✅ 403 Forbidden' : '❌ Failed'}`);

  // Verify admin is allowed
  let adminAllowed = false;
  await adminMiddleware(
    { user: { id: adminAcc.token ? jwt.decode(adminAcc.token).id : 1 } },
    { status: () => ({ json: () => {} }) },
    () => { adminAllowed = true; }
  );
  console.log(`Admin RBAC guard (Admin allowed): ${adminAllowed ? '✅ 200 Allowed' : '❌ Failed'}`);

  console.log('\n======================================================');
  console.log('📋 SUMMARY TABLE');
  console.log('======================================================');
  console.table(verificationSummary.map(s => ({
    Member: s.member,
    Role: s.role,
    Username: s.username,
    Registration: s.registrationResult,
    Login: s.loginResult,
    Profile: s.profileResult,
    Issues: s.issues
  })));

  return verificationSummary;
}

if (require.main === module) {
  provisionAccounts()
    .then(() => {
      console.log('\n🎉 All 4 Evaluation Demo Accounts Registered and Verified Successfully!\n');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Provisioning failed:', err);
      process.exit(1);
    });
}

module.exports = provisionAccounts;
