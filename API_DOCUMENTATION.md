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

All transport endpoints require JWT authentication (`Authorization: Bearer <TOKEN>`).

### `GET /api/transport/my-requests`
Fetch transport requests belonging to the logged-in user. For transporters, also returns trips they've been assigned to.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 12,
        "userId": 1,
        "farmerName": "Ramesh Patel",
        "farmerPhone": "9876543210",
        "cropName": "Tomato",
        "pickupLocation": "Olpad, Surat",
        "destinationMarket": "Surat APMC",
        "pickupDate": "2026-10-16",
        "weightKg": 500,
        "vehicleType": "any",
        "vehicleNumber": null,
        "estimatedSharedCost": 900,
        "estimatedDurationMinutes": 90,
        "gatePassCode": "GJ-APMC-482916",
        "status": "open",
        "driverName": null,
        "driverPhone": null,
        "transporterId": null,
        "createdAt": "2026-10-15T08:30:00.000Z"
      }
    ]
  }
  ```

### `POST /api/transport/requests`
Create a new shared transport pooling request. Automatically generates a digital APMC gate pass code and estimates shared cost.
- **Request Body**:
  ```json
  {
    "farmerName": "Ramesh Patel",
    "farmerPhone": "9876543210",
    "cropName": "Tomato",
    "pickupLocation": "Olpad, Surat",
    "destinationMarket": "Surat APMC",
    "pickupDate": "2026-10-16",
    "weightKg": 500,
    "vehicleType": "any"
  }
  ```
- **Required Fields**: `farmerName`, `cropName`, `pickupLocation`, `destinationMarket`, `pickupDate` (YYYY-MM-DD), `weightKg`
- **Auto-Generated Fields**: `gatePassCode`, `estimatedSharedCost`, `estimatedDurationMinutes`
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Transport request created with gate pass GJ-APMC-482916",
    "data": {
      "id": 13,
      "gatePassCode": "GJ-APMC-482916",
      "estimatedSharedCost": 900,
      "estimatedDurationMinutes": 90,
      "status": "open"
    }
  }
  ```

### `GET /api/transport/transporters`
List all registered transporters with vehicle info and availability.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "driverName": "Vijay Singh",
        "phone": "9876501234",
        "vehicleType": "Mahindra Bolero Maxi",
        "vehicleNumber": "GJ-05-TR-1001",
        "capacityKg": 2000,
        "baseMandi": "Surat APMC",
        "ratePerKm": 25,
        "isAvailable": true
      }
    ]
  }
  ```

### `GET /api/transport/open-cargo`
Fetch open cargo requests available for transporters to accept (status = `open`).
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 12,
        "farmerName": "Ramesh Patel",
        "cropName": "Tomato",
        "pickupLocation": "Olpad, Surat",
        "destinationMarket": "Surat APMC",
        "pickupDate": "2026-10-16",
        "weightKg": 500,
        "status": "open"
      }
    ]
  }
  ```

### `GET /api/transport/active-trip`
Fetch the transporter's currently active trip (status = `in_transit`). Returns `null` if no active trip.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 12,
      "status": "in_transit",
      "gatePassCode": "GJ-APMC-482916",
      "farmerName": "Ramesh Patel",
      "destinationMarket": "Surat APMC",
      "estimatedDurationMinutes": 90
    }
  }
  ```

### `GET /api/transport/transporter-stats`
Get delivery statistics for the logged-in transporter.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalTrips": 15,
      "completedTrips": 12,
      "activeTrips": 1,
      "totalWeightKg": 18500,
      "totalEarnings": 27000
    }
  }
  ```

### `PUT /api/transport/requests/:id/accept`
Transporter accepts an open transport request. Assigns the transporter and changes status to `matched`.
- **Request Body** (optional):
  ```json
  {
    "vehicleNumber": "GJ-05-TR-1001",
    "vehicleType": "Mahindra Bolero Maxi"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Trip accepted. You are now assigned as the transporter.",
    "data": {
      "id": 12,
      "status": "matched",
      "transporterId": 3,
      "driverName": "Vijay Singh",
      "vehicleNumber": "GJ-05-TR-1001"
    }
  }
  ```
- **Error (409 Conflict)**: Transporter already has an active trip.

