const https = require('https');

const LIVE_BASE = 'https://harvestmitra-backend.onrender.com';

const DEMO_ACCOUNTS = [
  {
    name: 'Sayali Kulkarni',
    email: 'farmer.sayali@harvestmitra.local',
    phone: '9822110001',
    password: process.env.DEMO_FARMER_PASSWORD || 'Sayali#Farmer2026!',
    role: 'farmer',
    district: 'Nashik',
    village: 'Niphad',
    farmSizeAcres: '4.5',
    mainCrop: ['Tomato', 'Onion', 'Grapes'],
    currentHarvestKg: 3500,
    productQuantities: {
      Tomato: { harvestQuantityKg: 1500, unit: 'kg' },
      Onion: { harvestQuantityKg: 1200, unit: 'kg' },
      Grapes: { harvestQuantityKg: 800, unit: 'kg' }
    }
  },
  {
    name: 'Prashant Warule',
    email: 'transporter.prashant@harvestmitra.local',
    phone: '9822110002',
    password: process.env.DEMO_TRANSPORTER_PASSWORD || 'Prashant#Trans2026!',
    role: 'transporter',
    district: 'Pune',
    vehicleType: 'Tata 407 Agri LCV',
    vehicleNumber: 'MH-12-PW-2026',
    capacityKg: 3500,
    baseMandi: 'Pune APMC',
    ratePerKm: 28
  },
  {
    name: 'Mihir Jadav',
    email: 'mandi.mihir@harvestmitra.local',
    phone: '9822110003',
    password: process.env.DEMO_MANDI_PASSWORD || 'Mihir#Mandi2026!',
    role: 'mandi',
    district: 'Pune',
    mandiName: 'Pune APMC (Gultekdi Wholesale Market)',
    licenseNumber: 'MH-APMC-PUN-MJ-2026',
    operatingDays: 'Mon-Sat (04:00 - 18:00)',
    facilities: 'Electronic e-NAM Auction, Automated Weighbridge, Ripening Chamber, Cold Storage'
  },
  {
    name: 'Varun patil FPO',
    email: 'fpo.varun@harvestmitra.local',
    phone: '9822110004',
    password: process.env.DEMO_FPO_PASSWORD || 'Varun#FPO2026!',
    role: 'fpo_leader',
    district: 'Nashik',
    village: 'Dindori',
    farmSizeAcres: '120.0',
    fpoName: 'Sahyadri Farmers Producer Company',
    fpoRegistrationNumber: 'FPO-MH-NAS-2024-9981',
    memberFarmerCount: 45,
    mainCrop: ['Tomato', 'Onion', 'Soybean'],
    currentHarvestKg: 15000
  }
];

function requestJson(urlPath, method, data) {
  return new Promise((resolve) => {
    const postBody = data ? JSON.stringify(data) : '';
    const req = https.request(LIVE_BASE + urlPath, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    }, (res) => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(buf) });
        } catch {
          resolve({ status: res.statusCode, raw: buf });
        }
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    if (postBody) req.write(postBody);
    req.end();
  });
}

async function run() {
  console.log('\n======================================================');
  console.log('🌾 Provisioning Team Demo Accounts on Live Render Backend');
  console.log('======================================================\n');

  for (const acc of DEMO_ACCOUNTS) {
    console.log(`Checking ${acc.name} (${acc.role})...`);
    // Check if already registered by trying to log in
    const loginRes = await requestJson('/api/auth/login', 'POST', {
      email: acc.email,
      password: acc.password
    });

    if (loginRes.status === 200 && loginRes.data && loginRes.data.success) {
      console.log(`  ✅ Already active on live backend! Role: ${loginRes.data.user.role}`);
      continue;
    }

    // Otherwise, register on live backend
    console.log(`  Registering ${acc.name} on live backend...`);
    const regRes = await requestJson('/api/auth/register', 'POST', acc);
    if (regRes.status === 201 && regRes.data && regRes.data.success) {
      console.log(`  ✅ Registered successfully on live backend! User ID: ${regRes.data.user?.id || 'OK'}`);
    } else {
      console.log(`  Response (${regRes.status}):`, regRes.data || regRes.raw);
    }

    // Verify login after register
    const verifyLogin = await requestJson('/api/auth/login', 'POST', {
      email: acc.email,
      password: acc.password
    });
    if (verifyLogin.status === 200 && verifyLogin.data && verifyLogin.data.success) {
      console.log(`  ✅ Live login verified: ${verifyLogin.data.user.name} (${verifyLogin.data.user.role})`);
    } else {
      console.log(`  ❌ Live login failed after registration:`, verifyLogin.data || verifyLogin.raw);
    }
    console.log('');
  }
}

run().catch(console.error);
