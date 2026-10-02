# 📋 HACKATHON TASK ALLOCATION & WORKFLOW (4 TEAM MEMBERS)

**Project Name:** HarvestMitra AI  
**Team Members:** Mihir, Sayali, Prashant, Varun  

Below is the structured division of work into **GitHub Issues / Work Packages** for all 4 collaborators.

---

## 👤 1. MIHIR (Team Lead & Full-Stack Lead)
**Role:** Backend Architecture, Authentication, Admin Panel & Database Integration

### GitHub Issues to Assign:
1. **[ISSUE-01] Backend Setup & Database Schema Initialization**
   - Setup Node.js & Express.js project structure in `/backend`.
   - Configure Sequelize ORM connection with MySQL.
   - Create tables: `users`, `farmer_profiles`, `crops`, `markets`, `market_prices`, `admin_users`.
   - Create seed scripts (`seed.js`) with fictional demo datasets.

2. **[ISSUE-02] User Authentication & JWT Middleware**
   - Implement `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/me`.
   - Add `bcryptjs` password hashing and JWT token verification middleware.
   - Implement Demo Mode bypass route for quick judge testing.

3. **[ISSUE-03] Admin Dashboard APIs & Protected Routes**
   - Implement `/api/admin/overview`, `/api/admin/market-prices`, and `/api/admin/reports`.
   - Enforce role-based access control (`role === 'admin'`).

---

## 👤 2. SAYALI (Frontend & UI/UX Developer)
**Role:** React Frontend Architecture, Landing Page, Dashboard & Styling

### GitHub Issues to Assign:
1. **[ISSUE-04] Frontend Setup, Design System & Router Configuration**
   - Setup React + Vite project in `/frontend` with Tailwind CSS & Lucide icons.
   - Configure React Router v6 navigation structure.
   - Create global design tokens (Deep Agricultural Green, Warm Cream, Earthy Accents).
   - Implement language selector (English, Gujarati, Hindi) context switcher.

2. **[ISSUE-05] Landing Page & Multilingual Header/Footer**
   - Build Landing Page with Hero tagline, problem explanation, feature cards, "How It Works" workflow, visual dashboard preview, and CTA buttons ("Get Started", "Explore Demo").
   - Create responsive Navbar, Footer, and Demo Banner.

3. **[ISSUE-06] Farmer Dashboard & Analytics Layout**
   - Create main Farmer Dashboard displaying farmer profile card, weather summary widget, active crop overview, and quick action shortcuts.
   - Integrate Recharts for market price trends and revenue comparison visual charts.

---

## 👤 3. PRASHANT (Core Features Developer - Simulator & Transport)
**Role:** Smart Harvest Decision Simulator & Shared Transport Matching Module

### GitHub Issues to Assign:
1. **[ISSUE-07] Smart Harvest Decision Simulator (Backend Math & Frontend UI)**
   - Create deterministic calculation engine (`mathEngine.js`) calculating Gross vs Net Revenue (subtracting transport, packaging, labor expenses).
   - Build input form for crop quantity, current market price, alternative market price, and assumed future price.
   - Generate side-by-side comparison cards for **Option 1 (Sell Today)**, **Option 2 (Hold & Sell Later)**, and **Option 3 (Transport to Alt Market)**.
   - Implement risk indicator badges (e.g. rain perishability risk).

2. **[ISSUE-08] Shared Transport Matching Module (Backend & UI)**
   - Design backend endpoints: `GET /api/transport/requests`, `POST /api/transport/requests`, `GET /api/transport/matches`.
   - Implement smart vehicle load pooling algorithm matching route destination, date, and weight capacity.
   - Build UI for viewing potential transport partners, accepting matches, and calculating split transport cost savings per farmer.

---

## 👤 4. VARUN (AI Specialist & Integration Engineer)
**Role:** Mitra Assistant (Voice Chatbot), Weather API & External Data Integration

### GitHub Issues to Assign:
1. **[ISSUE-09] Mitra Assistant AI Service Layer & Fallback Engine**
   - Create provider-independent AI service abstraction (`aiService.js`) supporting LLM API credentials (Gemini/OpenAI compatible).
   - Implement system prompt context injection passing database prices and math engine results into LLM prompts.
   - Build a zero-hallucination fallback guidance engine for when API keys are unconfigured.

2. **[ISSUE-10] Multilingual Voice Chatbot UI & Speech Integration**
   - Create interactive **Mitra Assistant** chat interface (`ChatWindow.jsx`).
   - Integrate browser Web Speech API for Speech-to-Text (STT microphone input) and Text-to-Speech (TTS output) in Gujarati, Hindi, and English.
   - Display loading, error states, and transparent data source tags.

3. **[ISSUE-11] Market Price Explorer & Weather Advisory Integration**
   - Build Market Explorer UI allowing farmers to filter, search crops, and compare prices across multiple Mandis.
   - Integrate Weather API (`weatherService.js`) for district location-based rain alerts and harvest advice.

---

## 📌 Summary Allocation Table

| Collaborator | Core Responsibilities | Target GitHub Issues |
| :--- | :--- | :--- |
| **Mihir** | Backend Node.js Server, MySQL DB, JWT Auth, Admin Dashboard | ISSUE-01, ISSUE-02, ISSUE-03 |
| **Sayali** | React Frontend, Landing Page, Styling/Tailwind, Main Dashboard UI | ISSUE-04, ISSUE-05, ISSUE-06 |
| **Prashant** | Harvest Decision Simulator, Net Revenue Engine, Shared Transport Pool | ISSUE-07, ISSUE-08 |
| **Varun** | Mitra Assistant AI Layer, Voice STT/TTS, Weather Advisories, Market Explorer | ISSUE-09, ISSUE-10, ISSUE-11 |
