# Issue #120: Comprehensive Security Hardening, Transport RBAC, Auth Middleware, and Demo Consistency

## Executive Summary
Full-stack production security hardening, strict transport trip ownership, active single-trip concurrency locking, role-based authorization guards across API endpoints, authenticated client session management, and demo seed data harmonization.

**Branch**: `fix/security-hardening`  
**PR URL**: https://github.com/230493131013mihir/aidemo/pull/new/fix/security-hardening  
**Status**: Ready for Review (DO NOT MERGE TO MAIN UNTIL REVIEWED BY USER)

---

## 🎯 Completed Requirements Matrix

| Task | Area / File(s) | Description | Status |
|---|---|---|---|
| **Task 1** | `backend/routes/transport.routes.js` | `PUT /requests/:id/progress` ownership check (`request.transporterId === req.user.id`, 403 "Not your trip."). Enforce strict transitions (`accepted -> in_transit`, `driver_assigned -> in_transit`, `in_transit -> delivered/completed`, `delivered -> completed`). Accepts both `nextStatus` and `status`. | ✅ Done |
| **Task 2** | `backend/routes/transport.routes.js` | `PUT /requests/:id/accept` concurrency lock: count active trips in `['accepted','driver_assigned','in_transit']` (409 "Finish your active trip first."). Atomic Sequelize update with `status: ['open','pending']` (409 "Already taken or no longer open."). Cannot accept own request (403). Cargo weight capacity check (400). | ✅ Done |
| **Task 3** | `backend/routes/transport.routes.js` | `PUT /bookings/:id/status` (transporterId === req.user.id or admin, 403). `PUT /bookings/:id/reject` (transporterId is null or matches req.user.id or admin, 403; cannot reject delivered/completed, 400). `PUT /bookings/:id/accept` (status in open/pending/confirmed, 409; atomic update + active-trip lock). Allowed status transitions enforced. | ✅ Done |
| **Task 4** | `backend/routes/transport.routes.js` | Rewrote `getTransporterWhereCondition(user)` to strictly return `{ transporterId: user.id }`. Sanitized `farmerPhone` in `GET /open-cargo` and `GET /incoming-requests` for unaccepted requests. Excluded requests assigned to other transporters in `/incoming-requests`. | ✅ Done |
| **Task 5** | `backend/middleware/auth.middleware.js`, `backend/controllers/auth.controller.js`, `backend/server.js`, `.env.example`, `guest_mode.test.js`, `api_security.test.js` | Async `authMiddleware`: reloads user from DB (`User.findByPk`), sets `req.user = { ...decoded, ...dbUser.toJSON() }`, 401 if not found. Wrapped guest access in `ENABLE_GUEST_MODE === 'true'`. Added test verifying 401 when disabled. Removed hardcoded JWT secret fallbacks (mandatory `JWT_SECRET`). Default `JWT_EXPIRES_IN=1d`. | ✅ Done |
| **Task 6** | `backend/routes/chatRoutes.js`, `backend/routes/assistant.routes.js`, `backend/routes/marketRoutes.js`, `backend/routes/report.routes.js`, `backend/controllers/reportController.js`, `frontend/src/services/chatService.js`, `frontend/src/components/common/PrintableReportModal.jsx`, `backend/test/api_security.test.js` | Protected `/api/chat/message`, `/api/assistant/ask`, `/api/reports/*` with `authMiddleware`. Protected `/api/market/sync` and `/alerts/dispatch` with `authMiddleware + adminMiddleware`. Report identity resolved strictly from `req.user` & profile. `PrintableReportModal` fetches with Authorization Bearer header into Blob URL. Added 5 security tests in `api_security.test.js`. | ✅ Done |
| **Task 7** | `backend/controllers/chatController.js` | Isolated session data to `req.user.id`. Language and farmer name resolved directly from `req.user` identity. | ✅ Done |
| **Task 8** | `frontend/src/context/AuthContext.jsx`, `frontend/src/services/apiClient.js`, `frontend/src/components/common/ProtectedRoute.jsx`, `frontend/src/pages/TransportPage.jsx`, `frontend/src/pages/DashboardPage.jsx`, `frontend/src/components/chatbot/ChatWindow.jsx`, `frontend/src/pages/HarvestPage.jsx`, `frontend/src/pages/AdminPage.jsx` | Removed `demo_token_` shortcut; deleted unused `switchPersona`. Created `apiClient.js` fetch wrapper with Bearer token & 401 logout/redirect. Per-user React state cleared on logout (`harvestmitra:logout` event). Updated `ProtectedRoute` with strict role checks between farmer and transporter while keeping shared pages accessible. | ✅ Done |
| **Task 9** | `backend/routes/transport.routes.js`, `frontend/src/pages/TransportPage.jsx` | `normalizeTransportInput`: validated `weightKg > 0 && weightKg <= 5000` (400) and `pickupDate >= today` (400). Added `PUT /api/transport/requests/:id/confirm` (farmer owner only, only when `status === 'delivered'`, sets `completed`). Added "Confirm received" button to farmer request card. | ✅ Done |
| **Task 10** | `setup.bat`, `backend/package.json`, `backend/seed.js`, `backend/scripts/seedAllIndiaMarkets.js`, `backend/services/weatherService.js`, `backend/services/marketService.js`, `frontend/src/components/market/MarketPriceExplorer.jsx`, `DEMO_GUIDE.md` | Added `node scripts/seedAllIndiaMarkets.js` to `setup.bat` and `npm run seed`. Set Surat tomato = 18.50 and Ahmedabad tomato = 23.00 in seed data. Updated DEMO_GUIDE.md numbers and reworded key takeaway. Set Surat demo weather to 65% rain probability. Showed "Verified Rates" vs "DEMO / Sample Data" conditionally. Added all missing tests to `npm test`. | ✅ Done |
| **Task 11** | `backend/test/transport_security.test.js`, `backend/package.json` | Added full transport security test suite covering: transporter B cannot progress/reject transporter A's trip (403), 409 on already accepted trip, 409 on transporter with active trip, 400 on invalid status jump, trip isolation on `my-requests`, farmer request isolation, and 403 on open-cargo / transporter-stats for farmers. Added to `npm test`. | ✅ Done |

---

## 🧪 Verification Summary

1. **`cd backend && npm test`**:
   - 12 comprehensive test suites executed.
   - All tests passed with **0 errors**.
2. **`cd frontend && npm run build`**:
   - Production Vite bundle built successfully in 866ms with **0 errors**.
3. **End-to-End Walkthrough**:
   - Explored Demo (`demo@harvestmitra.local`) -> `/dashboard`.
   - Verified Harvest Simulator (`/harvest`).
   - Booked shared transport (`/transport`), generated gate pass, and appeared in "My Live Transport Bookings".
   - Verified logout clears session and tokens.
   - Verified unauthenticated direct access to `/dashboard`, `/transport`, `/admin` redirects to `/login`.
