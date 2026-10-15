# 🧮 HarvestMitra AI — Harvest Simulator & Transport Calculation Specifications

This document defines the mathematical models, formulas, and benchmark test cases implemented by **Prashant** for the Harvest Decision Simulator (`backend/services/mathEngine.js`) and the Shared Transport Pooling Engine (`backend/services/transportMatcher.js`).

---

## 1. Core Financial Formulas

### 1.1 Gross Revenue
$$\text{Gross Revenue} = \text{Quantity (kg)} \times \text{Price per kg (₹)}$$

### 1.2 Total Cost Breakdown
$$\text{Total Cost} = \text{Transport Cost} + \text{Packaging Cost} + \text{Labor Cost} + \text{Mandi Cess} + \text{Holding/Spoilage Risk}$$

Where:
* **Transport Cost**: Base haulage rate per km or shared vehicle pool cost.
* **Packaging & Labor**: Per-kg cost of crating, bagging, loading, and unloading.
* **Mandi Cess/Fee**: APMC regulatory cess (typically 1.5% to 2.5% of Gross Revenue).
* **Holding Spoilage Risk**: Applied only to Option 2 (Hold & Sell Later):
  $$\text{Spoilage Loss} = \text{Quantity} \times \text{Perishability Rate per Day} \times \text{Holding Days} \times \text{Price}$$

### 1.3 Net Revenue
$$\text{Net Revenue} = \text{Gross Revenue} - \text{Total Cost}$$

### 1.4 Profit Difference vs. Baseline
$$\Delta \text{Net} = \text{Net Revenue (Option)} - \text{Net Revenue (Baseline: Sell Today)}$$

---

## 2. Three-Way Scenario Comparison Engine

The simulator evaluates three distinct logistical pathways for the farmer:

| Scenario | Market Location | Timeframe | Risk Factors |
| :--- | :--- | :--- | :--- |
| **Option 1: Sell Today** | Local Mandi | Immediate | Baseline: Minimum price volatility, zero holding spoilage. |
| **Option 2: Hold & Sell Later** | Local Mandi or Cold Store | 3 to 14 Days | Price surge potential vs. storage fees and crop degradation. |
| **Option 3: Transport to Winning Mandi** | Regional / Metro Mandi | 1 to 2 Days | Highest price arbitrage vs. long-haul transport and transit risk. |

### Recommendation Decision Logic
$$\text{Best Option} = \arg\max_{i \in \{1, 2, 3\}} (\text{Net Revenue}_i)$$

If Net Revenues are within 2% margin, the engine favors **Option 1 (Sell Today)** to minimize farmer risk.

---

## 3. Benchmark Verification Test Cases

### Test Case 1: Perishable Crop (Tomato) — High Price Arbitrage
* **Crop**: Tomato (Perishable)
* **Quantity**: 1,500 kg
* **Local Mandi Price (Today)**: ₹18.00 / kg
  - Gross: ₹27,000 | Costs (Local Transport + Mandi Fee): ₹2,500 | **Net: ₹24,500**
* **Hold 5 Days (Projected Price ₹21.00 / kg)**:
  - Gross: ₹31,500 | Storage + 8% Spoilage Loss (₹2,520) + Mandi Fee: ₹5,200 | **Net: ₹26,300** ($\Delta = +₹1,800$)
* **Regional Metro Mandi (Ahmedabad APMC @ ₹28.00 / kg via Shared Transport)**:
  - Gross: ₹42,000 | Shared Truck (₹4,500) + Handling + Cess (₹3,000): ₹7,500 | **Net: ₹34,500** ($\Delta = +₹10,000$)
* **Engine Decision**: **Option 3 (Transport to Ahmedabad Mandi)** wins with a ₹10,000 (+40.8%) net profit increase!

---

### Test Case 2: Non-Perishable Crop (Wheat / Grain) — Hold Strategy
* **Crop**: Wheat (Durable / Non-perishable)
* **Quantity**: 5,000 kg
* **Local Mandi Price (Today)**: ₹24.50 / kg $\to$ Net: ₹117,500
* **Hold 14 Days (Forecast Post-Monsoon Shortage @ ₹28.00 / kg)**:
  - Storage cost @ ₹0.20/kg/month = ₹500 | Zero spoilage | Cess: ₹2,800 $\to$ **Net: ₹136,700** ($\Delta = +₹19,200$)
* **Engine Decision**: **Option 2 (Hold & Sell Later)** wins.

---

### Test Case 3: Small Batch Emergency — Sell Today Baseline
* **Crop**: Spinach / Green Leafy
* **Quantity**: 300 kg
* **Price Arbitrage**: Regional mandi is only ₹2/kg higher, but transport cost eats ₹2,000.
* **Engine Decision**: **Option 1 (Sell Today)** wins to avoid loss.

---

## 4. Shared Transport Pooling Cost Model

$$\text{Farmer Cost Share} = \text{Total Route Cost} \times \left( \frac{\text{Farmer Quantity (kg)}}{\sum \text{Pooled Quantities (kg)}} \right)$$

* **Savings Factor**: Standard single-farmer hired truck cost ₹6,000. Under 3-farmer shared load (1,500 kg + 1,200 kg + 1,300 kg = 4,000 kg / 5,000 kg vehicle), each farmer saves **40% to 55%** on freight!
