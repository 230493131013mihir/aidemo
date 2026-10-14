# API DOCUMENTATION: HarvestMitra AI 📡

Base API URL: `http://localhost:5000/api`

Authorization Header: `Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new farmer user account.
- **Request Body**:
  ```json
  {
    "full_name": "Ramesh Patel",
    "phone_number": "9876543210",
    "password": "Password@123",
    "preferred_language": "gu",
    "district": "Surat"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5...",
    "user": { "id": 1, "full_name": "Ramesh Patel", "role": "farmer" }
  }
  ```

### `POST /api/auth/login`
Authenticates a user and returns a JWT token.
- **Request Body**:
  ```json
  {
    "phone_number": "9876543210",
    "password": "Password@123"
  }
  ```

### `GET /api/auth/me`
Retrieves currently logged-in user profile. Protected by JWT.

---

## 2. Farmer Profile Endpoints

### `GET /api/profile`
Fetch detailed profile (farm size, primary crops, preferred mandi).

### `PUT /api/profile`
Update profile information.

### `DELETE /api/profile`
Deletes user profile & associated data.

---

## 3. Market Explorer Endpoints (ISSUE-11)

### `GET /api/markets`
List all supported Mandi markets.
- **Query Params**: `district`, `state`
- **Response**:
  ```json
  {
    "success": true,
    "count": 8,
    "data": [
      {
        "id": 1,
        "name": "Surat APMC Mandi",
        "district": "Surat",
        "state": "Gujarat",
        "distanceFromSuratKm": 0,
        "operatingDays": "Mon-Sat",
        "contact": "+91 261 2456789"
      }
    ]
  }
  ```

### `GET /api/markets/crops`
List all supported commodities with multilingual names (English, Gujarati, Hindi, Marathi).
- **Response**:
  ```json
  {
    "success": true,
    "count": 7,
    "data": [
      { "id": 1, "name": "Tomato", "name_gu": "ટામેટાં", "name_hi": "टमाटर", "name_mr": "टोमॅटो", "category": "vegetable" }
    ]
  }
  ```

### `GET /api/markets/prices`
Get commodity prices filtered by crop, market, district, or data status.
- **Query Params**: `crop`, `crop_id`, `market`, `market_id`, `district`, `state`, `data_type`
- **Response**:
  ```json
  {
    "success": true,
    "count": 5,
    "data": [
      {
        "id": 101,
        "crop_id": 1,
        "crop_name": "Tomato",
        "market_id": 1,
        "market_name": "Surat APMC Mandi",
        "district": "Surat",
        "state": "Gujarat",
        "price_per_kg": 20.00,
        "price_per_quintal": 2000.00,
        "min_price": 18.00,
        "max_price": 22.00,
        "modal_price": 20.00,
        "dataStatus": "DEMO",
        "source": "HarvestMitra Demo Dataset",
        "last_updated": "2026-10-03T09:30:00Z"
      }
    ]
  }
  ```

### `GET /api/markets/prices/trends`
Fetch historical 7-day or 30-day price trends for chart rendering.
- **Query Params**: `crop`, `market`, `days` (default `7`)

### `GET /api/markets/compare`
Side-by-side factual comparative market price metrics for a crop across APMCs.
- **Query Params**: `crop` (e.g. `Tomato`), `marketIds` (comma-separated IDs)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "crop": "Tomato",
      "totalMarkets": 5,
      "highestMarket": { "name": "Pune APMC", "pricePerKg": 27.5 },
      "lowestMarket": { "name": "Surat APMC Mandi", "pricePerKg": 20.0 },
      "priceDifferencePerKg": 7.5,
      "comparisons": [...]
    }
  }
  ```

---

## 4. Harvest Decision Simulator Endpoints

### `POST /api/harvest/simulate`
Executes mathematical profit comparison between 3 selling strategies.
- **Request Body**:
  ```json
  {
    "crop_id": 1,
    "quantity_kg": 500,
    "current_market_id": 1,
    "alt_market_id": 2,
    "transport_cost": 1200,
    "packaging_cost": 300,
    "assumed_future_price_per_kg": 22.00
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "option1_sell_today": {
        "gross_revenue": 9250.00,
        "net_revenue": 7750.00,
        "expenses": 1500.00,
        "price_per_kg": 18.50
      },
      "option2_hold_2days": {
        "gross_revenue": 11000.00,
        "net_revenue": 9200.00,
        "expenses": 1800.00,
        "assumed_price_per_kg": 22.00,
        "risks": ["Perishability loss risk (5-10%)", "Storage cost"]
      },
      "option3_alt_market": {
        "gross_revenue": 11500.00,
        "net_revenue": 8700.00,
        "expenses": 2800.00,
        "market_name": "Ahmedabad APMC"
      },
      "recommendation": "Option 2 offers highest potential return, but Option 1 carries zero risk."
    }
  }
  ```

