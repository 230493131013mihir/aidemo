# TEAM TASK ALLOCATION & WORKFLOW GUIDE 👥🌾
## HarvestMitra AI — Hackathon Collaboration Plan

**GitHub Repository**: [https://github.com/230493131013mihir/aidemo.git](https://github.com/230493131013mihir/aidemo.git)  
**Team Members**: Mihir, Sayali, Prashant, Varun

---

## 📌 Executive Team Roles & Division

```
+----------------------------------------------------------------------------------+
|                                TEAM ALLOCATION                                   |
+---------------------+---------------------+---------------------+----------------+
|      1. MIHIR       |      2. SAYALI      |     3. PRASHANT     |    4. VARUN    |
| (Team Lead & Full   |  (Backend & Database| (Frontend UI/UX &   | (AI Engineer & |
|  Stack Integration) |      Architect)     |   Visual Design)    | Voice/Integrations)
+---------------------+---------------------+---------------------+----------------+
```

---

## 👨‍💻 Detailed Member Responsibilities & Tasks

### 1. 🟢 Mihir — Team Lead & Full Stack Integration Lead
**Primary Focus**: Repository setup, authentication flow, application architecture, deployment, and hackathon presentation lead.

#### Assigned Tasks:
- [x] Create project documentation (.md files) and initialize GitHub repository.
- [ ] Set up project folder structure (`frontend/` Vite React app + `backend/` Node/Express server).
- [ ] Implement JWT Authentication & User Authorization (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`).
- [ ] Build Landing Page & Demo Mode access switcher (Direct access for demo persona Ramesh Patel).
- [ ] Connect Frontend React Router (`App.jsx`) with protected routes.
- [ ] Lead final integration testing and coordinate Git feature branch merging.
- [ ] Conduct final hackathon demo presentation using [DEMO_GUIDE.md](file:///c:/Users/MIHIR%20JADAV/Desktop/aidemo/DEMO_GUIDE.md).

---

### 👩‍💻 2. 🟣 Sayali — Backend Developer & Database Architect
**Primary Focus**: MySQL database configuration, ORM models, Market Data API, and Admin endpoints.

#### Assigned Tasks:
- [ ] Set up MySQL database schema using Sequelize ORM (`users`, `farmer_profiles`, `crops`, `markets`, `market_prices`, `transport_requests`, `weather_alerts`).
- [ ] Write database seeding script (`seeders/demoSeed.js`) with realistic sample data (Surat & Ahmedabad Mandis, Tomato prices, weather alerts).
- [ ] Develop Market Explorer API (`/api/markets`, `/api/markets/prices`, `/api/markets/prices/trends`).
- [ ] Build Farmer Profile API (`GET/PUT /api/profile`).
- [ ] Build Admin Dashboard API endpoints for managing Mandi prices and system reports (`/api/admin/*`).
- [ ] Write backend unit tests for market data controllers and profile endpoints.

---

### 👨‍💻 3. 🔵 Prashant — Frontend UI/UX Developer & Designer
**Primary Focus**: Modern Agricultural Dashboard UI, Design System, Charts, and Core Frontend Modules.

#### Assigned Tasks:
- [ ] Implement Tailwind CSS design system (Deep agricultural greens, warm cream, natural earth tones, card shadows, responsive layout).
- [ ] Build Farmer Dashboard (`DashboardPage.jsx`) with summary widgets, weather alerts, and crop statistics.
- [ ] Build **Smart Harvest Decision Simulator UI** (`SimulatorPage.jsx`) with input form and 3-scenario side-by-side financial comparison cards.
- [ ] Build interactive financial breakdown charts using **Recharts** (Gross vs. Net revenue visualization).
- [ ] Build **Market Price Explorer UI** (`MarketsPage.jsx`) with crop filters, search bar, and historical price trend graphs.
- [ ] Design Multilingual UI selector component in Navbar (Gujarati, Hindi, English switcher).

---

### 👨‍💻 4. 🟡 Varun — AI Engineer & Voice/Integrations Lead
**Primary Focus**: Shared Transport module, Mitra Assistant Chatbot, Voice STT/TTS, Weather integration.

#### Assigned Tasks:
- [ ] Develop **Shared Transport Matching Engine & UI** (`TransportPage.jsx` & `/api/transport/*`) for pooling vehicle capacity between farmers.
- [ ] Implement **Mitra Assistant AI Service Layer** (`backend/services/aiService.js`) supporting Gemini / OpenAI APIs.
- [ ] Build **Deterministic Fallback Engine** (`backend/services/fallbackAiEngine.js`) so the chatbot operates 100% offline without API credentials.
- [ ] Integrate Browser **Web Speech API** (Speech-to-Text for Gujarati/Hindi voice input and Text-to-Speech audio response).
- [ ] Develop Weather Alert integration service (`/api/weather`) linking rain advisories to harvest timing.
- [ ] Build interactive Chat UI (`ChatPage.jsx` & float button component).

---

## 🌿 Git Branching Strategy for Team Collaborators

To prevent code conflicts on `main`:

```bash
# Each member works on their feature branch:

# Mihir:
git checkout -b feature/auth-and-landing

# Sayali:
git checkout -b feature/database-and-markets

# Prashant:
git checkout -b feature/dashboard-and-simulator-ui

# Varun:
git checkout -b feature/ai-chat-and-transport
```

### Pull Request & Review Process:
1. Push branch to GitHub: `git push origin feature/<your-feature-name>`
2. Open a Pull Request (PR) on GitHub repository targeting `main`.
3. Mihir or Sayali reviews code before merging to `main`.
