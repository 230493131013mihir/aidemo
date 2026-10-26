/**
 * provisionTeamDemoAccounts.js
 * Idempotent provisioning script for the 4 role-specific demonstration accounts
 * HarvestMitra AI
 */

const path = require('path');
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));
const { 
  User, 
  FarmerProfile, 
  TransporterProfile, 
  MandiProfile, 
  Crop,
  Market
} = require('../backend/models');
const sequelize = require('../backend/config/database');

const DEMO_ACCOUNTS = [
  {
    displayName: 'Sayali Kulkarni',
    role: 'farmer',
    email: 'farmer.sayali@harvestmitra.local',
    phone: '9822110001',
    passwordEnvVar: 'DEMO_FARMER_PASSWORD',
    defaultPassword: process.env.DEMO_FARMER_PASSWORD || 'Sayali#Farmer2026!',
    targetDashboard: '/dashboard',
    profileData: {
      district: 'Pune',
      state: 'Maharashtra',
      village: 'Haveli',
      farmSizeAcres: 4.5,
      mainCrop: 'Tomato, Onion, Wheat',
      currentHarvestKg: 1500,
      productQuantities: JSON.stringify({
        Tomato: { qty: 600, unit: 'kg' },
        Onion: { qty: 400, unit: 'kg' },
        Wheat: { qty: 500, unit: 'kg' }
      }),
      preferredLanguage: 'mr',
      agristackId: 'PMK-MH-98201',
      isGovtVerified: true,
      govtVerifiedLandAcres: 4.5,
      surveyNumber: '142/2A',
      aadhaarLinked: true,
      dbtAccountLinked: true,
      roleSubtype: 'smallholder'
    }
  },
  {
    displayName: 'Prashant Warule',
    role: 'transporter',
    email: 'transporter.prashant@harvestmitra.local',
    phone: '9822110002',
    passwordEnvVar: 'DEMO_TRANSPORTER_PASSWORD',
    defaultPassword: process.env.DEMO_TRANSPORTER_PASSWORD || 'Prashant#Trans2026!',
    targetDashboard: '/transport',
    profileData: {
      driverName: 'Prashant Warule',
      phone: '9822110002',
      vehicleType: 'Tata 407 Agri LCV',
      vehicleNumber: 'MH-12-PW-2026',
      capacityKg: 2500,
      baseMandi: 'Pune APMC',
      ratePerKm: 26,
      isAvailable: true
    }
  },
  {
    displayName: 'Mihir Jadav',
    role: 'mandi',
    email: 'mandi.mihir@harvestmitra.local',
    phone: '9822110003',
    passwordEnvVar: 'DEMO_MANDI_PASSWORD',
    defaultPassword: process.env.DEMO_MANDI_PASSWORD || 'Mihir#Mandi2026!',
    targetDashboard: '/dashboard',
    profileData: {
      mandiName: 'Pune APMC Central Mandi',
      licenseNumber: 'MH-APMC-PUN-2026-MJ',
      district: 'Pune',
      state: 'Maharashtra',
      operatingDays: 'Mon-Sat (06:00 AM - 08:00 PM)',
      contactPhone: '9822110003',
      contactEmail: 'mandi.mihir@harvestmitra.local',
      facilities: 'Electronic Auction, Direct DBT Settlement, Modern Weighbridge, Cold Storage (500 MT)'
    }
  },
  {
    displayName: 'Varun patil FPO',
    role: 'fpo_leader',
    email: 'fpo.varun@harvestmitra.local',
    phone: '9822110004',
    passwordEnvVar: 'DEMO_FPO_PASSWORD',
    defaultPassword: process.env.DEMO_FPO_PASSWORD || 'Varun#FPO2026!',
    targetDashboard: '/fpo',
    profileData: {
      district: 'Nashik',
      state: 'Maharashtra',
      village: 'Lasalgaon',
      farmSizeAcres: 50.0,
      mainCrop: 'Onion, Tomato, Grapes',
      currentHarvestKg: 8500,
      productQuantities: JSON.stringify({
        Onion: { qty: 5000, unit: 'kg' },
        Tomato: { qty: 2500, unit: 'kg' },
        Grapes: { qty: 1000, unit: 'kg' }
      }),
      preferredLanguage: 'mr',
      fpoName: 'Sahyadri Kisan Samruddhi FPO',
      fpoRegistrationNumber: 'FPO-MH-2026-VP',
      memberFarmerCount: 65,
      isGovtVerified: true,
      roleSubtype: 'fpo_leader'
    }
  }
];

async function provisionAccounts() {
  console.log('🌾 Initializing Team Demo Accounts Provisioning...');
  await sequelize.authenticate();
  console.log('Database connected successfully:', sequelize.config.database);

  const results = [];

  for (const acc of DEMO_ACCOUNTS) {
    const hashedPassword = await bcrypt.hash(acc.defaultPassword, 10);

    let user = await User.findOne({ where: { email: acc.email } });
    let created = false;

    if (!user) {
      // Also verify phone uniqueness
      const existingPhone = await User.findOne({ where: { phone: acc.phone } });
      if (existingPhone) {
        acc.phone = `98221${Math.floor(10000 + Math.random() * 90000)}`;
      }

      user = await User.create({
        name: acc.displayName,
        email: acc.email,
        phone: acc.phone,
        password: hashedPassword,
        role: acc.role,
        status: 'active'
      });
      created = true;
    } else {
      user.name = acc.displayName;
      user.password = hashedPassword;
      user.role = acc.role;
      user.status = 'active';
      await user.save();
    }

    // Provision corresponding profile
    if (acc.role === 'farmer' || acc.role === 'fpo_leader') {
      let fp = await FarmerProfile.findOne({ where: { userId: user.id } });
      if (!fp) {
        fp = await FarmerProfile.create({ userId: user.id, ...acc.profileData });
      } else {
        await fp.update(acc.profileData);
      }
    } else if (acc.role === 'transporter') {
      let tp = await TransporterProfile.findOne({ where: { userId: user.id } });
      if (!tp) {
        tp = await TransporterProfile.create({ userId: user.id, ...acc.profileData });
      } else {
        await tp.update(acc.profileData);
      }
    } else if (acc.role === 'mandi') {
      let mp = await MandiProfile.findOne({ where: { userId: user.id } });
      if (!mp) {
        mp = await MandiProfile.create({ userId: user.id, ...acc.profileData });
      } else {
        await mp.update(acc.profileData);
      }
    }

    // Verify password check
    const isPasswordValid = await bcrypt.compare(acc.defaultPassword, user.password);

    results.push({
      displayName: user.name,
      role: user.role,
      loginIdentifier: user.email,
      phone: user.phone,
      temporaryPassword: acc.defaultPassword,
      targetDashboard: acc.targetDashboard,
      status: created ? 'CREATED' : 'UPDATED & VERIFIED',
      passwordCheck: isPasswordValid ? 'PASS' : 'FAIL'
    });
  }

  console.log('\n======================================================');
  console.log('✅ 4 ROLE-SPECIFIC DEMONSTRATION ACCOUNTS PROVISIONED');
  console.log('======================================================\n');
  console.table(results);

  return results;
}

if (require.main === module) {
  provisionAccounts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Provisioning error:', err);
      process.exit(1);
    });
}

module.exports = { provisionAccounts, DEMO_ACCOUNTS };
