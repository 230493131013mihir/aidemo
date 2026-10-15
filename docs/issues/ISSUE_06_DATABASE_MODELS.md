# 🗄️ Task Complete: Database Models, Relationships and Seed Data (Issue #6)

**Issue Reference:** Closes #6 (Parent: #4)  
**Assignee:** Mihir Jadav (@230493131013mihir) — Team Lead & Backend/Auth Lead  
**Completed Date:** 2026-10-02 18:30:00 +05:30 (Seeds Expanded: 2026-10-14 14:00:00 +05:30)  
**Branch:** `feature/issue-06-mihir-database-models` ➔ `main`

---

## 🎯 Deliverables & Scope Completed
- [x] **Sequelize ORM Initialization**: Configured connection pool with MySQL dialect, environment variable binding, and auto-reconnect logic in `backend/config/database.js`.
- [x] **Core Models & Table Schema**:
  - `User` (`backend/models/User.js`): Handles auth credentials, password hashing, and role enum (`farmer`, `transporter`, `admin`).
  - `FarmerProfile` (`backend/models/farmerProfile.js`): Captures farm size, location, and `currentHarvestKg`.
  - `TransporterProfile` (`backend/models/transporterProfile.js`): Captures vehicle number, capacity, and active status.
  - `TransportRequest` (`backend/models/transportRequest.js`): Tracks shared transport pooling requests, pickup/dropoff points, and statuses.
  - `Market` & `MarketPrice` (`backend/models/Market.js`, `backend/models/marketPrice.js`): APMC mandi metadata and real-time commodity prices.
  - `Crop` (`backend/models/Crop.js`): Multilingual crop dictionary and benchmark shelf-life factors.
  - `AdminUser` (`backend/models/adminUser.js`): Administrative credentials and role privileges.
- [x] **Relational Integrity**: Defined one-to-one and one-to-many associations between users, profiles, and transport requests.
- [x] **Seed Scripts**:
  - `backend/seed.js`: Pre-seeded demo farmer (`demo@harvestmitra.local`) and demo admin (`admin@harvestmitra.local`).
  - `backend/scripts/seedAllIndiaMarkets.js`: Pre-seeded 65 APMC Mandis across Gujarat, Maharashtra, Punjab, and Karnataka.