### `PUT /api/transport/requests/:id/progress`
Update the tracking progress of a transport trip. Used by transporters to move through the trip stepper stages.
- **Request Body**:
  ```json
  {
    "status": "in_transit"
  }
  ```
- **Valid Status Transitions**: `matched` → `in_transit` → `delivered`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Trip status updated to in_transit",
    "data": {
      "id": 12,
      "status": "in_transit"
    }
  }
  ```

### `POST /api/transport/register-vehicle`
Register a new transporter vehicle profile.
- **Request Body**:
  ```json
  {
    "driverName": "Vijay Singh",
    "phone": "9876501234",
    "vehicleType": "Mahindra Bolero Maxi",
    "vehicleNumber": "GJ-05-TR-1001",
    "capacityKg": 2000,
    "baseMandi": "Surat APMC",
    "ratePerKm": 25
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Vehicle registered successfully",
    "data": {
      "id": 2,
      "driverName": "Vijay Singh",
      "vehicleNumber": "GJ-05-TR-1001",
      "isAvailable": true
    }
  }
  ```

### `GET /api/transport/requests` *(Admin Only)*
Admin-only endpoint to list all transport requests system-wide.
- **Requires**: `adminMiddleware`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [ /* ...all transport requests across users... */ ]
  }
  ```

### `PUT /api/transport/requests/:id/status` *(Admin Only)*
Admin-only endpoint to override/update a transport request status.
- **Requires**: `adminMiddleware`
- **Request Body**:
  ```json
  {
    "status": "cancelled"
  }
  ```

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

## 8. Weather & District Rain Advisory Endpoints

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
      "message": "Rain is expected in the selected district based on the available forecast.",
      "actionableTips": [
        "Cover harvested produce with waterproof tarpaulins or move to dry shelter.",
        "Coordinate with transport partners to ensure vehicles have covered cargo beds.",
        "Review harvest timing: avoid picking perishable crops immediately before or during heavy rain."
      ]
    },
    "dataStatus": "DEMO",
    "source": "HarvestMitra Demo Weather Dataset"
  }
  ```

### `GET /api/weather/alerts`
Quick endpoint returning only the active advisory and key metrics for mobile widgets.
- **Query Params**: `district`, `state`

### `GET /api/chat/sessions`
Get list of previous chat conversations.

---

## 9. Administration Endpoints (Admin Role Only)

All admin endpoints require both `authMiddleware` (valid JWT) and `adminMiddleware` (role = `admin`). Non-admin users receive **403 Forbidden**.

### `GET /api/admin/overview`
System-wide statistics dashboard data.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "users": 24,
      "farmers": 18,
      "markets": 65,
      "marketPrices": 312,
      "transportRequests": 47
    }
  }
  ```

### `GET /api/admin/users`
List all registered users with their farmer profiles. Passwords are never included.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Ramesh Patel",
        "email": "demo@harvestmitra.local",
        "phone": "9876543210",
        "role": "farmer",
        "createdAt": "2026-10-01T09:00:00.000Z",
        "FarmerProfile": {
          "district": "Surat",
          "state": "Gujarat",
          "farmSizeAcres": 4.5,
          "mainCrop": "Tomato"
        }
      }
    ]
  }
  ```

### `PUT /api/admin/users/:id`
Update a user's role, name, phone, or farmer profile fields. Admin cannot demote their own account.
- **Request Body**:
  ```json
  {
    "role": "farmer",
    "name": "Ramesh Patel Updated",
    "phone": "9876543211",
    "district": "Ahmedabad",
    "state": "Gujarat",
    "farmSizeAcres": 5.0,
    "mainCrop": "Potato"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": { /* ...updated user object with FarmerProfile... */ }
  }
  ```
- **Error (400)**: `"Admin cannot demote own account"` or invalid role.
- **Error (404)**: `"User not found"`.

### `DELETE /api/admin/users/:id`
Delete a user account. Admin cannot delete their own account.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User deleted"
  }
  ```

