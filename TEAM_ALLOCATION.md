# TEAM TASK ALLOCATION & WORKFLOW GUIDE 👥🌾
## HarvestMitra AI — Hackathon Collaboration Plan

**GitHub Repository**: [https://github.com/230493131013mihir/aidemo.git](https://github.com/230493131013mihir/aidemo.git)  
**Team Members**: Mihir Jadav, Sayali Kulkarni, Prashant Warule, Varun Patil

---

## 📌 Executive Team Roles & Division

```
+----------------------------------------------------------------------------------+
|                                TEAM ALLOCATION                                   |
+---------------------+---------------------+---------------------+----------------+
|   1. MIHIR JADAV    | 2. SAYALI KULKARNI  | 3. PRASHANT WARULE  | 4. VARUN PATIL |
| (Team Leader & Full | (Frontend UI/UX &   | (Backend Architect  | (AI Engineer & |
|  Stack Integration) |  Design Specialist) |  & Database Lead)   | Logistics Lead)|
+---------------------+---------------------+---------------------+----------------+
```

---

## 👨‍💻 Detailed Member Responsibilities & Tasks

### 1. 🟢 Mihir Jadav — Team Leader & Full Stack Integration Lead
**Primary Focus**: Repository setup, authentication flow, application architecture, deployment, and hackathon presentation lead.

---

### 👩‍💻 2. 🟣 Sayali Kulkarni — Frontend UI/UX Developer & Designer
**Primary Focus**: Modern Agricultural Dashboard UI, Design System, Charts, Crop Breakdown Badges, and Core Frontend Modules.

---

### 👨‍💻 3. 🔵 Prashant Warule — Backend Developer & Database Architect
**Primary Focus**: MySQL database configuration, ORM models, Market Data API, APMC rates, and multi-crop revenue calculations.

---

### 👨‍💻 4. 🟡 Varun Patil — AI Engineer & Voice/Logistics Lead
**Primary Focus**: Shared Transport module, Driver Mandi Gate Pass with QR clearance, Mitra Voice Assistant (STT/TTS), and Weather integration.

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
