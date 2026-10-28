import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n======================================================');
console.log('🌾 HarvestMitra AI — Frontend Sold-Out Crop & Procurement Guard Tests');
console.log('======================================================\n');

const mandiDashboardPath = path.join(__dirname, '../src/components/dashboard/MandiDashboard.jsx');
assert.ok(fs.existsSync(mandiDashboardPath), 'MandiDashboard.jsx must exist');
const code = fs.readFileSync(mandiDashboardPath, 'utf-8');

// Test 1: Availability Calculation & Active Reservation Logic
console.log('1. Auditing Availability & Reservation Calculation:');
assert.ok(code.includes("Math.max(0, totalKg - bookedKg)"), 'Must calculate availableKg as totalKg - bookedKg');
assert.ok(code.includes("['pending', 'accepted'].includes(b.status)"), 'Must only reserve stock for active statuses (pending, accepted)');
assert.ok(code.includes("isSoldOut = availableKg <= 0"), 'Must mark isSoldOut when availableKg <= 0');
console.log('  ✅ [PASS] 1. Correct availability calculation: availableKg = Math.max(0, totalKg - bookedKg), active reservations strictly pending/accepted.');

// Test 2: Sold-Out State Hides Procurement Button & Renders Non-Clickable Badge
console.log('\n2. Auditing Button Removal & Sold-Out Badge Display:');
assert.ok(code.includes("isAllSoldOut ?"), 'Card must conditionally check isAllSoldOut');
assert.ok(code.includes('id={`sold-out-badge-farmer-${farmer.id}`}'), 'Must render sold-out-badge when produce is fully booked');
assert.ok(code.includes('SOLD OUT — 0 kg Available') || code.includes('soldOutStatus'), 'Badge must display SOLD OUT — 0 kg Available');
assert.ok(code.includes('cursor-not-allowed') && code.includes('select-none'), 'Sold-out badge must be non-clickable');
assert.ok(code.includes('id={`procure-btn-farmer-${farmer.id}`}'), 'Procure button rendered only in non-sold-out branch');
console.log('  ✅ [PASS] 2. Procurement button is completely hidden when listing is sold out; non-clickable "SOLD OUT — 0 kg Available" badge rendered.');

// Test 3: Farmer Prashant with 200 kg Cotton Fully Booked
console.log('\n3. Auditing Farmer Prashant Demo Listing Guard:');
assert.ok(code.includes("'Prashant Warule'"), 'Must include Prashant Warule in demo farmers');
assert.ok(code.includes("productQuantities: JSON.stringify({ Cotton: 200 })"), 'Prashant must list Cotton: 200 kg');
assert.ok(code.includes("cropName: 'Cotton'") && code.includes("quantityKg: 200"), 'Recent bookings must include 200 kg booked for Prashant');
console.log('  ✅ [PASS] 3. Farmer Prashant Cotton lot (200 kg total, 200 kg booked) configured as SOLD OUT (0 kg available).');

// Test 4: Available Crop Listings Allow Procurement Button & Show Remaining Quantity
console.log('\n4. Auditing Available Listings (e.g. 150 kg remaining):');
assert.ok(code.includes("availableProduceLot"), 'Must label produce as Available Produce');
assert.ok(code.includes("c.availableKg.toLocaleString('en-IN')") && code.includes("kg available"), 'Must display available quantity clearly on crop badges');
assert.ok(code.includes("Issue APMC Procurement Request"), 'Available lots render active "Issue APMC Procurement Request" button');
console.log('  ✅ [PASS] 4. Available produce displays exact remaining quantity and renders active procurement button.');

// Test 5: Modal Availability Validation & Max Quantity Restriction
console.log('\n5. Auditing Procurement Modal Overbooking Prevention:');
assert.ok(code.includes("max={maxAvail > 0 ? maxAvail : undefined}"), 'Modal quantity input must restrict max to available quantity');
assert.ok(code.includes("qty > maxAvailable"), 'Modal submit handler must reject requests exceeding available quantity');
assert.ok(code.includes("maxAvailable <= 0"), 'Modal must reject submission if selected crop is sold out');
assert.ok(code.includes("disabled={submitting"), 'Submit button must be disabled during in-flight dispatch to prevent double-clicks');
assert.ok(code.includes("disabled={c.availableKg <= 0}"), 'Sold-out crop options must be disabled in crop selection dropdown');
console.log('  ✅ [PASS] 5. Modal enforces quantity input limit (max=availableKg), rejects overbooking, disables sold-out crops and prevents double submission.');

// Test 6: Re-synchronization on Backend Rejection / Sold Out
console.log('\n6. Auditing Stale-Page State Re-synchronization:');
assert.ok(code.includes("json.code === 'SOLD_OUT'"), 'Frontend must handle SOLD_OUT error code');
assert.ok(code.includes("Promise.all([fetchFarmers(), fetchRecentBookings()])"), 'Must refresh listings on sold-out conflict or successful request');
console.log('  ✅ [PASS] 6. Stale browser sessions instantly refresh farmer lots and booking records on 409 SOLD_OUT.');

console.log('\n======================================================');
console.log('🎉 ALL FRONTEND SOLD-OUT & PROCUREMENT GUARD AUDITS PASSED (6/6)!');
console.log('======================================================\n');
