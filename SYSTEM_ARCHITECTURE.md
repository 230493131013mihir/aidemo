# SYSTEM ARCHITECTURE: HarvestMitra AI 🏛️

## 1. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                              CLIENT LAYER                               |
|   React 18 + Vite Web Application (Tailwind CSS, Recharts, Lucide)     |
|   Multilingual UI (Gujarati, Hindi, English) | Web Speech API (STT/TTS) |
+------------------------------------+------------------------------------+
                                     |
                                REST API / HTTP
                                     |
+------------------------------------v------------------------------------+
|                              BACKEND LAYER                              |
|   Node.js + Express.js REST API                                         |
|   Middleware: JWT Auth, Rate Limiting, Input Validation, CORS          |
+---------+------------------+------------------+-------------------+-----+
          |                  |                  |                   |
          v                  v                  v                   v
+------------------+ +---------------+ +-----------------+ +----------------+
| DATA CONTROLLERS | | SIMULATOR     | | FREIGHT MATCH   | | AI SERVICE     |
| Auth, Profile,   | | Engine (Net   | | Distance & Cap  | | Provider       |
| Mandi Markets    | | Rev Math)     | | Matcher         | | Abstraction    |
+---------+--------+ +-------+-------+ +--------+--------+ +--------+-------+
          |                  |                  |                   |
          v                  v                  v                   v
+-------------------------------------------------------------------------+
|                            PERSISTENCE & EXTERNAL                       |
|   - MySQL Database (Sequelize ORM)                                      |
|   - Deterministic Fallback Rules Engine                                 |
|   - LLM Provider Service (Gemini / OpenAI API / Mock Mode)              |
|   - OpenWeather / Agmarknet API Integration Layer                       |
+-------------------------------------------------------------------------+
```

---

## 2. Frontend Component Architecture

```
src/
├── assets/             # Branding icons, images & static assets
├── components/
│   ├── common/         # Navbar, LanguageSelector, Footer, LoadingSpinner, AlertBanner
│   ├── dashboard/      # ProfileCard, WeatherWidget, QuickStats, ActionCards
│   ├── simulator/      # InputForm, ScenarioCard, RevenueComparisonChart, RiskBadge
│   ├── transport/      # TransportCard, RequestModal, MatchList, CapacityFilter
│   ├── markets/        # MarketPriceTable, CropFilter, PriceTrendChart
│   └── chat/           # ChatWindow, VoiceInputButton, AudioPlayer, SuggestionPills
├── context/
│   ├── AuthContext.jsx       # Auth state, JWT storage, Login/Logout
│   ├── LanguageContext.jsx   # Multilingual strings (EN/GU/HI)
│   └── DemoContext.jsx       # Demo user profile switchers
├── services/
│   ├── api.js          # Axios instance with interceptors
│   ├── authService.js   # Login/Register endpoints
│   ├── harvestService.js# Simulation API calls
│   ├── transportService.js# Transport match endpoints
│   └── chatService.js   # Chatbot API & Voice STT/TTS helpers
├── pages/
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── SimulatorPage.jsx
│   ├── TransportPage.jsx
│   ├── MarketsPage.jsx
│   ├── WeatherPage.jsx
│   ├── ProfilePage.jsx
│   └── AdminPage.jsx
└── App.jsx             # React Router setup & protected routes
```

---

## 3. Backend System Design

```
backend/
├── config/
│   ├── database.js     # MySQL Sequelize connection setup
│   └── jwt.js          # JWT secret & options
├── controllers/
│   ├── authController.js
│   ├── profileController.js
│   ├── marketController.js
│   ├── harvestController.js
│   ├── transportController.js
│   ├── weatherController.js
│   ├── chatController.js
│   └── adminController.js
├── middleware/
│   ├── authMiddleware.js # JWT verification & role checks
│   ├── validateInput.js  # Request body validation
│   └── errorHandler.js   # Global express error handler
├── models/             # Sequelize Models (User, Profile, Crop, Market, Price, etc.)
├── routes/             # Express Routers (/api/auth, /api/harvest, etc.)
├── services/
│   ├── aiService.js         # Unified AI provider interface
│   ├── fallbackAiEngine.js  # Rule-based fallback bot
│   ├── mathEngine.js        # Deterministic financial calculation engine
│   └── weatherService.js    # Weather API parser
└── server.js           # Entry point
```

---

## 4. Multilingual & Voice Processing Sequence

```
User Speaks (Gujarati/Hindi) 
   │
   ▼
[Browser Web Speech API] ──► Converts Audio to Text Transcript
   │
   ▼
[Chat UI Component] ───────► Sends Text + User Preferred Language to POST /api/chat/message
   │
   ▼
[Backend Chat Controller] ─► 1. Detect Intent (Calculation vs Market Query vs Weather)
                             2. Fetch Structured DB Context (Prices, Forecast)
                             3. Execute Math Engine (if numeric query)
                             4. Pass Context to AI Service (Gemini/Fallback)
   │
   ▼
[AI Response JSON] ────────► Clean text response with transparent source tags
   │
   ▼
[Browser TTS Engine] ──────► Speaks response back in Gujarati/Hindi/English
```

---

## 5. Security Architecture
- **Password Security**: Hashed using `bcryptjs` with salt rounds = 10.
- **API Protection**: Stateless JWT tokens stored in browser `localStorage` or `httpOnly` cookie.
- **SQL Injection Prevention**: Prepared statements through Sequelize ORM.
- **Environment Isolation**: API Keys (AI Provider, Weather, DB credentials) strictly maintained in `.env`.
