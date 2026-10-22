# Issue #115: [SAYALI] Seasonal Revenue Trajectory Visualizer & Visitor Read-Only UI Guards
**Assignee:** Sayali Kulkarni (@sayalikulkarni-tech)  
**Role:** UI/UX & Frontend Design Lead  
**Branch:** `feature/sayali-seasonal-trajectory-visitor-guards`  
**Status:** Completed & Ready for Review  

---

### Objectives & Requirements:
- [x] Replace static demo planning history in `PlanningHistoryChart.jsx` with a dynamic 6-month seasonal trajectory (May through October Active).
- [x] Wire seasonal trajectory calculations dynamically to the farmer's registered acreage, harvest volume, and past simulation records.
- [x] Re-architect `ProfileSummary.jsx` to cleanly distinguish unauthenticated visitors from authenticated farmers, showing a helpful guest notification with Login/Register CTAs rather than fake acreage.
- [x] Update `Navbar.jsx` navigation items so unauthenticated visitors receive proper client-side routing to public exploration features.

---

### Key Commits & Changes:
- `frontend/src/components/dashboard/PlanningHistoryChart.jsx`: Dynamic seasonal area chart
- `frontend/src/components/dashboard/ProfileSummary.jsx`: Clean visitor card with Login/Register CTAs
- `frontend/src/components/navigation/Navbar.jsx`: Visitor navigation links
