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

## 4. Provider-Independent Architecture

```javascript
// Service Layer Interface Flow
class AIService {
  async generateResponse({ prompt, language, contextData }) {
    if (process.env.AI_PROVIDER === 'gemini' && process.env.AI_API_KEY) {
      return await callGeminiAPI(prompt, contextData);
    } else if (process.env.AI_PROVIDER === 'openai' && process.env.AI_API_KEY) {
      return await callOpenAI(prompt, contextData);
    } else {
      // Deterministic Fallback Bot
      return FallbackEngine.generateGuidance(language, contextData);
    }
  }
}
```
