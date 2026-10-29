import { strictEqual, ok } from 'node:assert';

// Simulated isItemActive logic extracted directly from Sidebar.jsx
function testIsItemActive(to, location, role) {
  const isTransporter = role === 'transporter';
  const isMandi = role === 'mandi';
  const isAdmin = role === 'admin';
  const isFpo = role === 'fpo';

  const currentPath = location.pathname;
  const currentParams = new URLSearchParams(location.search);
  const currentTab = currentParams.get('tab');
  const currentHash = location.hash;

  const [targetPathWithHash, targetSearch] = to.split('?');
  const [targetPath, targetHash] = targetPathWithHash.split('#');
  const targetParams = new URLSearchParams(targetSearch || '');
  const targetTab = targetParams.get('tab');

  if (isTransporter) {
    if (to === '/dashboard') {
      return (currentPath === '/dashboard' && (!currentTab || currentTab === 'overview')) ||
             (currentPath === '/transport' && (!currentTab || currentTab === 'overview'));
    }
    if (targetPath === '/transport') {
      if (currentPath !== '/transport') return false;
      if (targetTab === 'available') return currentTab === 'available' || currentTab === 'shared';
      if (targetTab === 'active') return currentTab === 'active' || currentTab === 'gatepass';
      return currentTab === targetTab;
    }
    if (to === '/weather') return currentPath === '/weather';
    if (to === '/markets') return currentPath === '/markets' || currentPath === '/prices';
    if (to === '/chat') return currentPath === '/chat' || currentPath === '/assistant';
    return currentPath === targetPath;
  }

  if (isMandi) {
    if (to === '/dashboard') {
      return currentPath === '/dashboard' && (!currentTab || currentTab === 'overview');
    }
    if (targetPath === '/dashboard') {
      if (currentPath !== '/dashboard') return false;
      return currentTab === targetTab;
    }
    if (to === '/markets') return currentPath === '/markets' || currentPath === '/prices';
    if (to === '/chat') return currentPath === '/chat' || currentPath === '/assistant';
    return currentPath === targetPath;
  }

  if (isAdmin) {
    if (to === '/admin') return currentPath === '/admin';
    if (to === '/markets') return currentPath === '/markets' || currentPath === '/prices';
    if (to === '/schemes') return currentPath === '/schemes';
    if (to === '/chat') return currentPath === '/chat' || currentPath === '/assistant';
    return currentPath === targetPath;
  }

  if (isFpo) {
    if (to === '/fpo/dashboard') return currentPath === '/fpo/dashboard' || currentPath === '/fpo';
    if (to === '/chat') return currentPath === '/chat' || currentPath === '/assistant';
    return currentPath === targetPath;
  }

  if (targetHash) return currentPath === targetPath && currentHash === `#${targetHash}`;
  if (targetTab) return currentPath === targetPath && currentTab === targetTab;
  if (to === '/dashboard') return currentPath === '/dashboard' && !currentHash && (!currentTab || currentTab === 'overview');
  if (to === '/markets') return (currentPath === '/markets' || currentPath === '/prices') && !currentHash;
  if (to === '/harvest') return (currentPath === '/harvest' || currentPath === '/simulator') && !currentHash;
  if (to === '/transport') return currentPath === '/transport' && !currentHash && (!currentTab || currentTab === 'overview');
  if (to === '/chat') return (currentPath === '/chat' || currentPath === '/assistant') && !currentTab;
  return currentPath === targetPath;
}

const transporterItems = [
  { to: '/dashboard', label: 'Logistics Dashboard' },
  { to: '/transport?tab=fleet', label: 'My Vehicles' },
  { to: '/transport?tab=available', label: 'Available Trips' },
  { to: '/transport?tab=requests', label: 'Booking Requests' },
  { to: '/transport?tab=active', label: 'Cargo Trips & Gate Pass' },
  { to: '/transport?tab=history', label: 'Earnings & Trip History' },
  { to: '/weather', label: 'Route Weather Alerts' },
  { to: '/markets', label: 'Mandi Prices' },
  { to: '/chat', label: 'Mitra Assistant' }
];

const mandiItems = [
  { to: '/dashboard', label: 'Mandi Dashboard' },
  { to: '/dashboard?tab=listings', label: 'Incoming Crop Listings' },
  { to: '/dashboard?tab=bookings', label: 'Procurement & Bookings' },
  { to: '/markets', label: 'Live APMC Rates' },
  { to: '/chat', label: 'Mitra Assistant' }
];

console.log('--- 1. Testing Transporter Sidebar Active Item Uniqueness ---');

function countActive(items, loc, role) {
  return items.filter(i => testIsItemActive(i.to, loc, role));
}

// 1. Open /transport (no tab)
{
  const loc = { pathname: '/transport', search: '', hash: '' };
  const active = countActive(transporterItems, loc, 'transporter');
  strictEqual(active.length, 1, 'Only one item active for /transport');
  strictEqual(active[0].label, 'Logistics Dashboard');
  console.log('✅ Open /transport: only "Logistics Dashboard" is active');
}

// 2. Open /transport?tab=fleet (My Vehicles)
{
  const loc = { pathname: '/transport', search: '?tab=fleet', hash: '' };
  const active = countActive(transporterItems, loc, 'transporter');
  strictEqual(active.length, 1, 'Only one item active for fleet');
  strictEqual(active[0].label, 'My Vehicles');
  console.log('✅ Open My Vehicles: only "My Vehicles" is active');
}

