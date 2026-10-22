# Issue #116: [VARUN] Live APMC Price Alert Stream & Transport Dispatch Authentication Guard
**Assignee:** Varun Patil (@varunpatil1706)  
**Role:** Transport Logistics & AI Telemetry Lead  
**Branch:** `feature/varun-live-alerts-transport-auth-guard`  
**Status:** Completed & Ready for Review  

---

### Objectives & Requirements:
- [x] Replace static recent activity in `RecentActivity.jsx` with a live feed fetching from `/api/market/alerts`.
- [x] Display real price surge alerts, APMC rate synchronizations, and active logistics status with dynamic icons and badges.
- [x] Implement strict authentication check in `SharedTransportFarmerWidget.jsx` preventing unauthenticated visitors from confirming bookings under fallback placeholder accounts.
- [x] Prompt unauthenticated guests with a clear notification and auto-redirect to `/login` when attempting to dispatch transport vehicles.

---

### Key Commits & Changes:
- `frontend/src/components/dashboard/RecentActivity.jsx`: Live alerts stream
- `frontend/src/components/dashboard/SharedTransportFarmerWidget.jsx`: Authentication booking guard
