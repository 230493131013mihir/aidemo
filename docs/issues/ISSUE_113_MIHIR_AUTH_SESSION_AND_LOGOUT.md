# Issue #113: [MIHIR] Auth Session State Hydration, Clean Logout Redirection & Route Guards
**Assignee:** Mihir Jadav (@230493131013mihir)  
**Role:** System Architecture & Security Lead  
**Branch:** `feature/mihir-auth-session-and-logout-fix`  
**Status:** Completed & Ready for Review  

---

### Objectives & Requirements:
- [x] Fix session state hydration in `AuthContext.jsx` by immediately reading `localStorage` on initial mount to eliminate refresh flickering.
- [x] Correct `logout()` implementation so all tokens and user sessions are purged, and the browser is explicitly redirected to `/` (Home page).
- [x] Remove obsolete `window.performance` navigation reload redirect in `AuthPage.jsx` that erroneously kicked users to home page on refresh.
- [x] Enforce route protection in `ProtectedRoute.jsx` and `AppRoutes.jsx` with strict authentication checks for `/profile` while allowing guest visitors to browse public telemetry.
- [x] Bump backend and frontend dependencies (`express: ^5.3.0`, `mysql2: ^3.24.6`, `react: ^19.3.1`, `vite: ^8.3.4`, `lucide-react: ^1.58.0`) across `package.json` files.

---

### Key Commits & Changes:
- `frontend/src/context/AuthContext.jsx`: Clean session verify & logout redirect
- `frontend/src/pages/AuthPage.jsx`: Remove refresh bounce
- `frontend/src/routes/AppRoutes.jsx`: Harmonized routes
- `frontend/src/components/common/ProtectedRoute.jsx`: Strict role validation
