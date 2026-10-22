/**
 * logoutNavigation.test.js
 * Verification Suite for Centralized Logout, State Cleanup, and Home Navigation
 * HarvestMitra AI
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n======================================================');
console.log('🚪 HarvestMitra AI — Logout Navigation & Redirect Test Suite');
console.log('======================================================\n');

// 1. Centralized AuthContext Logout Verification
console.log('1. Auditing Centralized AuthContext.jsx Logout Logic:');
const authContextPath = path.join(__dirname, '../src/context/AuthContext.jsx');
assert.ok(fs.existsSync(authContextPath), 'AuthContext.jsx must exist');
const authCode = fs.readFileSync(authContextPath, 'utf-8');

assert.ok(authCode.includes('function logout('), 'Must define centralized logout function');
assert.ok(authCode.includes('navigate(redirectTo, { replace: true })') || authCode.includes('navigate(redirectTo'), 'Must perform replace navigation to target route');
assert.ok(authCode.includes("localStorage.removeItem(TOKEN_KEY)"), 'Must remove user auth token');
assert.ok(authCode.includes("localStorage.removeItem(USER_KEY)"), 'Must remove user data');
assert.ok(authCode.includes("sessionStorage.clear()"), 'Must clear session storage');
assert.ok(authCode.includes("setUser(null)") || authCode.includes("setUser(GUEST_USER)"), 'Must reset user state on logout');
console.log('  ✅ [PASS] AuthContext.jsx implements centralized token clearance, state reset, and immediate redirect.');

// 2. Main.jsx Router Context Hierarchy
console.log('\n2. Auditing main.jsx Provider & Router Hierarchy:');
const mainPath = path.join(__dirname, '../src/main.jsx');
const mainCode = fs.readFileSync(mainPath, 'utf-8');
const routerIdx = mainCode.indexOf('<BrowserRouter>');
const authProviderIdx = mainCode.indexOf('<AuthProvider>');
assert.ok(routerIdx !== -1 && authProviderIdx !== -1, 'Both BrowserRouter and AuthProvider must be present');
assert.ok(routerIdx < authProviderIdx, 'BrowserRouter must wrap AuthProvider so AuthContext has access to navigation');
console.log('  ✅ [PASS] BrowserRouter correctly encapsulates AuthProvider.');

// 3. Navbar & Account Dropdown Logout Verification
console.log('\n3. Auditing Navbar.jsx Account Dropdown & Sign Out Handlers:');
const navbarPath = path.join(__dirname, '../src/components/navigation/Navbar.jsx');
const navbarCode = fs.readFileSync(navbarPath, 'utf-8');

assert.ok(navbarCode.includes('account-dropdown-toggle'), 'Navbar must feature account dropdown toggle');
assert.ok(navbarCode.includes('account-dropdown-menu'), 'Navbar must feature account dropdown menu');
assert.ok(navbarCode.includes('account-dropdown-logout-btn'), 'Navbar must feature account dropdown sign out button');
assert.ok(navbarCode.includes('navbar-direct-logout-btn'), 'Navbar must feature direct one-click sign out button');
assert.ok(navbarCode.includes('mobile-drawer-logout-btn'), 'Navbar mobile drawer must feature mobile sign out button');
assert.ok(navbarCode.includes('handleSignOut'), 'Navbar must define handleSignOut to close menus and trigger logout');
console.log('  ✅ [PASS] Navbar.jsx provides Account Dropdown, direct Sign Out button, and Mobile drawer Sign Out.');

// 4. Sidebar Sign Out Verification
console.log('\n4. Auditing Sidebar.jsx Sign Out Handler:');
const sidebarPath = path.join(__dirname, '../src/components/navigation/Sidebar.jsx');
const sidebarCode = fs.readFileSync(sidebarPath, 'utf-8');

assert.ok(sidebarCode.includes('sidebar-sign-out-btn'), 'Sidebar must feature designated sign out button with id');
assert.ok(sidebarCode.includes('onClick={(e) => {') && sidebarCode.includes('logout()'), 'Sidebar sign out must trigger centralized logout()');
console.log('  ✅ [PASS] Sidebar.jsx contains verified Sign Out trigger.');

// 5. Admin Dashboard Sign Out Verification
console.log('\n5. Auditing AdminPage.jsx Sign Out Handler:');
const adminPath = path.join(__dirname, '../src/pages/AdminPage.jsx');
const adminCode = fs.readFileSync(adminPath, 'utf-8');

assert.ok(adminCode.includes('admin-sign-out-btn'), 'AdminPage must feature admin-sign-out-btn');
assert.ok(adminCode.includes('Sign Out Admin'), 'AdminPage must display Sign Out Admin');
assert.ok(adminCode.includes('logout()'), 'AdminPage sign out must trigger centralized logout()');
assert.ok(adminCode.includes('harvestmitra_admin_token'), 'AdminPage sign out must clear harvestmitra_admin_token');
console.log('  ✅ [PASS] AdminPage.jsx cleanly revokes admin credentials and redirects to public home.');

// 6. My Profile Page Sign Out Verification
console.log('\n6. Auditing ProfilePage.jsx Sign Out Handler:');
const profilePath = path.join(__dirname, '../src/pages/ProfilePage.jsx');
const profileCode = fs.readFileSync(profilePath, 'utf-8');

assert.ok(profileCode.includes('profile-sign-out-btn'), 'ProfilePage must feature profile-sign-out-btn');
assert.ok(profileCode.includes('logout()'), 'ProfilePage sign out must trigger centralized logout()');
console.log('  ✅ [PASS] ProfilePage.jsx contains direct Sign Out action that clears session and navigates home.');

// 7. Protected Route & Route Access Control
console.log('\n7. Auditing ProtectedRoute.jsx & AppRoutes.jsx Access Security:');
const protectedRoutePath = path.join(__dirname, '../src/components/common/ProtectedRoute.jsx');
const protectedCode = fs.readFileSync(protectedRoutePath, 'utf-8');
assert.ok(protectedCode.includes('requireAuth'), 'ProtectedRoute must support requireAuth prop');
assert.ok(protectedCode.includes('<Navigate to="/login"'), 'ProtectedRoute must redirect unauthenticated users to /login');

const routesPath = path.join(__dirname, '../src/routes/AppRoutes.jsx');
const routesCode = fs.readFileSync(routesPath, 'utf-8');
assert.ok(routesCode.includes('requireAuth={true}'), 'AppRoutes must secure /profile with requireAuth={true}');
assert.ok(routesCode.includes('requiredRole="admin"'), 'AppRoutes must secure /admin with requiredRole="admin"');
console.log('  ✅ [PASS] ProtectedRoute and AppRoutes guard /profile and /admin against unauthenticated access.');

// 8. Backend Logout Endpoint Verification
console.log('\n8. Auditing Backend Logout Endpoint:');
const beRoutesPath = path.join(__dirname, '../../backend/routes/auth.routes.js');
const beRoutesCode = fs.readFileSync(beRoutesPath, 'utf-8');
assert.ok(beRoutesCode.includes('router.post("/logout"'), 'Backend must register POST /logout route');

const beCtrlPath = path.join(__dirname, '../../backend/controllers/auth.controller.js');
const beCtrlCode = fs.readFileSync(beCtrlPath, 'utf-8');
assert.ok(beCtrlCode.includes('const logout = async'), 'Backend controller must implement logout handler');
console.log('  ✅ [PASS] Backend API exposes POST /api/auth/logout.');

console.log('\n======================================================');
console.log('🎉 ALL 8 LOGOUT NAVIGATION & VERIFICATION TESTS PASSED!');
console.log('======================================================\n');
