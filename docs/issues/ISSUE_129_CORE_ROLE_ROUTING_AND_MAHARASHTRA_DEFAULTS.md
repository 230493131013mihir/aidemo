# Issue #129: Role-Based Registration Redirect & Maharashtra APMC State Defaults

## 📌 Executive Summary
**Owner:** Mihir Jadav (@230493131013mihir) — Lead Backend & Full-Stack Architect  
**Branch:** `fix/mihir-backend-core-bugs`  
**Commit:** `12af00a`  
**Status:** ✅ Completed, Verified with Automated Test Suite & Pushed to Remote

---

## 🎯 Bug Specifications & Fixes Implemented

### Bug 1: Registration redirects all roles to /dashboard
- **Severity:** HIGH
- **File:** `frontend/src/pages/AuthPage.jsx:326-339`
- **Problem:** After successful registration, `navigate('/dashboard')` was hardcoded for all users. Transporters, Mandis, and Admins were incorrectly landed on the Farmer Dashboard.
- **Fix:** Implemented role-based routing switch:
  - `role === 'admin'` ➔ `navigate('/admin')`
  - `role === 'transporter'` ➔ `navigate('/transport')`
  - `role === 'mandi'` ➔ `navigate('/markets')`
  - Default / Farmer ➔ `navigate('/dashboard')`

### Bug 2: Admin Price Form defaults state to "Gujarat" instead of "Maharashtra"
- **Severity:** MEDIUM
- **File:** `frontend/src/pages/AdminPage.jsx:71`
- **Problem:** `priceForm` state initialized with `state: 'Gujarat'`, causing admin APMC price entry to default to Gujarat instead of Maharashtra.
- **Fix:** Updated default state to `state: 'Maharashtra'`.

### Bug 3: marketPriceService fallback state is "Gujarat"
- **Severity:** MEDIUM
- **File:** `backend/services/marketPriceService.js:226`
- **Problem:** In `listPublicMarketPrices()`, fallback state was `item.Market?.state || "Gujarat"`.
- **Fix:** Updated fallback to `item.Market?.state || "Maharashtra"`.

### Bug 4: farmReportService defaults to Gujarat/Surat/Bardoli farmer profile
- **Severity:** MEDIUM
- **File:** `backend/services/farmReportService.js:17-28`
- **Problem:** Decision report fallback farmer was 'Ramesh Patel' from 'Bardoli, Surat, Gujarat' with 'Surat APMC Mandi'.
- **Fix:** Switched defaults to Maharashtra APMC ecosystem:
  - `farmerName`: 'Ramesh Patil'
  - `village`: 'Haveli'
  - `district`: 'Pune'
  - `state`: 'Maharashtra'
  - `localMandi`: 'Pune APMC Mandi (Gultekdi)'
  - `regionalMandi`: 'Mumbai APMC (Vashi)'

### Bug 5: distanceFromSuratKm field name is Surat-specific
- **Severity:** LOW
- **File:** `backend/services/marketPriceService.js:227`
- **Problem:** Field name `distanceFromSuratKm` was tailored to Surat while the application serves Maharashtra.
- **Fix:** Added generic alias: `distanceKm: Number(item.Market?.distanceFromSuratKm || 0)` alongside backwards-compatible `distanceFromSuratKm`.

---

## 🔗 Pull Request & Merge Information
- **Pull Request Title:** `fix(core): Role-based registration redirect + Maharashtra state defaults`
- **Base Branch:** `main`
- **Head Branch:** `fix/mihir-backend-core-bugs`
- **Direct GitHub PR Link:** https://github.com/230493131013mihir/aidemo/compare/main...fix/mihir-backend-core-bugs?expand=1
