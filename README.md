# HarvestMitra AI 🌾🤖
> **"Smart Decisions. Better Harvests. Stronger Farmers."**

HarvestMitra AI is an AI-powered smart decision-support, market comparison, harvest simulation, and shared transportation system designed specifically for Indian farmers (with native multilingual support for Gujarati, Hindi, and English).

---

## 📌 Problem Statement
Small and medium-sized farmers in India frequently face severe financial losses due to:
1. **Unpredictable Market Fluctuations**: Inability to determine whether selling today or waiting for a few days yields better net revenue.
2. **High & Uncoordinated Transportation Expenses**: Single farmers transporting small produce loads bear 100% of vehicle costs.
3. **Weather Uncertainty**: Lack of actionable harvest advice tied to upcoming weather patterns (e.g. rain damage during harvest).
4. **Language & Tech Barriers**: Complex market applications lacking simple, localized voice interactions in languages like Gujarati and Hindi.

---

## ✨ Key Features

### 1. 🧮 Smart Harvest Decision Simulator
- Calculates **Gross Revenue** vs **Net Revenue** considering transport, packaging, and handling costs.
- Compares 3 real-world scenarios side-by-side:
  - **Option 1**: Sell produce today at local mandi.
  - **Option 2**: Wait and sell later (with clear risk indicators & user-defined price assumptions).
  - **Option 3**: Transport produce to a higher-paying regional market.
- Displays visual financial breakdown charts (Recharts).

### 2. 🚛 Shared Transport Matching
- Allows farmers heading to the same market on similar dates to pool vehicle capacity.
- Reduces individual transportation expenses by up to 50–70%.
- Smart matching algorithm by destination market, pickup date, and available weight capacity.

### 3. 🤖 Mitra Assistant (Multilingual Voice AI Chatbot)
- Specialized agricultural AI assistant supporting **Gujarati, Hindi, and English**.
- Integrated browser Speech-to-Text (STT) and Text-to-Speech (TTS).
- Provider-independent AI layer with deterministic math engine fallback (no hallucinations of numbers or prices).

### 4. 📊 Market Price Explorer
- Real-time and sample Mandi market prices comparison across major Indian markets.
- Historical price trend charts to help spot weekly patterns.

### 5. 🌦️ Weather-Aware Harvest Alerts
- Live location-based weather forecasts and rain probability warnings.
- Direct actionable alerts recommending whether to accelerate or delay harvest operations.

### 6. 👤 Farmer Profile & Admin Panel
- Profile management for farm location, primary crops, typical yield, and language preferences.
- Admin dashboard to manage market prices, seed sample data, inspect transport requests, and review reports.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React Icons |
| **Backend** | Node.js, Express.js, REST API, JWT Authentication, bcryptjs |
| **Database** | MySQL, Sequelize ORM |
| **AI Integration** | Provider-independent LLM Service Layer (Google Gemini / OpenAI compatible) with Deterministic Math Engine Fallback |
| **Integrations** | Web Speech API (Voice STT/TTS), Leaflet/OpenStreetMap |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18+ recommended)
- MySQL Server (v8.0+)
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/230493131013mihir/aidemo.git
cd aidemo
```

### 2. Database Setup
1. Create a MySQL database named `harvestmitra_db`:
   ```sql
   CREATE DATABASE harvestmitra_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure DB credentials and optional AI API Key in .env
npm run seed  # Seed sample crops, markets, prices, and demo users
npm run dev   # Starts server at http://localhost:5000
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev   # Starts Vite dev server at http://localhost:5173
```

---

## 🔐 Environment Variables (.env)

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=harvestmitra_db

# Security
JWT_SECRET=super_secret_jwt_key_harvestmitra_2026
JWT_EXPIRES_IN=7d

# Optional External AI API Key (Falls back to local deterministic engine if empty)
AI_PROVIDER=gemini
AI_API_KEY=your_optional_api_key

# Weather API (Optional sample fallback included)
WEATHER_API_KEY=your_weather_api_key
```

---

## 🎯 Hackathon Demo Persona

- **Name**: Ramesh Patel
- **Location**: Surat District, Gujarat
- **Crop**: Tomatoes (500 kg)
- **Language**: Gujarati
- **Demo Mode**: Accessible directly from Landing Page via **"Explore Demo"** without registration.

---

## 📄 License & Disclaimer
HarvestMitra AI is an educational decision-support prototype created for hackathon demonstration. Recommendations are based on math simulations and user-entered assumptions. The app does not guarantee market prices or agricultural financial returns.
