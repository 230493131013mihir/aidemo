const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const app = require('../app');
const { User, FarmerProfile, TransporterProfile, MandiProfile } = require('../models');

async function run() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`Test server running on ${baseUrl}`);

  const roles = ['farmer', 'transporter', 'mandi', 'admin'];
  const tokens = {};
  const users = {};

  for (const role of roles) {
    let user = await User.findOne({ where: { role } });
    if (!user) {
      user = await User.create({
        name: `Test ${role}`,
        email: `test_${role}_audit@harvestmitra.test`,
        phone: `980000009${roles.indexOf(role)}`,
        password: 'hashedpassword',
        role
      });
    }
    users[role] = user;
    tokens[role] = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'harvestmitra_secret',
      { expiresIn: '1h' }
    );
  }

  async function checkEndpoint(role, method, endpointPath, body = null) {
    const token = tokens[role];
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${endpointPath}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    let resBody;
    try {
      resBody = await res.json();
    } catch {
      resBody = await res.text();
    }

    return { status: res.status, body: resBody };
  }

  console.log('\n========================================');
  console.log('1. PROBING FARMER RESTRICTIONS');
  console.log('========================================');
  const f1 = await checkEndpoint('farmer', 'POST', '/api/transport/vehicles', { vehicleNumber: 'MH-12-TEST-1' });
  console.log('Farmer POST /api/transport/vehicles:', f1.status, f1.body?.message || f1.body);

  const f2 = await checkEndpoint('farmer', 'GET', '/api/transport/vehicles/my-fleet');
  console.log('Farmer GET /api/transport/vehicles/my-fleet:', f2.status, f2.body?.message || f2.body);

  const f3 = await checkEndpoint('farmer', 'GET', '/api/transport/open-cargo');
  console.log('Farmer GET /api/transport/open-cargo:', f3.status, f3.body?.message || f3.body);

  const f4 = await checkEndpoint('farmer', 'GET', '/api/transport/active-trip');
  console.log('Farmer GET /api/transport/active-trip:', f4.status, f4.body?.message || f4.body);

  const f5 = await checkEndpoint('farmer', 'GET', '/api/transport/transporter-stats');
  console.log('Farmer GET /api/transport/transporter-stats:', f5.status, f5.body?.message || f5.body);

  const f6 = await checkEndpoint('farmer', 'PUT', '/api/transport/requests/999/accept');
  console.log('Farmer PUT /api/transport/requests/999/accept:', f6.status, f6.body?.message || f6.body);

  const f7 = await checkEndpoint('farmer', 'GET', '/api/admin/overview');
  console.log('Farmer GET /api/admin/overview:', f7.status, f7.body?.message || f7.body);

  const f8 = await checkEndpoint('farmer', 'GET', '/api/admin/users');
  console.log('Farmer GET /api/admin/users:', f8.status, f8.body?.message || f8.body);

  console.log('\n========================================');
  console.log('2. PROBING TRANSPORTER RESTRICTIONS');
  console.log('========================================');
  const t1 = await checkEndpoint('transporter', 'POST', '/api/transport/requests', {
    farmerName: 'Hacker Transporter',
    cropName: 'Tomato',
    pickupLocation: 'Pune',
    destinationMarket: 'Pune APMC',
    pickupDate: '2026-10-25',
    weightKg: 500
  });
  console.log('Transporter POST /api/transport/requests:', t1.status, t1.body?.message || t1.body);

  const t2 = await checkEndpoint('transporter', 'POST', '/api/transport/bookings', {
    cropName: 'Tomato',
    destinationMarket: 'Pune APMC',
    weightKg: 500
  });
  console.log('Transporter POST /api/transport/bookings:', t2.status, t2.body?.message || t2.body);

  const t3 = await checkEndpoint('transporter', 'GET', '/api/transport/transporters');
  console.log('Transporter GET /api/transport/transporters:', t3.status, t3.body?.message || t3.body);

  const t4 = await checkEndpoint('transporter', 'POST', '/api/farmer/crops', {
    cropName: 'Wheat',
    quantity: 1000
  });
  console.log('Transporter POST /api/farmer/crops:', t4.status, t4.body?.message || (t4.status === 201 || t4.status === 200 ? 'LEAK! Transporter allowed to add farmer crop' : t4.body));

  const t5 = await checkEndpoint('transporter', 'GET', '/api/farmer/crops');
  console.log('Transporter GET /api/farmer/crops:', t5.status, t5.body?.crops !== undefined ? `LEAK! Transporter received ${t5.body.crops.length} crops` : t5.body?.message);

  const t6 = await checkEndpoint('transporter', 'GET', '/api/admin/overview');
  console.log('Transporter GET /api/admin/overview:', t6.status, t6.body?.message || t6.body);

  console.log('\n========================================');
  console.log('3. PROBING MANDI RESTRICTIONS');
  console.log('========================================');
  const m1 = await checkEndpoint('mandi', 'POST', '/api/transport/vehicles', { vehicleNumber: 'MH-12-TEST-2' });
  console.log('Mandi POST /api/transport/vehicles:', m1.status, m1.body?.message || m1.body);

  const m2 = await checkEndpoint('mandi', 'POST', '/api/transport/requests', { cropName: 'Tomato' });
  console.log('Mandi POST /api/transport/requests:', m2.status, m2.body?.message || m2.body);

  const m3 = await checkEndpoint('mandi', 'POST', '/api/farmer/crops', { cropName: 'Tomato', quantity: 500 });
  console.log('Mandi POST /api/farmer/crops:', m3.status, m3.body?.message || (m3.status === 201 || m3.status === 200 ? 'LEAK! Mandi allowed to add farmer crop' : m3.body));

  const m4 = await checkEndpoint('mandi', 'GET', '/api/admin/overview');
  console.log('Mandi GET /api/admin/overview:', m4.status, m4.body?.message || m4.body);

  const m5 = await checkEndpoint('mandi', 'GET', '/api/auth/farmers');
  console.log('Mandi GET /api/auth/farmers:', m5.status, m5.body?.count !== undefined ? `Count: ${m5.body.count}` : m5.body?.message);

  console.log('\n========================================');
  console.log('4. PROBING NON-MANDI (FARMER/TRANSPORTER) ON /api/auth/farmers');
  console.log('========================================');
  const leak1 = await checkEndpoint('farmer', 'GET', '/api/auth/farmers');
  console.log('Farmer GET /api/auth/farmers:', leak1.status, leak1.body?.count !== undefined ? `PRIVACY LEAK! Farmer received full contact list of ${leak1.body.count} other farmers` : leak1.body?.message);

  const leak2 = await checkEndpoint('transporter', 'GET', '/api/auth/farmers');
  console.log('Transporter GET /api/auth/farmers:', leak2.status, leak2.body?.count !== undefined ? `PRIVACY LEAK! Transporter received full contact list of ${leak2.body.count} farmers` : leak2.body?.message);

  console.log('\n========================================');
  console.log('5. PROBING ADMIN ACCESS & PRIVILEGES');
  console.log('========================================');
  const a1 = await checkEndpoint('admin', 'GET', '/api/admin/overview');
  console.log('Admin GET /api/admin/overview:', a1.status);

  const a2 = await checkEndpoint('admin', 'POST', '/api/transport/vehicles', { vehicleNumber: 'MH-12-ADM' });
  console.log('Admin POST /api/transport/vehicles:', a2.status, a2.body?.message || 'Authorized');

  const a3 = await checkEndpoint('admin', 'POST', '/api/transport/requests', { cropName: 'Tomato' });
  console.log('Admin POST /api/transport/requests:', a3.status, a3.body?.message || a3.body);

  console.log('\n========================================');
  console.log('6. PROBING UNAUTHENTICATED / GUEST ACCESS');
  console.log('========================================');
  const g1 = await fetch(`${baseUrl}/api/admin/overview`);
  console.log('Unauth GET /api/admin/overview:', g1.status);

  const g2 = await fetch(`${baseUrl}/api/transport/my-requests`);
  console.log('Unauth GET /api/transport/my-requests:', g2.status);

  const g3 = await fetch(`${baseUrl}/api/farmer/crops`);
  console.log('Unauth GET /api/farmer/crops:', g3.status);

  const g4 = await fetch(`${baseUrl}/api/alerts/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'test' })
  });
  console.log('Unauth POST /api/alerts/simulate:', g4.status);

  server.close();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
