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

## 3. Market Explorer Endpoints

### `GET /api/markets`
List all supported Mandi markets.
- **Query Params**: `district`, `state`

### `GET /api/markets/prices`
Get commodity prices across markets.
- **Query Params**: `crop_id`, `market_id`, `date`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 101,
        "market_name": "Surat APMC Mandi",
        "crop_name": "Tomato",
        "price_per_kg": 18.50,
        "price_per_quintal": 1850.00,
        "data_type": "sample_demo",
        "last_updated": "2026-10-02"
      }
    ]
  }
  ```

### `GET /api/markets/prices/trends`
Fetch historical 7-day or 30-day price trends for chart rendering.

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
    "session_id": 12
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "reply": "તમારા વિસ્તારમાં આજે ટામેટાંનો ભાવ ₹18.50/કિલો છે. Harvest Simulator મુજબ આજે વેચવાથી ₹7,750 ચોખ્ખો નફો થઈ શકે છે...",
    "source_disclaimer": "બજારના આંકડા ડેમો સેમ્પલ ડેટા આધારિત છે."
  }
  ```

### `GET /api/chat/sessions`
Get list of previous chat conversations.

---

## 8. Administration Endpoints (Admin Role Only)

- `GET /api/admin/overview`: System statistics.
- `POST /api/admin/market-prices`: Manual entry or update of Mandi prices.
- `PUT /api/admin/market-prices/:id`: Edit Mandi price entry.
- `GET /api/admin/reports`: View user feedback or data discrepancy reports.
