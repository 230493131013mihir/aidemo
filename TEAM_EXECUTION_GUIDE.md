# 🌾 HarvestMitra AI — Team Laptop Setup & Execution Guide

**Submission Deadline**: 22 October 2026 | **Demo Freeze**: 20 October 2026  
**Repository**: `https://github.com/230493131013mihir/aidemo.git`  
**Current Branch**: `integration`

---

## 💻 1. How Each Member Sets Up on Their Laptop

Every member needs:
* **Node.js** (v18+ or v20+) — `node -v`
* **MySQL Server** (running locally on port 3306)
* **Git** installed

### Step 1: Clone / Pull Code
```bash
git clone https://github.com/230493131013mihir/aidemo.git
cd aidemo
git checkout integration
git pull origin integration
```

---

## 🗄️ 2. How to Configure & Seed the Database ("How to Seed")

### Step 2.1: Configure MySQL in `backend/.env`
Ensure your MySQL credentials in `backend/.env` match your local laptop:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=harvestmitra_db
```

> **Note**: Create the database in MySQL first if not created:
> ```sql
> CREATE DATABASE IF NOT EXISTS harvestmitra_db;
> ```

### Step 2.2: Seeding Commands
Open terminal in project root:
```bash
cd backend
npm install

# Test MySQL connection:
node test-db.js

# Seed demo users, crops, and initial mandis:
node seed.js

# Seed All-India 65 APMC Mandis:
node scripts/seedAllIndiaMarkets.js
```

### 🔑 Test User Credentials (Ready to use)
* **Farmer Account**:
  * Email: `demo@harvestmitra.local` | Password: `Demo@12345`
* **Admin Account**:
  * Email: `admin@harvestmitra.local` | Password: `Admin@12345`

---

## 🚀 3. How to Run the App (Two Terminals)

### Terminal 1: Backend API
```bash
cd backend
npm run dev
# Starts on: http://localhost:5000
```

### Terminal 2: Frontend Client
```bash
cd frontend
npm install
npm run dev
# Starts on: http://localhost:5173
```

---

## 👥 4. Member-by-Member Laptop Task Guide

### 🟢 1. MIHIR (Backend, Auth & Integration Lead)
* **How to work on laptop**:
  1. Commit and push current `integration` branch changes:
     ```bash
     git add .
     git commit -m "feat(integration): sync all frontend and backend modules"
     git push origin integration
     ```
  2. Add automated test script in `backend/package.json`:
     `"test": "node services/testMathEngine.js && node services/testTransport.js"`
  3. Verify admin security: Check that regular farmer token gets `403` on `/api/admin/*`.
  4. Update [API_DOCUMENTATION.md](file:///c:/Users/MIHIR%20JADAV/Desktop/aidemo/API_DOCUMENTATION.md) with Transport and Admin endpoints.

### 👩‍💻 2. SAYALI (Frontend UI/UX & Responsive Design)
* **How to work on laptop**:
  1. Run `cd frontend && npm run dev`.
  2. Open Chrome DevTools (`F12`), toggle device toolbar (`Ctrl+Shift+M`).
  3. Test responsive layout at **375px (Mobile)**, **768px (Tablet)**, and **1280px (Desktop)**:
     - Check `/dashboard`, `/harvest`, `/markets`, `/transport`.
     - Ensure no horizontal scrolling occurs.
  4. Take 7 clean screenshots for the final presentation deck.

### 🔵 3. PRASHANT (Harvest Simulator & Transport Engine)
* **How to work on laptop**:
  1. Test calculation engines in terminal:
     ```bash
     cd backend
     node services/testMathEngine.js
     node services/testTransport.js
     ```
  2. Test UI booking journey:
     - Go to `http://localhost:5173/harvest`
     - Click **"Book Shared Truck for Winning Mandi"**
     - Verify it navigates to `/transport` and creates a row in `transport_requests` table in MySQL.
  3. Document the 3 sample calculation cases (Local vs. Regional vs. Cold Storage).

### 🟡 4. VARUN (Mitra AI, Multilingual & Market Explorer)
* **How to work on laptop**:
  1. Test offline chatbot in `http://localhost:5173/chat`:
     - Test queries in Gujarati, Hindi, and English without any API key.
  2. Test Speech-to-Text (Microphone) and Text-to-Speech (Speaker icon) in browser.
  3. Verify data source labels on `/markets` and `/weather` (*"Source: APMC Network / Sample Cache"*).

---

## 📅 5. Day-by-Day Timeline to 22 October

* **14 Oct (Today)**: Mihir commits `integration`, all members seed DB and verify local run.
* **15 Oct**: Prashant tests and verifies Simulator → Transport DB saving.
* **16 Oct**: Sayali tests mobile responsiveness and takes report screenshots.
* **17 Oct**: Varun tests voice STT/TTS and data badges.
* **18 Oct**: Mihir runs integration API tests and finishes API documentation.
* **19 Oct**: Deploy to free cloud hosting (Render/Railway/Vercel).
* **20 Oct**: **Feature Freeze & Complete Demo Rehearsal Walkthrough**.
* **21 Oct**: Finalize Slides (PPT), demo video recording, and report.
* **22 Oct**: **Final Submission**.