### `GET /api/admin/market-prices`
List all market prices with associated Market and Crop data, sorted by most recent date first (limit 300).
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 101,
        "marketId": 1,
        "cropId": 1,
        "pricePerQuintal": 2000,
        "pricePerKg": 20.0,
        "minPrice": 1840,
        "maxPrice": 2160,
        "priceDate": "2026-10-15",
        "dataType": "verified_live",
        "Market": { "id": 1, "name": "Surat APMC Mandi", "district": "Surat", "state": "Gujarat" },
        "Crop": { "id": 1, "nameEn": "Tomato", "nameGu": "ટામેટાં", "nameHi": "टमाटर" }
      }
    ]
  }
  ```

### `POST /api/admin/market-prices`
Create or upsert a market price entry. If a record already exists for the same market + crop + date, it is updated instead.
- **Request Body**:
  ```json
  {
    "marketId": 1,
    "cropId": 1,
    "pricePerQuintal": 2100,
    "pricePerKg": 21.0,
    "minPrice": 1932,
    "maxPrice": 2268,
    "priceDate": "2026-10-15"
  }
  ```
- **Required Fields**: `marketId`, `cropId`, `pricePerQuintal`
- **Auto-Calculated** (if not provided): `pricePerKg` (quintal/100), `minPrice` (quintal×0.92), `maxPrice` (quintal×1.08), `priceDate` (today)
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Market price for Tomato in Surat APMC Mandi saved successfully to MySQL.",
    "data": { /* ...full market price record with Market and Crop includes... */ }
  }
  ```

### `PUT /api/admin/market-prices/:id`
Update an existing market price record.
- **Request Body**:
  ```json
  {
    "pricePerQuintal": 2200
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": { /* ...updated record... */ }
  }
  ```

### `DELETE /api/admin/market-prices/:id`
Delete a market price record.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Market price record deleted successfully"
  }
  ```

### `GET /api/admin/markets`
List all APMC markets available in the system, sorted by state and name.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Surat APMC Mandi",
        "district": "Surat",
        "state": "Gujarat"
      }
    ]
  }
  ```

### `GET /api/admin/crops`
List all crops with multilingual names, sorted alphabetically by English name.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "nameEn": "Tomato",
        "nameGu": "ટામેટાં",
        "nameHi": "टमाटर"
      }
    ]
  }
  ```

### `GET /api/admin/reports`
View user-submitted reports and feedback, sorted by most recent (limit 200).
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "userId": 5,
        "type": "price_discrepancy",
        "description": "Tomato price at Surat APMC seems incorrect",
        "createdAt": "2026-10-14T14:30:00.000Z",
        "User": { "id": 5, "name": "Ramesh Patel", "email": "demo@harvestmitra.local" }
      }
    ]
  }
  ```

---

## Mandi Analytics, Auto-Sync & Alerts (Prashant Warule - Issues #76, #77)

### `POST /api/market/sync`
Trigger auto-sync of live APMC rates across all Maharashtra mandis.
- **Query / Body (optional)**: `{ "state": "Maharashtra" }`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": "SUCCESS",
    "timestamp": "2026-10-17T09:47:20.000Z",
    "date": "2026-10-17",
    "recordsUpdated": 850,
    "marketsCount": 50,
    "cropsCount": 17,
    "state": "Maharashtra",
    "source": "Maharashtra State Agricultural Marketing Board (MSAMB) & AGMARKNET Live Portal"
  }
  ```

### `GET /api/market/sync-status`
Retrieve auto-sync engine health, last sync timestamps, and total active verified rates.

### `GET /api/market/trends/moving-average`
Retrieve multi-period Simple Moving Averages (SMA-3, SMA-7, SMA-14), Exponential Moving Average (EMA-7), trend momentum (BULLISH/BEARISH/STABLE), and volatility percentage.
- **Query Parameters**:
  - `crop`: Commodity name (default: "Tomato")
  - `market`: APMC market name (default: "Pune APMC (Gultekdi)")
  - `days`: Window length 7 to 90 (default: 14)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "crop": "Cotton",
      "market": "Pune APMC (Gultekdi)",
      "days": 14,
      "currentPrice": 76.5,
      "currentPricePerQuintal": 7650,
      "sma3": 76.2,
      "sma7": 75.8,
      "sma14": 74.9,
      "ema7": 76.0,
      "trendDirection": "BULLISH",
      "volatilityPercentage": 4.82,
      "recommendation": {
        "action": "SELL_NOW",
        "signalStrength": "STRONG",
        "summary": "Strong upward price momentum detected (+₹1.6/kg above 14-day average)."
      },
      "points": [ /* daily points with price, sma3, sma7, sma14, ema7 */ ]
    }
  }
  ```

