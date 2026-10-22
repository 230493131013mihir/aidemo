# Issue #114: [PRASHANT] Real-Time Dynamic APMC Moving Average Trends & 4-Scenario Revenue Simulation
**Assignee:** Prashant Warule (@prashantwarule0310)  
**Role:** Mandi Intelligence & Financial Simulator Lead  
**Branch:** `feature/prashant-dynamic-apmc-trends-revenue`  
**Status:** Completed & Ready for Review  

---

### Objectives & Requirements:
- [x] Replace static demo data in `MarketTrendChart.jsx` with dynamic API integration querying `/api/market/prices/trends`.
- [x] Add dynamic multi-commodity selector pills (`Tomato`, `Onion`, `Wheat`, `Soybean`, `Cotton`) with live price badges.
- [x] Upgrade `RevenueComparisonChart.jsx` to dynamically compute 4 real-world selling strategies:
  1. Local Village Mandi sale with standard broker commission
  2. Cold Storage Holding for 21 days with 5% spoilage buffer
  3. Solo Regional APMC dispatch to high-spread terminal
  4. Shared Pooling Dispatch (Winning Strategy saving up to 63% on freight)
- [x] Integrate real calculations from active registered farmer crops (`crops`) and live APMC price spreads.

---

### Key Commits & Changes:
- `frontend/src/components/dashboard/MarketTrendChart.jsx`: Dynamic API integration & crop switcher
- `frontend/src/components/dashboard/RevenueComparisonChart.jsx`: Multi-scenario real math engine
- `frontend/src/pages/DashboardPage.jsx`: Dynamic props wiring
