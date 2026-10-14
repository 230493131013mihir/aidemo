# 🌾 HarvestMitra AI — Member-by-Member Execution Guide & Ready-to-Send Prompts

This file provides **ready-to-send messages/prompts** for each of the 4 team members:
* **Mihir**: Team Lead & Backend/Auth/Admin
* **Sayali**: Frontend UI/UX & Responsive Layouts
* **Prashant**: Harvest Simulator & Transport Engine
* **Varun**: Mitra AI Assistant & Multilingual/Market Data

---

## 🟢 1. PROMPT TO SEND TO MIHIR (Backend & Integration Lead)

```text
Hi Mihir! Here is your complete start-to-end task package for HarvestMitra AI (Phase 06: 14–19 Oct).

Your Assigned Scope: Backend, Auth/JWT, Role Security, Admin APIs, Integration Coordination (Issues #4, #5, #6, #7, #8, #9).

==============================
STEP-BY-STEP WORKFLOW ON YOUR LAPTOP:
==============================

1. SETUP & REPO SYNC:
   Open terminal in aidemo root:
   git checkout integration
   git status
   git add .
   git commit -m "feat(integration): sync auth, profile, simulator, transport and admin modules"
   git push origin integration

2. DATABASE VERIFICATION & SEEDING:
   cd backend
   npm install
   node test-db.js                      # Verify MySQL connects
   node seed.js                         # Seeds demo farmer and admin accounts
   node scripts/seedAllIndiaMarkets.js  # Seeds 65 APMC Mandis

   Your pre-seeded test accounts:
   - Farmer: demo@harvestmitra.local / Demo@12345
   - Admin: admin@harvestmitra.local / Admin@12345

3. CODE IMPLEMENTATION TASK (Issues #5, #7, #9):
   Create an automated test file `backend/tests/api_security.test.js` that tests:
   a) POST /api/auth/login returns a valid JWT token.
   b) GET /api/admin/farmers with a farmer token returns 403 Forbidden.
   c) GET /api/admin/farmers with an admin token returns 200 OK and user list.
   d) Verify `npm test` runs all backend unit & security tests cleanly.

4. DOCUMENTATION TASK (Issue #8):
   Update `API_DOCUMENTATION.md` to document the newly added Transport routes (/api/transport/*) and Admin routes (/api/admin/*) with example JSON requests and responses.

5. DEFINITION OF DONE / EVIDENCE TO PRODUCE:
   - Git commit pushed to origin/integration.
   - Output log showing `npm test` passing 100%.
   - Updated API_DOCUMENTATION.md.
```

---

## 👩‍💻 2. PROMPT TO SEND TO SAYALI (Frontend UI/UX Developer & Designer)

```text
Hi Sayali! Here is your complete start-to-end task package for HarvestMitra AI (Phase 06: 14–19 Oct).

Your Assigned Scope: Frontend UI/UX, Responsive Layouts, Profile Page, Navigation, Visual Polish (Issue #1).

==============================
STEP-BY-STEP WORKFLOW ON YOUR LAPTOP:
==============================

1. SETUP & REPO SYNC:
   Open terminal:
   git clone https://github.com/230493131013mihir/aidemo.git  (if not cloned)
   cd aidemo
   git checkout integration
   git pull origin integration
   git checkout -b feature/ui-responsive-polish

2. START FRONTEND LOCALLY:
   cd frontend
   npm install
   npm run dev
   Open http://localhost:5173 in Google Chrome or Edge.

3. CODE IMPLEMENTATION & TESTING TASKS:
   a) Responsive Mobile Audit (Issue #1):
      - Press F12 in Chrome to open DevTools.
      - Click Toggle Device Toolbar (Ctrl+Shift+M).
      - Set screen width to 375px (iPhone SE / Android standard).
      - Check all pages: /dashboard, /harvest, /markets, /transport, /profile, /admin.
      - Fix any elements causing horizontal scrolling (check charts in MarketTrendChart.jsx, padding in tables, and grid cards).
   b) Loading & Error States:
      - Verify that when backend is loading or unavailable, a friendly error banner/toast appears rather than crashing with a white screen.
   c) Production Build Verification:
      - Run `npm run build` in `frontend/` and confirm build passes with 0 errors.

4. SUBMISSION ARTIFACTS:
   Capture 7 clean high-resolution screenshots and save them into `docs/screenshots/`:
   1. 01_landing_page.png
   2. 02_farmer_login_modal.png
   3. 03_farmer_dashboard.png
   4. 04_harvest_decision_simulator.png
   5. 05_shared_transport_booking.png
   6. 06_profile_page_saved.png
   7. 07_admin_dashboard.png

5. DEFINITION OF DONE / EVIDENCE TO SEND MIHIR:
   - git commit -m "feat(ui): responsive overflow fixes and screenshot suite"
   - git push origin feature/ui-responsive-polish
   - Open Pull Request targeting `integration` branch.
   - Send the screenshots to Mihir for the presentation deck.
```

---

## 🔵 3. PROMPT TO SEND TO PRASHANT (Simulator & Transport Logic Lead)