### `POST /api/market/alerts/simulate` (and `GET /api/market/alerts/simulate`)
Simulate or detect APMC price surge and price drop alerts with multilingual WhatsApp & GSM-safe SMS payloads (<160 chars).
- **Parameters**:
  - `crop`: Commodity (e.g. "Cotton", "Tomato")
  - `market`: Mandi name (e.g. "Nashik APMC")
  - `currentPrice`: Current rate ₹/kg
  - `baselinePrice`: Baseline rate ₹/kg
  - `thresholdPercent`: Alert trigger threshold % (default: 5.0)
  - `language`: `"mr"` (Marathi), `"hi"` (Hindi), `"gu"` (Gujarati), `"en"` (English)
  - `farmerName`: Farmer's name
  - `farmerPhone`: Mobile number
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "alertId": "HM-ALT-481920",
    "alertType": "PRICE_SURGE",
    "severity": "HIGH",
    "percentChange": 12.0,
    "notifications": {
      "whatsapp": {
        "channel": "WhatsApp Cloud API",
        "message": "🚀📈 *कृषी भाव वाढ सूचना (Price Surge Alert)*\n...\n🔗 थेट बाजार दर पहा: https://harvestmitra.in/mandis"
      },
      "sms": {
        "channel": "GSM SMS Gateway",
        "message": "हार्वेस्टमित्र: Nashik APMC मध्ये Cotton चा भाव +12% वाढून रु.84/किलो झाला...",
        "charCount": 139,
        "isWithinGsmLimit": true
      }
    }
  }
  ```

### `GET /api/market/alerts/active`
Retrieve all current active price surge and price drop alerts across mandis.

### `POST /api/market/alerts/dispatch`
Simulate immediate transmission of notifications via Meta WhatsApp Business API and National SMS Gateway.

---

## Printable Farm Decision Summary Report API (Prashant Warule - Issue #78)

### `GET /api/reports/farm-decision` (and `POST /api/reports/farm-decision`)
Generate complete 3-scenario harvest decision analysis combining farmer profile, live APMC rates, weather risk assessment, moving average momentum, and deterministic math engine net revenue comparisons.
- **Parameters (optional)**:
  - `farmerName`, `phone`, `village`, `district`, `state`, `farmSizeAcres`
  - `crop`, `quantityKg`
  - `localMandi`, `regionalMandi`, `localPricePerKg`, `regionalPricePerKg`
  - `format`: `"json"` (default) or `"html"` / `"print"`
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "reportId": "HM-REP-291823-741",
    "metadata": {
      "title": "Farm Decision & Harvest Financial Summary Report",
      "digitalSignatureHash": "SHA256:4FA8...",
      "generatedDate": "2026-10-17"
    },
    "farmer": {
      "name": "Ramesh Patel",
      "crop": "Tomato",
      "quantityKg": 1500
    },
    "financialScenarios": {
      "option1_sellToday": { "grossRevenue": 27000, "totalCost": 2550, "netRevenue": 24450 },
      "option2_holdAndSellLater": { "grossRevenue": 31500, "totalCost": 4125, "netRevenue": 27375, "profitDifferenceVsBaseline": 2925 },
      "option3_regionalMandiSharedTransport": { "grossRevenue": 42000, "totalCost": 3625, "netRevenue": 38375, "profitDifferenceVsBaseline": 13925 }
    },
    "recommendation": {
      "winningOption": "Alternative Market",
      "netAdvantage": 13925,
      "percentageGain": 56.9,
      "actionableAdvice": "Recommended Strategy: Opt for Alternative Market. Expected to generate ₹13,925 (+56.9%) higher net return."
    }
  }
  ```

### `GET /api/reports/farm-decision/print`
Render high-resolution, A4-ready printable HTML document directly in browser with official HarvestMitra AI header, verification QR seal, 3-scenario comparison table, farmer & extension officer signature lines, and print styling (`@media print`). Append `?autoprint=true` to automatically trigger print dialog.

### `GET /api/reports/farm-decision/download`
Download the printable farm decision summary document as a standalone HTML file with `Content-Disposition: attachment`.


