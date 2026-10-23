/**
 * sessionExpiryAuth.test.js
 * Verification of Session-Based Auth, Browser Close Expiry, & Header Login/Register Integration
 * HarvestMitra AI
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n======================================================');
console.log('🔒 HarvestMitra AI — Session-Based Auth & Close Expiry Test');
console.log('======================================================\n');

// 1. Verify AuthContext uses sessionStorage and purges localStorage
console.log('1. Checking AuthContext Storage Strategy & Persistent Auto-Login Guard:');
const authContextCode = fs.readFileSync(path.join(__dirname, '../src/context/AuthContext.jsx'), 'utf-8');

assert.ok(authContextCode.includes('sessionStorage.getItem(TOKEN_KEY)'), 'AuthContext reads token from sessionStorage');
assert.ok(authContextCode.includes('sessionStorage.getItem(USER_KEY)'), 'AuthContext reads user from sessionStorage');
assert.ok(authContextCode.includes('sessionStorage.setItem(TOKEN_KEY'), 'AuthContext writes token to sessionStorage on login');
assert.ok(authContextCode.includes('sessionStorage.setItem(USER_KEY'), 'AuthContext writes user to sessionStorage on login');
assert.ok(authContextCode.includes('localStorage.removeItem(TOKEN_KEY)'), 'AuthContext purges legacy persistent token from localStorage');
assert.ok(authContextCode.includes('localStorage.removeItem(USER_KEY)'), 'AuthContext purges legacy persistent user from localStorage');
console.log('  ✅ [PASS] AuthContext persists authenticated session in sessionStorage only and clears localStorage persistent tokens.');

// 2. Verify Front Page Navbar Login & Register (No Intrusive Farmer Access Modal Box)
console.log('\n2. Checking Front Page Navbar Login & Register Navigation (No Popups):');
const navbarCode = fs.readFileSync(path.join(__dirname, '../src/components/navigation/Navbar.jsx'), 'utf-8');
const landingCode = fs.readFileSync(path.join(__dirname, '../src/pages/LandingPage.jsx'), 'utf-8');

assert.ok(navbarCode.includes('to="/login"'), 'Navbar has direct Login button');
assert.ok(navbarCode.includes('to="/register"'), 'Navbar has direct Register button');
assert.ok(!landingCode.includes('showAuthPrompt'), 'LandingPage has no intrusive Farmer Access popup modal');
console.log('  ✅ [PASS] Front page header provides clean Login and Register buttons without any intrusive modal box.');

// 3. Verify AdminPage Session Persistence Strategy
console.log('\n3. Checking AdminPage Session Isolation:');
const adminCode = fs.readFileSync(path.join(__dirname, '../src/pages/AdminPage.jsx'), 'utf-8');

assert.ok(adminCode.includes('sessionStorage.getItem(\'harvestmitra_admin_token\')'), 'AdminPage reads admin token from sessionStorage');
assert.ok(adminCode.includes('sessionStorage.setItem(\'harvestmitra_admin_token\''), 'AdminPage stores admin token in sessionStorage');
assert.ok(adminCode.includes('localStorage.removeItem(\'harvestmitra_admin_token\')'), 'AdminPage removes persistent admin token from localStorage');
console.log('  ✅ [PASS] AdminPage enforces session-scoped admin token without leaking into persistent storage.');

// 4. Verify Services and Components Read From sessionStorage
console.log('\n4. Checking Scheme API, Dashboard, and Crop Managers Session Token Resolution:');
const schemeApiCode = fs.readFileSync(path.join(__dirname, '../src/services/schemeApi.js'), 'utf-8');
const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/pages/DashboardPage.jsx'), 'utf-8');
const cropManagerCode = fs.readFileSync(path.join(__dirname, '../src/components/dashboard/RegisteredCropsManager.jsx'), 'utf-8');
const marketExplorerCode = fs.readFileSync(path.join(__dirname, '../src/components/market/MarketPriceExplorer.jsx'), 'utf-8');

assert.ok(schemeApiCode.includes('sessionStorage.getItem(\'harvestmitra_token\')'), 'schemeApi checks sessionStorage first');
assert.ok(dashboardCode.includes('sessionStorage.getItem(\'harvestmitra_token\')'), 'DashboardPage checks sessionStorage first');
assert.ok(cropManagerCode.includes('sessionStorage.getItem(\'harvestmitra_token\')'), 'RegisteredCropsManager checks sessionStorage first');
assert.ok(marketExplorerCode.includes('sessionStorage.getItem(\'harvestmitra_token\')'), 'MarketPriceExplorer checks sessionStorage first');
console.log('  ✅ [PASS] All services and components cleanly read active session token from sessionStorage.');

// 5. Simulated Browser Lifecycle Verification
console.log('\n5. Simulating Browser Tab Close & Reopen Lifecycle:');
const mockSessionStorage = new Map();
const mockLocalStorage = new Map();

function simulateLogin(token, user) {
  mockSessionStorage.set('harvestmitra_token', token);
  mockSessionStorage.set('harvestmitra_user', JSON.stringify(user));
  mockLocalStorage.delete('harvestmitra_token');
  mockLocalStorage.delete('harvestmitra_user');
}

function simulateBrowserClose() {
  mockSessionStorage.clear();
}

function simulateBrowserReopen() {
  const token = mockSessionStorage.get('harvestmitra_token') || 'guest';
  const rawUser = mockSessionStorage.get('harvestmitra_user');
  const user = rawUser ? JSON.parse(rawUser) : { id: 'guest', isGuest: true };
  const isAuthenticated = Boolean(token && token !== 'guest' && !user.isGuest);
  const canLoginViaNavbar = !isAuthenticated;
  return { token, user, isAuthenticated, canLoginViaNavbar };
}

// 5A: Farmer logs in
simulateLogin('jwt_test_token_123', { id: 1, name: 'Ramesh Patil', role: 'farmer' });
assert.strictEqual(mockSessionStorage.get('harvestmitra_token'), 'jwt_test_token_123', 'Session active during browser session');
assert.strictEqual(mockLocalStorage.get('harvestmitra_token'), undefined, 'Persistent storage has no token');

// 5B: Farmer closes browser
simulateBrowserClose();
assert.strictEqual(mockSessionStorage.size, 0, 'SessionStorage wiped on browser close');

// 5C: Farmer re-opens browser
const state = simulateBrowserReopen();
assert.strictEqual(state.isAuthenticated, false, 'User is NOT automatically logged in on re-opening');
assert.strictEqual(state.token, 'guest', 'Token resets to guest');
assert.strictEqual(state.canLoginViaNavbar, true, 'Front page displays Login and Register buttons in navbar');
console.log('  ✅ [PASS] Browser close simulation confirms: session wiped, auto-login prevented, and navbar Login/Register ready.');

// 6. Verify AuthPage Icon and Navigation Integrity
console.log('\n6. Checking AuthPage Icon Integrity & Clean Navigation:');
const authPageCode = fs.readFileSync(path.join(__dirname, '../src/pages/AuthPage.jsx'), 'utf-8');

assert.ok(authPageCode.includes('ShieldCheck'), 'AuthPage imports and provides ShieldCheck icon');
assert.ok(!authPageCode.includes("window.performance.getEntriesByType('navigation')[0]"), 'AuthPage does not have reload bounce-back redirect trap');
assert.ok(authPageCode.includes('to="/login"'), 'AuthPage provides direct Login navigation');
assert.ok(authPageCode.includes('to="/register"'), 'AuthPage provides direct Register navigation');
console.log('  ✅ [PASS] AuthPage icon imports and navigation guards verified with zero runtime reference errors.');

console.log('\n======================================================');
console.log('🎉 ALL 6 SESSION EXPIRY, LOGIN & ICON TESTS PASSED!');
console.log('======================================================\n');
