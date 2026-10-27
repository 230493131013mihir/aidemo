/**
 * sidebarScrolling.test.js
 * Verification Suite for Farmer & Transport Dashboard Sidebar Vertical Scrolling,
 * Independent Scroll Mechanics, Sticky Positioning, and Responsive Layout.
 * HarvestMitra AI
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n======================================================');
console.log('🌾 HarvestMitra AI — Sidebar Scrolling & Layout Test Suite');
console.log('======================================================\n');

// 1. Auditing Sidebar.jsx Component Implementation
console.log('1. Auditing Sidebar.jsx Scroll & Layout Configuration:');
const sidebarPath = path.join(__dirname, '../src/components/navigation/Sidebar.jsx');
assert.ok(fs.existsSync(sidebarPath), 'Sidebar.jsx must exist');
const sidebarCode = fs.readFileSync(sidebarPath, 'utf-8');

// A. Desktop Sidebar Configuration
assert.ok(sidebarCode.includes('id="dashboard-sidebar-desktop"'), 'Must have desktop sidebar id');
assert.ok(sidebarCode.includes('h-[calc(100vh-4rem)]'), 'Desktop sidebar must have explicit height constrained to viewport minus navbar');
assert.ok(sidebarCode.includes('overflow-y-auto'), 'Desktop sidebar must have overflow-y-auto for vertical scrolling');
assert.ok(sidebarCode.includes('overflow-x-hidden'), 'Desktop sidebar must prevent horizontal scrolling');
assert.ok(sidebarCode.includes('min-h-0'), 'Desktop sidebar must have min-h-0 for proper flex shrinking and overflow triggers');
assert.ok(sidebarCode.includes('sticky') && sidebarCode.includes('top-16'), 'Desktop sidebar must be sticky top-16');
assert.ok(sidebarCode.includes('shrink-0'), 'Desktop sidebar must have shrink-0 to prevent flex compression');
assert.ok(sidebarCode.includes('sidebar-scroll'), 'Desktop sidebar must use sidebar-scroll class');

// B. Inner Content Sizing
assert.ok(sidebarCode.includes('min-h-full'), 'Sidebar content must use min-h-full to allow full scrolling when content exceeds height');
assert.ok(sidebarCode.includes('flex flex-col justify-between'), 'Sidebar content must use flex flex-col justify-between for clean vertical layout');

// C. Mobile Drawer Configuration
assert.ok(sidebarCode.includes('id="dashboard-sidebar-mobile"'), 'Must have mobile drawer id');
assert.ok(sidebarCode.includes('fixed inset-y-0 left-0'), 'Mobile drawer must be fixed inset-y-0');
assert.ok(sidebarCode.includes('overflow-y-auto') && sidebarCode.includes('min-h-0'), 'Mobile drawer must support independent scrolling with min-h-0');

console.log('  ✅ [PASS] Desktop & Mobile sidebars configured with h-[calc(100vh-4rem)], overflow-y-auto, min-h-0, and sticky positioning.');

// 2. Farmer Dashboard Sidebar Menu Items & Roles
console.log('\n2. Auditing Farmer Dashboard Sidebar Menu Items:');
// Verify Farmer Navigation Items
assert.ok(sidebarCode.includes("label: t('nav.dashboard', 'Dashboard')"), 'Farmer menu must include Dashboard');
assert.ok(sidebarCode.includes("label: t('nav.markets', 'Mandi Prices')"), 'Farmer menu must include Mandi Prices');
assert.ok(sidebarCode.includes("label: t('nav.harvest', 'Harvest Simulator')"), 'Farmer menu must include Harvest Simulator');
assert.ok(sidebarCode.includes("label: t('nav.schemes', 'Govt Schemes')"), 'Farmer menu must include Govt Schemes');
assert.ok(sidebarCode.includes("label: t('nav.transport', 'Shared Transport')"), 'Farmer menu must include Shared Transport');
assert.ok(sidebarCode.includes("label: t('nav.weather', 'Weather Alerts')"), 'Farmer menu must include Weather Alerts');
assert.ok(sidebarCode.includes("label: t('nav.chat', 'Mitra Assistant')"), 'Farmer menu must include Mitra Assistant');

// Verify Farmer Status & Account options
assert.ok(sidebarCode.includes('Farmer / Producer'), 'Must display Farmer / Producer role designation');
assert.ok(sidebarCode.includes('profileLabel'), 'Must include profile navigation');
assert.ok(sidebarCode.includes('sidebar-sign-out-btn'), 'Must include sign out button');
assert.ok(sidebarCode.includes('HarvestMitra Core'), 'Must display version seal at bottom');
console.log('  ✅ [PASS] All 7 Farmer menu items, user card, profile, and logout accessible in Farmer sidebar.');

// 3. Transport Dashboard Sidebar Menu Items
console.log('\n3. Auditing Transport Dashboard Sidebar Menu Items:');
assert.ok(sidebarCode.includes("'Logistics Dashboard'"), 'Transporter menu must include Logistics Dashboard');
assert.ok(sidebarCode.includes("'Cargo Trips & Gate Pass'"), 'Transporter menu must include Cargo Trips & Gate Pass');
assert.ok(sidebarCode.includes("'Route Weather Alerts'"), 'Transporter menu must include Route Weather Alerts');
assert.ok(sidebarCode.includes("label: t('nav.markets', 'Mandi Prices')"), 'Transporter menu must include Mandi Prices');
assert.ok(sidebarCode.includes("label: t('nav.chat', 'Mitra Assistant')"), 'Transporter menu must include Mitra Assistant');
assert.ok(sidebarCode.includes('Transporter / Driver'), 'Must display Transporter / Driver role designation');
console.log('  ✅ [PASS] All Transporter menu items, user card, profile, and logout accessible in Transport sidebar.');

// 4. Auditing DashboardLayout.jsx Parent Containers
console.log('\n4. Auditing DashboardLayout.jsx Parent Containers for Scroll Prevention:');
const layoutPath = path.join(__dirname, '../src/layouts/DashboardLayout.jsx');
assert.ok(fs.existsSync(layoutPath), 'DashboardLayout.jsx must exist');
const layoutCode = fs.readFileSync(layoutPath, 'utf-8');

// Verify that the flex wrapper holding Sidebar does NOT have overflow-x-hidden (which breaks position: sticky)
assert.ok(
  !layoutCode.includes('<div className="flex-1 flex max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">'),
  'Flex container holding Sidebar must NOT have overflow-x-hidden which breaks sticky scrolling'
);
assert.ok(
  layoutCode.includes('className="flex-1 flex max-w-7xl w-full mx-auto min-w-0"'),
  'Flex container holding Sidebar must have clean min-w-0 without sticky-breaking overflow'
);

// Verify content area retains overflow protection
assert.ok(
  layoutCode.includes('overflow-x-hidden'),
  'Content viewport must retain overflow-x-hidden to prevent layout breaking from wide child tables or charts'
);
console.log('  ✅ [PASS] DashboardLayout.jsx parent containers allow position: sticky to function correctly.');

// 5. Auditing index.css Sidebar Scrolling Utility Rules
console.log('\n5. Auditing index.css Sidebar Scroll CSS Rules:');
const cssPath = path.join(__dirname, '../src/index.css');
assert.ok(fs.existsSync(cssPath), 'index.css must exist');
const cssCode = fs.readFileSync(cssPath, 'utf-8');

assert.ok(cssCode.includes('.sidebar-scroll'), 'Must define .sidebar-scroll class');
assert.ok(cssCode.includes('overscroll-behavior-y: contain'), 'Must contain overscroll to prevent document scroll chaining');
assert.ok(cssCode.includes('-webkit-overflow-scrolling: touch'), 'Must support momentum touch scrolling');
assert.ok(cssCode.includes('scrollbar-width: thin'), 'Must define thin scrollbars for modern browsers');
console.log('  ✅ [PASS] index.css defines smooth .sidebar-scroll utility rules.');

// 6. Auditing NetworkStatusBadge Positioning (No Sidebar Overlap)
console.log('\n6. Auditing NetworkStatusBadge Desktop Offset:');
const badgePath = path.join(__dirname, '../src/components/common/NetworkStatusBadge.jsx');
assert.ok(fs.existsSync(badgePath), 'NetworkStatusBadge.jsx must exist');
const badgeCode = fs.readFileSync(badgePath, 'utf-8');

assert.ok(
  badgeCode.includes('lg:left-72'),
  'NetworkStatusBadge must be offset on desktop (lg:left-72) so it does not overlap the w-64 sidebar'
);
console.log('  ✅ [PASS] NetworkStatusBadge offset away from sidebar on desktop.');

console.log('\n======================================================');
console.log('🎉 ALL SIDEBAR SCROLLING & LAYOUT TESTS PASSED (6/6)!');
console.log('======================================================\n');
