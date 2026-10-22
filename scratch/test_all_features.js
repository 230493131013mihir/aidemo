const fetch = globalThis.fetch || require('node-fetch');

const BASE_URL = 'http://127.0.0.1:5000';

async function runAudit() {
  console.log('==============================================');
  console.log('🔍 HARVESTMITRA AI DEEP QA BUG HUNTER AUDIT');
  console.log('==============================================\n');

  const bugsFound = [];

  // 1. Audit /api/harvest/simulate (Documented in API_DOCUMENTATION.md lines 154-199)
  try {
    const res = await fetch(`${BASE_URL}/api/harvest/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crop_id: 1, quantity_kg: 500 })
    });
    console.log(`[TEST 1] POST /api/harvest/simulate Status: ${res.status}`);
    if (res.status === 404) {
      bugsFound.push({
        id: 'BUG-01',
        title: 'Missing Core Harvest Simulation Endpoint (/api/harvest/simulate)',
        feature: 'Smart Harvest Decision Simulator',
        issue: 'ISSUE-07',
        member: 'Prashant Warule',
        severity: 'HIGH',
        detail: 'Documented in API_DOCUMENTATION.md (lines 154-199) and TASK_ALLOCATION.md, but the entire /api/harvest router is missing in backend/app.js. Returns 404 Not Found.'
      });
    }
  } catch (err) {
    console.error('Test 1 error:', err.message);
  }

  // 2. Audit Admin Transport Fleet Endpoints (GET /api/transport/requests & PUT /api/transport/requests/:id/status)
  // First login as admin to get token
  let adminToken = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@harvestmitra.local', password: 'Admin@12345' })
    });
    const loginData = await loginRes.json();
    adminToken = loginData.token;
  } catch (err) {
    console.error('Admin login failed:', err.message);
  }

  if (adminToken) {
    const res = await fetch(`${BASE_URL}/api/transport/requests`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`[TEST 2] GET /api/transport/requests (Admin) Status: ${res.status}`);
    if (res.status === 404) {
      bugsFound.push({
        id: 'BUG-02',
        title: 'Missing Admin Transport Fleet Overview Endpoint (/api/transport/requests)',
        feature: 'Admin Panel & Transport Fleet Logistics',
        issue: 'ISSUE-03 / ISSUE-08',
        member: 'Mihir Jadav & Prashant Warule',
        severity: 'HIGH',
        detail: 'Admin dashboard attempts to fetch /api/transport/requests (AdminPage.jsx:165) and API_DOCUMENTATION.md lines 420-430 specifies this route, but transport.routes.js does not define router.get("/requests"). Causes Admin Transport Fleet tab to be permanently empty.'
      });
    }

    const putRes = await fetch(`${BASE_URL}/api/transport/requests/1/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'cancelled' })
    });
    console.log(`[TEST 3] PUT /api/transport/requests/1/status Status: ${putRes.status}`);
    if (putRes.status === 404) {
      bugsFound.push({
        id: 'BUG-03',
        title: 'Missing Admin Transport Status Override Endpoint (/api/transport/requests/:id/status)',
        feature: 'Admin Panel Transport Management',
        issue: 'ISSUE-03',
        member: 'Mihir Jadav',
        severity: 'MEDIUM',
        detail: 'Documented in API_DOCUMENTATION.md (lines 431-440), but undefined in transport.routes.js. Express returns 404 Endpoint Not Found.'
      });
    }

    // Try updating user role to "mandi" via Admin API
    const userRoleRes = await fetch(`${BASE_URL}/api/admin/users/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'mandi' })
    });
    console.log(`[TEST 4] PUT /api/admin/users/:id with role="mandi" Status: ${userRoleRes.status}`);
    const userRoleJson = await userRoleRes.json();
    if (userRoleRes.status === 400 && userRoleJson.message?.includes('role must be one of')) {
      bugsFound.push({
        id: 'BUG-04',
        title: 'Admin RBAC User Role Whitelist Rejects Mandi Role',
        feature: 'Admin User Management RBAC',
        issue: 'ISSUE-03',
        member: 'Mihir Jadav',
        severity: 'MEDIUM',
        detail: 'Users can register as role="mandi", but admin.controller.js line 48 hardcodes allowed = ["farmer", "transporter", "admin"]. Admin attempting to assign or manage a Mandi role gets 400 Bad Request.'
      });
    }
  }

  // 3. Audit Chat Sessions Endpoint (/api/chat/sessions)
  try {
    const res = await fetch(`${BASE_URL}/api/chat/sessions`);
    console.log(`[TEST 5] GET /api/chat/sessions Status: ${res.status}`);
    if (res.status === 404) {
      bugsFound.push({
        id: 'BUG-05',
        title: 'Documented Chat Sessions Endpoint Missing (/api/chat/sessions)',
        feature: 'Mitra Assistant AI Conversations',
        issue: 'ISSUE-09',
        member: 'Varun Patil',
        severity: 'MEDIUM',
        detail: 'API_DOCUMENTATION.md line 551 documents GET /api/chat/sessions to retrieve previous conversations, but chatRoutes.js only defines /message and /status. Returns 404.'
      });
    }
  } catch (err) {
    console.error('Test 5 error:', err.message);
  }

  // 4. Audit Weather Rain Alerts Default Location
  try {
    const res = await fetch(`${BASE_URL}/api/weather/alerts`);
    const data = await res.json();
    console.log(`[TEST 6] GET /api/weather/alerts Location: ${data.location?.district}, ${data.location?.state}`);
    if (data.location?.district === 'Surat' || data.location?.state === 'Gujarat') {
      bugsFound.push({
        id: 'BUG-06',
        title: 'Hardcoded Legacy Gujarat Fallback in Weather Rain Alerts',
        feature: 'Weather Advisory & Rain Alert Engine',
        issue: 'ISSUE-11 / ISSUE-84',
        member: 'Varun Patil',
        severity: 'LOW',
        detail: 'weatherController.js line 82 hardcodes { district = "Surat", state = "Gujarat" } as default params, whereas handleGetWeather defaults to Pune, Maharashtra. Requests without parameters return Gujarat weather alerts.'
      });
    }
  } catch (err) {
    console.error('Test 6 error:', err.message);
  }

  // 5. Audit Forecast Endpoint Implementation in Weather Controller
  try {
    const res = await fetch(`${BASE_URL}/api/weather/forecast?district=Pune`);
    const data = await res.json();
    console.log(`[TEST 7] GET /api/weather/forecast Data days: ${data.weather?.forecast?.length}`);
    if (data.weather?.forecast?.length === 3) {
      bugsFound.push({
        id: 'BUG-07',
        title: 'handleGetWeatherForecast Calls Short getWeather Instead of 5-Day Open-Meteo Telemetry',
        feature: 'Live Agro Weather & Forecast',
        issue: 'ISSUE-11',
        member: 'Varun Patil',
        severity: 'MEDIUM',
        detail: 'In weatherController.js line 61, handleGetWeatherForecast calls weatherService.getWeather instead of weatherService.getWeatherForecast. As a result, it returns static 3-day demo data instead of the live 5-day Open-Meteo telemetry.'
      });
    }
  } catch (err) {
    console.error('Test 7 error:', err.message);
  }

  // 6. Audit Farm Decision Report Default State
  if (adminToken) {
    try {
      const res = await fetch(`${BASE_URL}/api/reports/farm-decision`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      console.log(`[TEST 8] GET /api/reports/farm-decision Farmer Location: ${data.farmer?.village}, ${data.farmer?.district}, ${data.farmer?.state}`);
      if (data.farmer?.district === 'Surat' || data.farmer?.state === 'Gujarat' || data.farmer?.name === 'Ramesh Patel') {
        bugsFound.push({
          id: 'BUG-08',
          title: 'Printable Farm Decision Report Reverts to Legacy Gujarat Dummy Farmer Defaults',
          feature: 'Printable Farm Decision Summary Report',
          issue: 'ISSUE #78',
          member: 'Prashant Warule',
          severity: 'LOW',
          detail: 'In reportController.js lines 24-25 and farmReportService.js lines 17-21, missing profile values fallback to Ramesh Patel, Bardoli, Surat, Gujarat and "Surat APMC Mandi" instead of Maharashtra APMC mandis.'
        });
      }
    } catch (err) {
      console.error('Test 8 error:', err.message);
    }
  }

  // 7. Audit Registration API Document Spec Mismatch
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: "Test Farmer",
        phone_number: "9876543210",
        password: "Password@123",
        preferred_language: "gu",
        district: "Surat"
      })
    });
    console.log(`[TEST 9] POST /api/auth/register (API_DOCUMENTATION.md Spec) Status: ${res.status}`);
    if (res.status === 400) {
      bugsFound.push({
        id: 'BUG-09',
        title: 'Authentication API Specification Mismatch (Missing Email & Key Naming)',
        feature: 'Authentication & Registration API',
        issue: 'ISSUE-02',
        member: 'Mihir Jadav',
        severity: 'MEDIUM',
        detail: 'API_DOCUMENTATION.md lines 11-21 instructs API consumers to send full_name and phone_number without email. However, auth.controller.js lines 113-126 rejects this with 400 Bad Request because email is strictly required and fields are named name and phone.'
      });
    }
  } catch (err) {
    console.error('Test 9 error:', err.message);
  }

  console.log('\n==============================================');
  console.log(`🎯 TOTAL BUGS DETECTED: ${bugsFound.length}`);
  console.log('==============================================\n');
  console.log(JSON.stringify(bugsFound, null, 2));
}

runAudit();
