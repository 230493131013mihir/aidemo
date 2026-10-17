# Issue #78: Printable Farm Decision Summary Report API

**Assignee:** Prashant Warule (@prashantwarule0310)  
**Role:** Backend Architect & Database Lead  
**Module:** Decision Summary & Farmer Reporting Services  
**Status:** Completed ✅

---

## 📌 Objectives
1. Implement a unified Farm Decision Summary Report API synthesizing farmer profiles, live APMC market rates, 3-scenario financial modeling (`mathEngine.js`), weather harvest risk, and algorithmic recommendation.
2. Provide dual output formats: structured JSON API response and standalone A4-ready printable HTML document.
3. Feature professional agricultural styling (`@media print`), HarvestMitra AI branding, digital verification seal, comparative breakdown table, and signature sections.

---

## 🛠️ Implemented Architecture
- **Farm Report Service (`backend/services/farmReportService.js`)**:
  - `generateFarmDecisionReport(params)`: Runs deterministic three-scenario financial comparison:
    - Option 1: Immediate local sale (Gross, Transport, Packaging, Labor, Net).
    - Option 2: 5-7 days holding in cold storage (Storage fees, Spoilage, Net, Delta).
    - Option 3: Regional metro mandi via shared transport (Shared logistics, Gross, Net, Delta).
    - Integrates live weather advisory (rain probability) and 14-day price trend momentum.
  - `renderPrintableHtml(report)`: Produces standalone, printer-optimized HTML with verification token, A4 margin rules, and auto-print support (`?autoprint=true`).
- **Report Controller & Router (`backend/controllers/reportController.js`, `backend/routes/report.routes.js`)**:
  - Mounted at `/api/reports` and `/api/report`.

---

## 🌐 Endpoints
- `GET /api/reports/farm-decision` & `POST /api/reports/farm-decision`
- `GET /api/reports/farm-decision/print`
- `GET /api/reports/farm-decision/download`
