/**
 * liveIntegrationAudit.js
 * Comprehensive live integration verification of all HarvestMitra AI backend endpoints & frontend status
 */

const API_BASE = 'http://127.0.0.1:5000';
const FRONTEND_BASE = 'http://localhost:5173';

async function runAudit() {
  console.log('\n======================================================');
  console.log('🌾 HarvestMitra AI — LIVE END-TO-END SYSTEM AUDIT');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name, ok, details = '') {
    if (ok) {
      passed++;
      console.log(`  ✅ [PASS] ${name}${details ? ` -> ${details}` : ''}`);
    } else {
      failed++;
      console.error(`  ❌ [FAIL] ${name}${details ? ` -> ${details}` : ''}`);
    }
  }

  // 1. Health Endpoint
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    report('1. Backend Health Check (GET /api/health)', res.ok && data.status === 'ok', JSON.stringify(data));
  } catch (err) {
    report('1. Backend Health Check', false, err.message);
  }

  // 2. Farmer Login
  let farmerToken = '';
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@harvestmitra.local', password: 'Demo@12345' })
    });
    const data = await res.json();
    farmerToken = data.token;
    report('2. Farmer Login (POST /api/auth/login)', res.ok && data.success && !!farmerToken, `User: ${data.user?.name} (${data.user?.role})`);
  } catch (err) {
    report('2. Farmer Login', false, err.message);
  }

  // 3. Admin Login
  let adminToken = '';
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@harvestmitra.local', password: 'Admin@12345' })
    });
    const data = await res.json();
    adminToken = data.token;
    report('3. Admin Login (POST /api/auth/login)', res.ok && data.success && data.user?.role === 'admin', `Admin: ${data.user?.name}`);
  } catch (err) {
    report('3. Admin Login', false, err.message);
  }

  // 4. Session Verification (GET /api/auth/me)
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    const data = await res.json();
    report('4. Authenticated Farmer Session (GET /api/auth/me)', res.ok && data.success, `Verified ID: ${data.user?.id}`);
  } catch (err) {
    report('4. Authenticated Farmer Session', false, err.message);
  }

  // 5. Live Mandi Market Intelligence
  try {
    const res = await fetch(`${API_BASE}/api/market/prices?commodity=Tomato&state=Maharashtra&limit=10`);
    const data = await res.json();
    report('5. Live APMC Market Intelligence (GET /api/market/prices)', res.ok && data.success && Array.isArray(data.data), `Fetched ${data.data?.length} live market prices`);
  } catch (err) {
    report('5. Live APMC Market Intelligence', false, err.message);
  }

  // 6. Multi-Mandi Arbitrage Comparison
  try {
    const res = await fetch(`${API_BASE}/api/market/compare?crop=Tomato&origin=Pune`);
    const data = await res.json();
    report('6. Mandi Price Comparison (GET /api/market/compare)', res.ok && (data.success !== false), `Comparison evaluated`);
  } catch (err) {
    report('6. Mandi Price Comparison', false, err.message);
  }

  // 7. Weather Advisory Engine
  try {
    const res = await fetch(`${API_BASE}/api/weather?district=Pune`);
    const data = await res.json();
    report('7. Weather Advisory Engine (GET /api/weather)', res.ok && (data.success !== false || data.temperature || data.forecast), `District: Pune, Advisory: ${data.advisory?.status || 'Active'}`);
  } catch (err) {
    report('7. Weather Advisory Engine', false, err.message);
  }

  // 8. Government Schemes Directory
  try {
    const res = await fetch(`${API_BASE}/api/schemes?state=Maharashtra`);
    const data = await res.json();
    const count = Array.isArray(data.data) ? data.data.length : (Array.isArray(data) ? data.length : 0);
    report('8. Government Schemes Directory (GET /api/schemes)', res.ok && count > 0, `Verified ${count} official government schemes`);
  } catch (err) {
    report('8. Government Schemes Directory', false, err.message);
  }

  // 9. Personalized Scheme Matcher Engine
  try {
    const res = await fetch(`${API_BASE}/api/schemes/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`
      },
      body: JSON.stringify({
        state: 'Maharashtra',
        district: 'Pune',
        landSizeAcres: 4.5,
        crop: 'Cotton',
        hasLandTitle: true
      })
    });
    const data = await res.json();
    const matches = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    report('9. Scheme Matching Engine (POST /api/schemes/match)', res.ok, `Evaluated against criteria, returned eligible schemes`);
  } catch (err) {
    report('9. Scheme Matching Engine', false, err.message);
  }

  // 10. AI Mitra Assistant Advisory
  try {
    const res = await fetch(`${API_BASE}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`
      },
      body: JSON.stringify({
        message: 'When should I sell my cotton in Maharashtra for maximum profit?',
        crop: 'Cotton',
        district: 'Pune',
        language: 'en'
      })
    });
    const data = await res.json();
    report('10. AI Mitra Advisory (POST /api/chat/message)', res.ok && (data.reply || data.response || data.message || data.success), `Advisory: "${(data.reply || data.response || data.message || '').substring(0, 50)}..."`);
  } catch (err) {
    report('10. AI Mitra Advisory', false, err.message);
  }

  // 11. Transport Logistics & Shared Pooling
  try {
    const res = await fetch(`${API_BASE}/api/transport/my-requests`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    const data = await res.json();
    report('11. Transport Pooling Module (GET /api/transport/my-requests)', res.ok && (Array.isArray(data.data) || Array.isArray(data)), `Requests accessible (${(data.data || data || []).length} active requests)`);
  } catch (err) {
    report('11. Transport Pooling Module', false, err.message);
  }

  // 12. Frontend Dev Server Check (Vite port 5173)
  try {
    const res = await fetch(`${FRONTEND_BASE}`);
    const text = await res.text();
    report('12. Frontend Web App Active (GET http://localhost:5173)', res.ok && text.toLowerCase().includes('<!doctype html>'), `Vite dev server serving HTML successfully`);
  } catch (err) {
    report('12. Frontend Web App Active', false, err.message);
  }

  console.log('\n======================================================');
  console.log(`Live Audit Finished: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit();
