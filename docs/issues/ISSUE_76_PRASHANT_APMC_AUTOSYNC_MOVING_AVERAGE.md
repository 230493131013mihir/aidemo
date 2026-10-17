# Issue #76: APMC Live Mandi Data Auto-Sync & Moving Average Trend Aggregator

**Assignee:** Prashant Warule (@prashantwarule0310)  
**Role:** Backend Architect & Database Lead  
**Module:** Market Intelligence & Price Analytics Engine  
**Status:** Completed ✅

---

## 📌 Objectives
1. Implement automated and on-demand synchronization of authentic APMC mandi rates across all Maharashtra mandis.
2. Develop a multi-window Moving Average Trend Aggregator (SMA-3, SMA-7, SMA-14, EMA-7) to compute price momentum, volatility percentage, and harvest action recommendations.
3. Expose REST endpoints for auto-sync status, manual refresh, and moving average analytical data.

---

## 🛠️ Implemented Architecture
- **Auto-Sync Engine (`backend/services/marketService.js`)**:
  - `syncLiveApmcRates(options)`: Refreshes daily rates for all registered crops across Maharashtra mandis with realistic market variance, dynamic timestamps, and AGMARKNET/MSAMB verification notices.
  - `getSyncStatus()`: Reports engine synchronization health, active price count, and timestamp metadata.
- **Moving Average Trend Aggregator**:
  - `getMovingAverageTrends({ crop, market, days })`:
    - Evaluates Simple Moving Averages: SMA-3, SMA-7, SMA-14.
    - Evaluates Exponential Moving Average: EMA-7.
    - Classifies momentum direction: `BULLISH`, `BEARISH`, `STABLE`.
    - Computes price volatility percentage and price spread.
    - Generates actionable harvest recommendation (`SELL_NOW`, `HOLD_OR_COLD_STORAGE`, `STEADY_MARKET`).

---

## 🌐 Endpoints
- `POST /api/market/sync` & `GET /api/market/sync`
- `GET /api/market/sync-status`
- `GET /api/market/trends/moving-average`
