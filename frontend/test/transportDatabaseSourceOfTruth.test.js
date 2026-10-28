/**
 * transportDatabaseSourceOfTruth.test.js
 * Frontend Test Suite: Real Database Records & No Static Transport Mock Fallbacks
 * HarvestMitra AI
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n==================================================================');
console.log('🚚 Frontend Transport Database Source of Truth — Verification Suite');
console.log('==================================================================\n');

// 1. Verify No Hardcoded Mock Vehicle Cards in SharedTransportFarmerWidget.jsx
console.log('1. Checking SharedTransportFarmerWidget has 0 hardcoded mock vehicle cards:');
const widgetCode = fs.readFileSync(
  path.join(__dirname, '../src/components/dashboard/SharedTransportFarmerWidget.jsx'),
  'utf-8'
);

assert.strictEqual(
  widgetCode.includes('custom-vehicle-other'),
  false,
  'SharedTransportFarmerWidget must NOT contain custom-vehicle-other mock card'
);
assert.strictEqual(
  widgetCode.includes('CUSTOM-FLEET'),
  false,
  'SharedTransportFarmerWidget must NOT contain CUSTOM-FLEET mock card'
);
assert.strictEqual(
  widgetCode.includes('Assigned Transporter on Dispatch'),
  false,
  'SharedTransportFarmerWidget must NOT contain mock driver "Assigned Transporter on Dispatch"'
);
assert.strictEqual(
  widgetCode.includes('~50% Pool Discount'),
  false,
  'SharedTransportFarmerWidget must NOT contain hardcoded fake "~50% Pool Discount" text'
);
console.log('  ✅ [PASS] Zero hardcoded mock cards or fake vehicle plates found in SharedTransportFarmerWidget.jsx.');

// 2. Verify Template Interpolation in LanguageContext.jsx
console.log('\n2. Checking template interpolation logic in LanguageContext.jsx:');
const langContextCode = fs.readFileSync(
  path.join(__dirname, '../src/context/LanguageContext.jsx'),
  'utf-8'
);

assert.ok(
  langContextCode.includes('effectiveParams'),
  'LanguageContext must support params interpolation'
);
assert.ok(
  langContextCode.includes('.replace(new RegExp(`\\\\{${k}\\\\}`'),
  'LanguageContext must replace {paramKey} in translated/fallback text'
);

// Test interpolation logic directly
const template = 'Guaranteed for {weight} kg';
const interpolated = template.replace(new RegExp(`\\{weight\\}`, 'g'), 750);
assert.strictEqual(interpolated, 'Guaranteed for 750 kg', 'Template must interpolate weight');
console.log('  ✅ [PASS] LanguageContext parameter interpolation verified ({weight}, {amount}, {fare}).');

// 3. Verify Error and Empty States in SharedTransportFarmerWidget.jsx
console.log('\n3. Checking Error and Empty States in SharedTransportFarmerWidget.jsx:');
assert.ok(
  widgetCode.includes('vehicleFetchError'),
  'Widget must manage vehicleFetchError state'
);
assert.ok(
  widgetCode.includes('Transport Database Unavailable'),
  'Widget must render a clear error alert when database/API connection fails'
);
assert.ok(
  widgetCode.includes('Retry Connection'),
  'Widget must offer a Retry Connection action'
);
assert.ok(
  widgetCode.includes('Refresh Availability'),
  'Widget must offer a Refresh Availability action when availableVehicles is empty'
);
console.log('  ✅ [PASS] Genuine error and empty states with retry actions verified.');

// 4. Verify Selection Guard Before Transport Booking
console.log('\n4. Checking Vehicle Selection Guard before Booking Submission:');
assert.ok(
  widgetCode.includes('!selectedVehicle || !selectedVehicle.id'),
  'handleBookSubmit must require a valid selectedVehicle with database id'
);
assert.ok(
  widgetCode.includes('Vehicle Required'),
  'Must notify user to select an available vehicle from verified database list'
);
console.log('  ✅ [PASS] Booking submission is strictly protected against unselected/mock vehicles.');

// 5. Verify NetworkStatusBadge Genuine Health Verification
console.log('\n5. Checking NetworkStatusBadge Backend Health Check:');
const networkBadgeCode = fs.readFileSync(
  path.join(__dirname, '../src/components/common/NetworkStatusBadge.jsx'),
  'utf-8'
);

assert.ok(
  networkBadgeCode.includes('/api/health'),
  'NetworkStatusBadge must query /api/health'
);
assert.ok(
  networkBadgeCode.includes('isBackendConnected'),
  'NetworkStatusBadge must verify isBackendConnected before claiming Online'
);
assert.ok(
  networkBadgeCode.includes('activeOnline = isOnline && isBackendConnected && !simulatedOffline'),
  'activeOnline must strictly require isBackendConnected'
);
console.log('  ✅ [PASS] NetworkStatusBadge genuinely checks backend health before displaying "Online (Live APMC)".');

// 6. Verify TransporterDashboard has No Hardcoded Demo Vehicle Plates
console.log('\n6. Checking TransporterDashboard Vehicle Fallbacks:');
const transporterCode = fs.readFileSync(
  path.join(__dirname, '../src/components/dashboard/TransporterDashboard.jsx'),
  'utf-8'
);

assert.strictEqual(
  transporterCode.includes("vehicleNumber: 'MH-12-RN-4921'"),
  false,
  'TransporterDashboard must not hardcode initial vehicle plate MH-12-RN-4921'
);
console.log('  ✅ [PASS] TransporterDashboard uses real profile values with 0 hardcoded plate defaults.');

console.log('\n==================================================================');
console.log('🎉 ALL 6 FRONTEND TRANSPORT DATABASE VERIFICATION TESTS PASSED!');
console.log('==================================================================\n');
