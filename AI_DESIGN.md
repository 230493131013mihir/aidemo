# AI DESIGN & PROMPT ENGINEERING: Mitra Assistant 🤖🌾

HarvestMitra AI incorporates a dedicated AI service layer powered by **Mitra Assistant**, designed specifically to give Indian farmers clear, localized, and hallucination-free advice.

---

## 1. Safety & Math Guarantees (No Hallucinations)

AI models often hallucinate numerical values, weather forecasts, or market rates. To prevent financial misguidance:

1. **Deterministic Calculation Engine**: Financial net revenue, transport expenses, and profit margins are computed exclusively by backend Node.js math utilities—**NEVER by the LLM prompt**.
2. **Context Injection Pattern**: Before calling the LLM API, the backend retrieves exact market rates and weather alerts from the database, injecting them as verified facts into the LLM system prompt.
3. **Transparent Data Tagging**: All outputs state clearly whether data originates from *Verified Live Services*, *Deterministic Calculator*, or *Demo Sample Datasets*.
4. **Fallback Engine**: If external LLM APIs fail or run out of quota, the fallback engine generates structured, rule-based natural language guidance using predefined templates.

---

## 2. Mitra Assistant System Prompt

```text
You are "Mitra Assistant", an empathetic, expert agricultural decision-support assistant for Indian farmers.
Your core mission is to help farmers understand market price options, reduce transportation expenses through shared transport, and make informed harvest timing choices.

STRICT OPERATIONAL RULES:
1. Always respond warmly in the user's requested language: Gujarati (gu), Hindi (hi), or English (en).
2. DO NOT invent market prices, weather predictions, or government schemes. Use ONLY the provided database context.
3. Clearly state assumptions when discussing potential future prices. Never guarantee profits.
4. Encourage farmers to calculate Net Revenue (Gross Revenue minus transport and handling costs) rather than relying on high gross market prices.
5. If the farmer asks about transportation costs, suggest creating or joining a Shared Transport request.
6. Do NOT provide dangerous pesticide mixing instructions or unverified medical/chemical treatments.
7. Keep sentences clear, respectful, short, and accessible to users with limited formal education.

CONTEXT DATA INJECTED BY BACKEND:
- Farmer Name: {{user_name}}
- Location: {{district}}, {{state}}
- Selected Crop: {{crop_name}} (Quantity: {{quantity_kg}} kg)
- Current Market Price: {{current_market_price}}
- Recommended Action from Simulator: {{recommended_option}}
- Data Disclaimer Tag: {{data_source_tag}}
```

---

## 3. Multilingual Support Strategy

| Language | Tone & Style | Key Agricultural Terms Handled |
| :--- | :--- | :--- |
| **Gujarati (ગુજરાતી)** | Warm, respectful (APMC, Mandi, Bhaav, Nafo, Bhaduk/Transport) | ટામેટાં (Tomatoes), મંડી ભાવ (Mandi Price), ચોખ્ખો નફો (Net Revenue), સહિયારું વાહન (Shared Transport) |
| **Hindi (हिंदी)** | Clear, simple, encouraging | मंडी भाव (Mandi Rate), कुल कमाई (Gross Income), बचत (Savings), साझा परिवहन (Shared Freight) |
| **English** | Professional, concise | Net Revenue, Perishability Risk, Mandi Rate, Transport Pooling |

---

## 4. Provider-Independent Architecture & Service Layer (ISSUE-09)

The AI service layer follows a pluggable, provider-independent architecture:

```text
Chat API (POST /api/chat/message)
   ↓
Authentication & Input Validation
   ↓
Intent & Script Language Detection (intentDetector.js)
   ↓
Trusted Context Assembly & Backend Math (contextBuilder.js + mathEngine.js)
   ↓
Unified AI Service (aiService.js)
   ├── Gemini Provider (geminiProvider.js)
   ├── OpenAI Provider (openaiProvider.js)
   └── Deterministic Fallback Engine (fallbackEngine.js)
   ↓
Normalized Response ({ success, provider, mode, message, metadata, source_disclaimer })
```

### Module Structure:
- `backend/services/ai/aiService.js`: Core orchestrator and singleton service.
- `backend/services/ai/providers/geminiProvider.js`: Google Gemini REST implementation with timeout & error sanitization.
- `backend/services/ai/providers/openaiProvider.js`: OpenAI Chat Completions REST implementation with timeout & error sanitization.
- `backend/services/ai/fallbackEngine.js`: Zero-hallucination deterministic fallback bot supporting English, Hindi, Gujarati.
- `backend/services/ai/contextBuilder.js`: Injects verified farmer, crop, mandi price, and deterministic `mathEngine` results.
- `backend/services/ai/promptBuilder.js`: Strict prompt assembly enforcing data trust and disclaimers.
- `backend/services/ai/intentDetector.js`: Deterministic keyword & unicode regex intent/language detector.

---

## 5. Configuration & Environment Variables

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `AI_PROVIDER` | No | `gemini` | Active provider: `gemini`, `openai`, or `fallback` |
| `GEMINI_API_KEY` | If provider=gemini | - | Google Gemini API key (kept strictly server-side) |
| `OPENAI_API_KEY` | If provider=openai | - | OpenAI API key (kept strictly server-side) |
| `AI_MODEL` | No | Provider default | Override model (e.g. `gemini-1.5-flash`, `gpt-4o-mini`) |
| `AI_TIMEOUT_MS`| No | `15000` | HTTP request timeout in milliseconds before triggering fallback |

If no API keys are configured, the system logs a safe warning and seamlessly serves responses using `fallbackEngine.js` without application crashes.

---

## 6. How to Add a New AI Provider

New providers (e.g. Anthropic Claude, Ollama, Groq) can be added cleanly without modifying the Chat API routes:

1. Create a new provider class in `backend/services/ai/providers/yourProvider.js`:
   ```javascript
   class YourProvider {
     constructor(config = {}) {
       this.name = 'your_provider';
       this.apiKey = process.env.YOUR_PROVIDER_API_KEY;
     }

     isConfigured() {
       return Boolean(this.apiKey);
     }

     async generateResponse({ systemPrompt, userMessage, history, language, intent }) {
       // Call provider API using fetch and AbortController timeout
       return {
         success: true,
         provider: 'your_provider',
         mode: 'ai',
         message: resultText,
         metadata: { model: 'your-model', intent, language }
       };
     }
   }
   module.exports = YourProvider;
   ```
2. Register the provider in `aiService.js`:
   ```javascript
   const YourProvider = require('./providers/yourProvider');
   aiService.registerProvider('your_provider', new YourProvider());
   ```
3. Set `AI_PROVIDER=your_provider` in `.env`.

---

## 7. Numerical Calculation & Context Rules

- **Zero LLM Math**: All revenue, expense, and margin figures are calculated in Node.js via `mathEngine.js`. Prompts explicitly instruct the LLM: *"NEVER CALCULATE OR ESTIMATE FINANCIAL NUMBERS INDEPENDENTLY. All financial metrics MUST come directly from BACKEND CALCULATIONS."*
- **Clarification Over Guessing**: If required input numbers (e.g., crop quantity or mandi price) are missing, Mitra Assistant asks the farmer directly instead of assuming values.
- **Demonstration Data Transparency**: Demo prices are tagged `[DEMO]` so the user is never misled into believing test numbers are live APMC auction rates.
