const http = require('http');
const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const app = require('../backend/app');

const ACCOUNTS = [
  { role: 'farmer', email: 'farmer.sayali@harvestmitra.local', phone: '9822110001', pass: 'Sayali#Farmer2026!', expectedRole: 'farmer', expectedDashboard: '/dashboard' },
  { role: 'transporter', email: 'transporter.prashant@harvestmitra.local', phone: '9822110002', pass: 'Prashant#Trans2026!', expectedRole: 'transporter', expectedDashboard: '/transport' },
  { role: 'mandi', email: 'mandi.mihir@harvestmitra.local', phone: '9822110003', pass: 'Mihir#Mandi2026!', expectedRole: 'mandi', expectedDashboard: '/dashboard' },
  { role: 'fpo_leader', email: 'fpo.varun@harvestmitra.local', phone: '9822110004', pass: 'Varun#FPO2026!', expectedRole: 'fpo_leader', expectedDashboard: '/fpo' },
];

async function run() {
  console.log('\n======================================================');
  console.log('🌾 Verifying Demo Account Logins & Auth Responses');
  console.log('======================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  let allPassed = true;

  for (const acc of ACCOUNTS) {
    const postData = JSON.stringify({
      email: acc.email,
      password: acc.pass
    });

    const res = await new Promise((resolve) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', err => resolve({ error: err.message }));
      req.write(postData);
      req.end();
    });

    if (res.statusCode === 200 && res.data && res.data.token) {
      const user = res.data.user;
      const roleMatches = user.role.toLowerCase() === acc.expectedRole.toLowerCase();
      if (roleMatches) {
        console.log(`✅ [${acc.role.toUpperCase()}] Email Login Successful!`);
        console.log(`   - Name: ${user.name}`);
        console.log(`   - Returned Role: ${user.role} (matches expected ${acc.expectedRole})`);
        console.log(`   - JWT Token Present: YES (${res.data.token.slice(0, 16)}...)`);
        console.log(`   - Target Dashboard: ${acc.expectedDashboard}`);
      } else {
        console.log(`❌ [${acc.role.toUpperCase()}] Role mismatch! Got: ${user.role}, expected: ${acc.expectedRole}\n`);
        allPassed = false;
      }
    } else {
      console.log(`❌ [${acc.role.toUpperCase()}] Email Login Failed! Status: ${res.statusCode}`, res.data || res.raw || res.error);
      allPassed = false;
    }

    // Phone login check
    const phonePostData = JSON.stringify({
      email: acc.phone,
      password: acc.pass
    });

    const phoneRes = await new Promise((resolve) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(phonePostData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', err => resolve({ error: err.message }));
      req.write(phonePostData);
      req.end();
    });

    if (phoneRes.statusCode === 200 && phoneRes.data && phoneRes.data.token) {
      console.log(`   - Phone Login (${acc.phone}): SUCCESS (${phoneRes.data.user.role})\n`);
    } else {
      console.log(`❌ Phone Login Failed for ${acc.phone}: Status ${phoneRes.statusCode}\n`);
      allPassed = false;
    }
  }

  server.close();
  if (allPassed) {
    console.log('🎉 All 4 Team Demonstration Accounts Verified 100% via Backend Auth API!\n');
    process.exit(0);
  } else {
    console.error('❌ One or more demo account logins failed.');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Script Error:', err);
  process.exit(1);
});