// 3. Open /transport?tab=available (Available Trips)
{
  const loc = { pathname: '/transport', search: '?tab=available', hash: '' };
  const active = countActive(transporterItems, loc, 'transporter');
  strictEqual(active.length, 1, 'Only one item active for available');
  strictEqual(active[0].label, 'Available Trips');
  console.log('✅ Open Available Trips: only "Available Trips" is active');
}

// 3b. Open /transport?tab=shared (Shared trips alias)
{
  const loc = { pathname: '/transport', search: '?tab=shared', hash: '' };
  const active = countActive(transporterItems, loc, 'transporter');
  strictEqual(active.length, 1, 'Only one item active for shared');
  strictEqual(active[0].label, 'Available Trips');
  console.log('✅ Open ?tab=shared alias: maps correctly to "Available Trips"');
}

// 4. Open /transport?tab=requests (Booking Requests)
{
  const loc = { pathname: '/transport', search: '?tab=requests', hash: '' };
  const active = countActive(transporterItems, loc, 'transporter');
  strictEqual(active.length, 1, 'Only one item active for requests');
  strictEqual(active[0].label, 'Booking Requests');
  console.log('✅ Open Booking Requests: only "Booking Requests" is active');
}

// 5. Open /transport?tab=active (Cargo Trips & Gate Pass)
{
  const loc = { pathname: '/transport', search: '?tab=active', hash: '' };
  const active = countActive(transporterItems, loc, 'transporter');
  strictEqual(active.length, 1, 'Only one item active for active trips');
  strictEqual(active[0].label, 'Cargo Trips & Gate Pass');
  console.log('✅ Open Cargo Trips: only "Cargo Trips & Gate Pass" is active');
}

// 6. Open /transport?tab=history (Earnings & Trip History)
{
  const loc = { pathname: '/transport', search: '?tab=history', hash: '' };
  const active = countActive(transporterItems, loc, 'transporter');
  strictEqual(active.length, 1, 'Only one item active for history');
  strictEqual(active[0].label, 'Earnings & Trip History');
  console.log('✅ Open History: only "Earnings & Trip History" is active');
}

// 7. Open /weather (Route Weather Alerts)
{
  const loc = { pathname: '/weather', search: '', hash: '' };
  const active = countActive(transporterItems, loc, 'transporter');
  strictEqual(active.length, 1, 'Only one item active for weather');
  strictEqual(active[0].label, 'Route Weather Alerts');
  console.log('✅ Open Route Weather Alerts: only "Route Weather Alerts" is active');
}

// 8. Open /markets (Mandi Prices)
{
  const loc = { pathname: '/markets', search: '', hash: '' };
  const active = countActive(transporterItems, loc, 'transporter');
  strictEqual(active.length, 1, 'Only one item active for markets');
  strictEqual(active[0].label, 'Mandi Prices');
  console.log('✅ Open Mandi Prices: only "Mandi Prices" is active');
}

// 9. Open /chat (Mitra Assistant)
{
  const loc = { pathname: '/chat', search: '', hash: '' };
  const active = countActive(transporterItems, loc, 'transporter');
  strictEqual(active.length, 1, 'Only one item active for chat');
  strictEqual(active[0].label, 'Mitra Assistant');
  console.log('✅ Open Mitra Assistant: only "Mitra Assistant" is active');
}

console.log('\n--- 2. Testing APMC Mandi Sidebar Active Item Uniqueness ---');

// 1. Open /dashboard (Mandi Dashboard)
{
  const loc = { pathname: '/dashboard', search: '', hash: '' };
  const active = countActive(mandiItems, loc, 'mandi');
  strictEqual(active.length, 1, 'Only one item active for mandi dashboard');
  strictEqual(active[0].label, 'Mandi Dashboard');
  console.log('✅ Open /dashboard: only "Mandi Dashboard" is active');
}

// 2. Open /dashboard?tab=listings (Incoming Crop Listings)
{
  const loc = { pathname: '/dashboard', search: '?tab=listings', hash: '' };
  const active = countActive(mandiItems, loc, 'mandi');
  strictEqual(active.length, 1, 'Only one item active for listings');
  strictEqual(active[0].label, 'Incoming Crop Listings');
  console.log('✅ Open Incoming Crop Listings: only "Incoming Crop Listings" is active');
}

// 3. Open /dashboard?tab=bookings (Procurement & Bookings)
{
  const loc = { pathname: '/dashboard', search: '?tab=bookings', hash: '' };
  const active = countActive(mandiItems, loc, 'mandi');
  strictEqual(active.length, 1, 'Only one item active for bookings');
  strictEqual(active[0].label, 'Procurement & Bookings');
  console.log('✅ Open Procurement & Bookings: only "Procurement & Bookings" is active');
}

// 4. Open /markets (Live APMC Rates)
{
  const loc = { pathname: '/markets', search: '', hash: '' };
  const active = countActive(mandiItems, loc, 'mandi');
  strictEqual(active.length, 1, 'Only one item active for rates');
  strictEqual(active[0].label, 'Live APMC Rates');
  console.log('✅ Open Live APMC Rates: only "Live APMC Rates" is active');
}

// 5. Open /chat (Mitra Assistant)
{
  const loc = { pathname: '/chat', search: '', hash: '' };
  const active = countActive(mandiItems, loc, 'mandi');
  strictEqual(active.length, 1, 'Only one item active for chat');
  strictEqual(active[0].label, 'Mitra Assistant');
  console.log('✅ Open Mitra Assistant: only "Mitra Assistant" is active');
}

console.log('\n🎉 ALL 14 SIDEBAR NAVIGATION TEST SCENARIOS PASSED PERFECTLY!');
