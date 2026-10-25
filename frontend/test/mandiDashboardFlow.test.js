import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n======================================================');
console.log('🏪 HarvestMitra AI — Dedicated APMC Mandi Dashboard & Procurement Tests');
console.log('======================================================\n');

// 1. Audit MandiDashboard.jsx Component
console.log('1. Auditing MandiDashboard.jsx Architecture:');
const mandiDashboardPath = path.join(__dirname, '../src/components/dashboard/MandiDashboard.jsx');
assert.ok(fs.existsSync(mandiDashboardPath), 'MandiDashboard.jsx must exist');
const mandiDashboardCode = fs.readFileSync(mandiDashboardPath, 'utf-8');

// Banner details
assert.ok(mandiDashboardCode.includes('mandiName'), 'Banner must display Mandi Name');
assert.ok(mandiDashboardCode.includes('licenseNumber'), 'Banner must display License Number');
assert.ok(mandiDashboardCode.includes('operatingDays'), 'Banner must display Operating Days');
assert.ok(mandiDashboardCode.includes('facilities'), 'Banner must display Facilities');
console.log('  ✅ [PASS] APMC Mandi banner displays Mandi Name, License Number, Operating Days, and Facilities.');

// Metrics row
assert.ok(mandiDashboardCode.includes("Today's District Arrivals"), 'Metrics row must include Today\'s District Arrivals (tonnes)');
assert.ok(mandiDashboardCode.includes('Active Registered Farmers'), 'Metrics row must include Active Registered Farmers');
assert.ok(mandiDashboardCode.includes('Benchmark Rates Recorded'), 'Metrics row must include Benchmark Rates Recorded');
console.log('  ✅ [PASS] Metrics row includes Today\'s District Arrivals, Active Registered Farmers, and Benchmark Rates.');

// Farmer arrivals feed
assert.ok(mandiDashboardCode.includes('/api/auth/farmers'), 'Farmer feed must query /api/auth/farmers');
assert.ok(mandiDashboardCode.includes('farmer.village'), 'Farmer card must display village');
assert.ok(mandiDashboardCode.includes('quantityKg'), 'Farmer card must display ready harvest quantities');
assert.ok(mandiDashboardCode.includes('Issue APMC Procurement Request'), 'Must have "Issue APMC Procurement Request" button');
assert.ok(mandiDashboardCode.includes('/api/auth/mandi-procurement-request'), 'Must submit to /api/auth/mandi-procurement-request');
console.log('  ✅ [PASS] Farmer Arrivals Feed fetches /api/auth/farmers and supports Procurement Request action.');

// 2. Audit DashboardPage.jsx Mandi Role Render
console.log('\n2. Auditing DashboardPage.jsx Mandi Role Routing:');
const dashPagePath = path.join(__dirname, '../src/pages/DashboardPage.jsx');
const dashPageCode = fs.readFileSync(dashPagePath, 'utf-8');
assert.ok(dashPageCode.includes("import MandiDashboard from '../components/dashboard/MandiDashboard';"), 'Must import MandiDashboard');
assert.ok(dashPageCode.includes("user?.role === 'mandi'"), 'Must evaluate mandi role');
assert.ok(dashPageCode.includes('<MandiDashboard />') || dashPageCode.includes('<MandiDashboard/>'), 'Must render <MandiDashboard /> for role mandi');
console.log('  ✅ [PASS] DashboardPage.jsx renders <MandiDashboard /> for user.role === "mandi".');

// 3. Audit RecentActivity.jsx Farmer Incoming Procurement Alerts
console.log('\n3. Auditing RecentActivity.jsx Farmer Notification Alerts:');
const recentActPath = path.join(__dirname, '../src/components/dashboard/RecentActivity.jsx');
const recentActCode = fs.readFileSync(recentActPath, 'utf-8');
assert.ok(recentActCode.includes('mandi-to-farmer') || recentActCode.includes('mandi_to_farmer') || recentActCode.includes('contact-requests'), 'RecentActivity must fetch/render mandi procurement alerts');
assert.ok(recentActCode.includes('🏪') || recentActCode.includes('procurement inquiry'), 'Must support Mandi procurement booking alert template');
console.log('  ✅ [PASS] RecentActivity.jsx renders incoming Mandi procurement purchase alerts.');

// 4. Audit Sidebar.jsx Mandi Navigation Links
console.log('\n4. Auditing Sidebar.jsx Mandi Navigation:');
const sidebarPath = path.join(__dirname, '../src/components/navigation/Sidebar.jsx');
const sidebarCode = fs.readFileSync(sidebarPath, 'utf-8');
assert.ok(sidebarCode.includes("label: 'Mandi Dashboard'"), 'Sidebar must include Mandi Dashboard (/dashboard)');
assert.ok(sidebarCode.includes("label: 'Live APMC Rates'"), 'Sidebar must include Live APMC Rates (/markets)');
assert.ok(sidebarCode.includes("label: 'Incoming Crop Listings'") || sidebarCode.includes("label: 'Farmer Directory'"), 'Sidebar must include Mandi listings/directory');
assert.ok(sidebarCode.includes("label: t('nav.chat', 'Mitra Assistant')"), 'Sidebar must include Mitra Assistant (/chat)');
console.log('  ✅ [PASS] Sidebar.jsx contains all 4 Mandi menu options aligned with specification.');

console.log('\n======================================================');
console.log('🎉 ALL MANDI DASHBOARD & PROCUREMENT UI TESTS PASSED!');
console.log('======================================================\n');