```text
Hi Prashant! Here is your complete start-to-end task package for HarvestMitra AI (Phase 06: 14–19 Oct).

Your Assigned Scope: Harvest Decision Simulator, Shared Transport Pooling Engine, Cost Splitting, Booking Persistence (Issue #2).

==============================
STEP-BY-STEP WORKFLOW ON YOUR LAPTOP:
==============================

1. SETUP & REPO SYNC:
   Open terminal:
   git clone https://github.com/230493131013mihir/aidemo.git  (if not cloned)
   cd aidemo
   git checkout integration
   git pull origin integration
   git checkout -b feature/simulator-transport-e2e

2. VERIFY LOCAL ENGINES:
   cd backend
   npm install
   node services/testMathEngine.js    # Checks financial formulas
   node services/testTransport.js     # Checks route matching and cost splitting

3. START THE PLATFORM & RUN THE BROWSER JOURNEY:
   Terminal 1: cd backend && npm run dev
   Terminal 2: cd frontend && npm run dev
   Login at http://localhost:5173 with: demo@harvestmitra.local / Demo@12345

4. CODE IMPLEMENTATION & VERIFICATION TASKS:
   a) End-to-End Booking Persistence:
      - Go to /harvest (Harvest Decision Simulator).
      - Select Crop: Tomato, Quantity: 1500 kg, Holding Days: 5 days.
      - Inspect the 3 financial comparison cards (Local Mandi vs. Regional Mandi vs. Cold Storage).
      - Click "Book Shared Truck for Winning Mandi".
      - Verify it automatically redirects to /transport with destination and quantity pre-filled.
      - Click "Confirm & Request Pool".
      - Confirm the new booking appears under "My Transport Requests" with status PENDING/MATCHED.
   b) Edge-Case & Error Handling:
      - Test requesting a transport route with no available vehicles or weight > 5000 kg.
      - Ensure an informative warning appears instead of a silent error.
   c) Benchmark Calculation Documentation:
      - Create `docs/SIMULATOR_CALCULATIONS.md` listing the 3 test cases and showing:
        Net Revenue = (Quantity × Mandi Price) - (Transport Cost + Mandi Cess + Holding Spoilage Risk)

5. DEFINITION OF DONE / EVIDENCE TO SEND MIHIR:
   - Screenshot of the successfully booked transport request appearing under "My Requests".
   - Verified row in MySQL (`SELECT * FROM transport_requests;`).
   - git commit -m "feat(transport): end-to-end simulator booking persistence and validation"
   - git push origin feature/simulator-transport-e2e
   - Open Pull Request targeting `integration`.
```

---

## 🟡 4. PROMPT TO SEND TO VARUN (Mitra AI, Voice & Integrations Lead)

```text
Hi Varun! Here is your complete start-to-end task package for HarvestMitra AI (Phase 06: 14–19 Oct).

Your Assigned Scope: Mitra AI Assistant, Voice STT/TTS, Multilingual Support, Market Explorer & Weather Integration (Issue #3).

==============================
STEP-BY-STEP WORKFLOW ON YOUR LAPTOP:
==============================

1. SETUP & REPO SYNC:
   Open terminal:
   git clone https://github.com/230493131013mihir/aidemo.git  (if not cloned)
   cd aidemo
   git checkout integration
   git pull origin integration
   git checkout -b feature/ai-voice-markets

2. START THE APPLICATION:
   Terminal 1: cd backend && npm run dev
   Terminal 2: cd frontend && npm run dev
   Open http://localhost:5173

3. CODE IMPLEMENTATION & TESTING TASKS:
   a) Offline AI Chatbot Verification (/chat):
      - Open http://localhost:5173/chat.
      - Test questions in Gujarati: "મારે ટામેટા ક્યારે વેચવા જોઈએ?"
      - Test questions in Hindi: "टमाटर का भाव कब बढ़ेगा?"
      - Test questions in English: "Should I store my potatoes or sell them now?"
      - Ensure the fallback engine answers accurately without needing any external paid API key.
   b) Voice STT & TTS Audio Testing:
      - Click the microphone icon in /chat to test speech recognition.
      - Click the speaker button next to the assistant response to verify Text-to-Speech audio playback.
   c) Data Source Transparency Badges (/markets and /weather):
      - Open /markets: verify top banner states "Pan-India APMC Network • Verified Rates" and indicates sample/cached source when offline.
      - Open /weather: verify rainfall advisory and crop weather cards display accurate disclaimer tags.
   d) Update Documentation:
      - Review `AI_DESIGN.md` to ensure Gemini API integration, offline fallback rules, and prompt engineering guidelines are fully documented.

4. DEFINITION OF DONE / EVIDENCE TO SEND MIHIR:
   - Audio/video clip or screenshot demonstrating voice query and playback in Gujarati/Hindi.
   - Screenshot of /markets showing clean crop filters and data source tags.
   - git commit -m "feat(ai): speech recognition polish and data transparency badging"
   - git push origin feature/ai-voice-markets
   - Open Pull Request targeting `integration`.
```
