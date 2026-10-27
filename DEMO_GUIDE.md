# HACKATHON DEMO GUIDE & JUDGE SCRIPT: HarvestMitra AI 🎬

Use this guide for a seamless, high-impact presentation today at 2:00 PM.

---

## 👥 Evaluation Accounts & Credentials (Password: `123456`)

| Role | Name | Username | Email / Role Alias | Password | Default District / APMC |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **🌾 Farmer** | Mihir Jadav | `mihir` | `farmer` / `mihir@harvestmitra.local` | `123456` | Haveli, Pune (4.5 acres) |
| **🚚 Transporter** | Varun Patil | `varun` | `transport` / `varun@harvestmitra.local` | `123456` | Pune APMC / NH-160 Fleet |
| **🏪 Mandi Official** | Sayali Kulkarni | `sayali` | `mandi` / `sayali@harvestmitra.local` | `123456` | Pune APMC (Gultekdi Wholesale) |
| **🛡️ Admin** | Prashant | `prashant` | `admin` / `prashant@harvestmitra.local` | `123456` | Central APMC Directorate |

*Tip: On the `/login` screen, 1-click evaluation buttons auto-fill credentials for all 4 roles instantly.*

---

## 👨‍🌾 Core Evaluation Scenario: Maharashtra Horticulture Corridor

- **Farmer Name**: Mihir Jadav
- **District / Location**: Haveli, Pune District, Maharashtra
- **Produce**: Fresh Tomatoes (1,200 kg) & Onions (800 kg)
- **Current Situation**: Tomatoes harvested; local Pune APMC rate is ₹24.50/kg, while Mumbai Vashi Mega APMC is ₹32.00/kg.
- **Dilemma**: Solo truck to Mumbai costs ₹2,800, which eats the arbitrage gain. Can Mihir pool transport along the Pune–Mumbai Expressway with another consignment to save 50% on freight?

---

## ⏱️ 3.5-Minute Hackathon Presentation Script

### Step 1: Landing Page & Problem Statement (0:00 - 0:45)
1. Open application: `http://localhost:5173`.
2. Pitch: *"Maharashtra horticulture farmers lose up to 40% of their crop value to distress selling at local gates and exorbitant solo freight. HarvestMitra AI solves this with real-time market arbitrage and shared logistics pooling."*
3. Click **"🌾 Farmer"** on the 1-click evaluation row on `/login` to enter directly as **Mihir Jadav**.

### Step 2: Farmer Dashboard & Weather Advisory (0:45 - 1:15)
1. Show the personalized Marathi / English dashboard for **Mihir Jadav**.
2. Note the **Registered Crops**: Tomato (1,200 kg), Onion (800 kg), Wheat (1,500 kg) with real-time projected gross value.
3. Open **Weather Alerts** (`/weather`): Live Open-Meteo agro telemetry for Pune showing precipitation chance and actionable advice.

### Step 3: Mandi Price Intelligence & 14-Day Forecast (1:15 - 2:00)
1. Navigate to **Mandi Prices** (`/markets`).
2. Show the price spread: Pune APMC (₹24.50/kg) vs Mumbai Vashi APMC (₹32.00/kg).
3. Open **14-Day Forecast Tab**: Demonstrate algorithmic price trajectory with upper/lower 95% confidence bounds.

### Step 4: Shared Freight Logistics & Proportional Savings (2:00 - 2:40)
1. Navigate to **Shared Transport** (`/transport`).
2. Submit produce booking request (500 kg Tomatoes to Vashi APMC).
3. Show proportional cost breakdown: Solo fare of ₹2,800 drops to **₹1,400** (50% savings!).
4. Lock fare in **Freight Escrow**.

### Step 5: Tri-Party Loop: APMC Procurement, Gate Pass & AI Voice (2:40 - 3:30)
1. **Mandi Official View**: Switch to **Sayali Kulkarni** (`sayali` / `123456`) to view incoming farmer arrivals and issue procurement bookings.
2. **Transporter View**: Switch to **Varun Patil** (`varun` / `123456`) to accept cargo, assign truck `MH-12-TR-7890`, and generate the **Digital Mandi Gate Pass with QR Code**.
3. **Mitra Assistant**: Open chat, switch language to **Marathi** (`मराठी`), and ask: *"पुणे आणि वाशी मार्केटमध्ये टोमॅटोचा भाव काय आहे?"*
4. Listen to Mitra Assistant answer with factual rates using deterministic safety.