### `GET /api/harvest/history`
Fetch past simulation history for the authenticated farmer.

---

## 5. Shared Transport Endpoints

### `GET /api/transport/requests`
Fetch open transport pooling requests.
- **Query Params**: `destination_market_id`, `pickup_district`, `date`

### `POST /api/transport/requests`
Create a new shared transport pool offer or request.

### `GET /api/transport/matches`
Smart match finder that groups compatibility by route and vehicle capacity.

### `POST /api/transport/matches/:id/accept`
Accept a shared transport pairing.

---

## 6. Weather Endpoints

### `GET /api/weather`
Get current weather & 5-day forecast for a district.

### `GET /api/weather/alerts`
Fetch actionable harvest advisories (e.g. rain alert within 48h).

---

## 7. AI Chatbot (Mitra Assistant) Endpoints

### `POST /api/chat/message`
Send a text or transcribed voice query to Mitra Assistant.
- **Request Body**:
  ```json
  {
    "message": "મારે 500 કિલો ટામેટા વેચવા છે, શું આજે વેચવું જોઈએ?",
    "language": "gu",
    "session_id": 12,
    "conversationHistory": [],
    "context": {
      "crop": { "name": "Tomato", "quantityKg": 500 },
      "marketData": { "currentMarket": { "name": "Surat APMC", "pricePerKg": 20 } }
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "provider": "gemini",
    "mode": "ai",
    "message": "તમારા વિસ્તારમાં આજે ટામેટાંનો ભાવ ₹20/કિલો છે. Harvest Simulator મુજબ આજે વેચવાથી ₹7,750 ચોખ્ખો નફો થઈ શકે છે...",
    "reply": "તમારા વિસ્તારમાં આજે ટામેટાંનો ભાવ ₹20/કિલો છે...",
    "metadata": {
      "session_id": 12,
      "intent": "harvest_decision",
      "language": "gu",
      "model": "gemini-1.5-flash"
    },
    "source_disclaimer": "બજારના આંકડા ડેમો સેમ્પલ ડેટા આધારિત છે."
  }
  ```

### `GET /api/chat/status`
Check AI provider status, fallback readiness, and supported languages safely without revealing credentials.
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "Mitra Assistant AI Service Layer",
    "provider": "gemini",
    "isProviderConfigured": false,
    "fallbackReady": true,
    "supportedLanguages": ["en", "hi", "gu", "mr"]
  }
  ```

---

## 7. Weather & District Rain Advisory Endpoints (ISSUE-11)

### `GET /api/weather`
Retrieve current weather, 3-day forecast, and deterministic district rain advisory.
- **Query Params**: `district` (e.g. `Surat`), `state` (e.g. `Gujarat`)
- **Response**:
  ```json
  {
    "success": true,
    "location": {
      "district": "Surat",
      "state": "Gujarat"
    },
    "weather": {
      "temperature": 29,
      "humidity": 78,
      "rainProbability": 70,
      "rainfallMm": 14.5,
      "windSpeedKmh": 18,
      "condition": "Rain expected",
      "forecast": [
        { "day": "Today", "temp": 29, "rainProbability": 70, "condition": "Rain expected" },
        { "day": "Tomorrow", "temp": 28, "rainProbability": 65, "condition": "Scattered Showers" },
        { "day": "Day After", "temp": 31, "rainProbability": 30, "condition": "Partly Cloudy" }
      ]
    },
    "advisory": {
      "level": "RAIN_ADVISORY",
      "isAdvisoryActive": true,
      "threshold": 60,
      "rainProbability": 70,
      "message": "Rain is expected in the selected district based on the available forecast. Consider checking harvest readiness and transportation plans before moving produce.",
      "reason": "Rain probability (70%) meets or exceeds the configured advisory threshold (60%).",
      "actionableTips": [
        "Cover harvested produce with waterproof tarpaulins or move to dry shelter.",
        "Coordinate with transport partners to ensure vehicles have covered cargo beds.",
        "Review harvest timing: avoid picking perishable crops immediately before or during heavy rain."
      ]
    },
    "dataStatus": "DEMO",
    "source": "HarvestMitra Demo Weather Dataset",
    "lastUpdated": "2026-10-03T10:00:00Z"
  }
  ```

### `GET /api/weather/alerts`
Quick endpoint returning only the active advisory and key metrics for mobile widgets.
- **Query Params**: `district`, `state`

### `GET /api/chat/sessions`
Get list of previous chat conversations.

---

## 8. Administration Endpoints (Admin Role Only)

- `GET /api/admin/overview`: System statistics.
- `POST /api/admin/market-prices`: Manual entry or update of Mandi prices.
- `PUT /api/admin/market-prices/:id`: Edit Mandi price entry.
- `GET /api/admin/reports`: View user feedback or data discrepancy reports.
