# Issue #77: Price Surge/Drop Alert Simulator with Multilingual WhatsApp & SMS Payloads

**Assignee:** Prashant Warule (@prashantwarule0310)  
**Role:** Backend Architect & Database Lead  
**Module:** Real-Time Farmer Alerting & Notification Layer  
**Status:** Completed ✅

---

## 📌 Objectives
1. Implement a rule-based Price Surge & Drop Alert Simulator to detect significant market price movements relative to baseline and moving averages.
2. Generate multilingual notification payloads supporting Marathi (`mr`), Hindi (`hi`), Gujarati (`gu`), and English (`en`).
3. Format full WhatsApp messages with bold highlights, actionable advice, and links, alongside strict GSM-safe SMS text (<160 characters).
4. Provide active APMC market price movement scanner and notification dispatch simulator.

---

## 🛠️ Implemented Architecture
- **Alert Service (`backend/services/alertService.js`)**:
  - `simulatePriceAlert(params)`: Classifies price changes into `PRICE_SURGE`, `PRICE_DROP`, and `PRICE_STABLE` based on configurable thresholds.
  - Generates localized WhatsApp payloads with emojis and call-to-action links.
  - Generates concise SMS messages guaranteed $\le 160$ characters.
  - `dispatchAlert(alertData, channels)`: Simulates delivery via Meta WhatsApp Business API and National SMS Gateway.
  - `getActiveMarketAlerts(filter)`: Scans state mandis and identifies commodities trading above or below median rates.

---

## 🌐 Endpoints
- `POST /api/market/alerts/simulate` & `GET /api/market/alerts/simulate`
- `GET /api/market/alerts/active`
- `POST /api/market/alerts/dispatch`
