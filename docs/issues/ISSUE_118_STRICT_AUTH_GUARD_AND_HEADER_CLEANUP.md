# Issue #118: Strict Authentication Guard on Mandi Prices, Localhost Home Redirect & Header Cleanup
**Assignee:** Mihir Jadav (@230493131013mihir) & HarvestMitra Core Team  
**Role:** Project Lead / Full-Stack Architect  
**Branch:** `main` (Verified & Production Certified)  
**Status:** Completed & Tested  

---

### Objectives & User Requirements:
- [x] **Strict Authentication Guard for Mandi Prices & Trader Desk:**
  - Resolved issue where unauthenticated visitors were able to view prices and dispatch inquiries to APMC traders.
  - Implemented strict session validation in `ProtectedRoute.jsx`: any unauthenticated request to `/markets`, `/dashboard`, or feature workspace now immediately redirects to the localhost home page (`/`).
  - Added explicit authentication verification to `handleOpenContactMandi` in `MarketPriceExplorer.jsx`: unauthenticated attempts to connect with APMC traders are blocked with a toast notice.
- [x] **Localhost Home Page Refresh Fix:**
  - Ensured that refreshing the browser while logged out or visiting unauthorized routes reliably keeps/redirects the user to the localhost home page (`/`) instead of remaining in an unauthenticated guest dashboard view.
  - Removed `GuestModeBanner` from `DashboardLayout.jsx` so unauthenticated guest alerts do not appear across workspace layouts.
- [x] **Header Cleanup — Removed "Live Mandi" Elements:**
  - In `Navbar.jsx`: removed `Live Mandi & Logistics` text underneath the HarvestMitra logo; replaced with the clean brand tagline `Smart Decisions. Better Harvests.`.
  - In `Navbar.jsx` & `Sidebar.jsx`: updated navigation menu labels from `Live Mandis` to `Mandi Prices`.
  - In `MarketsPage.jsx`: completely removed the `Live APMC Mandi Data` badge from the header section.

---

### Touched Files:
- `frontend/src/components/common/ProtectedRoute.jsx`: Redirect unauthenticated users to `/`.
- `frontend/src/components/market/MarketPriceExplorer.jsx`: Guard `handleOpenContactMandi` with `isAuthenticated` check.
- `frontend/src/components/navigation/Navbar.jsx`: Removed "Live Mandi & Logistics" subtitle and updated nav labels.
- `frontend/src/components/navigation/Sidebar.jsx`: Updated nav label fallback to "Mandi Prices".
- `frontend/src/layouts/DashboardLayout.jsx`: Removed `GuestModeBanner`.
- `frontend/src/pages/MarketsPage.jsx`: Removed `Live APMC Mandi Data` header badge.
