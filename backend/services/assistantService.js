function detectLanguage(text) {
    if (/[\u0A80-\u0AFF]/.test(text)) return "gu";
    if (/[\u0900-\u097F]/.test(text)) return "hi";
    return "en";
}

function getGreeting(language) {
    if (language === "gu") {
        return "નમસ્તે ખેડૂત મિત્ર. હું બજાર ભાવ, હવામાન જોખમ, પાક વેચાણ અને પરિવહન વિશે મદદ કરી શકું છું.";
    }
    if (language === "hi") {
        return "नमस्ते किसान मित्र। मैं बाजार भाव, मौसम जोखिम, फसल बिक्री और परिवहन के बारे में मदद कर सकता हूँ।";
    }
    return "Hello farmer friend. I can help with mandi prices, weather risk, harvest timing, and transport planning.";
}

function buildFallbackAnswer(message) {
    const text = String(message || "").toLowerCase();
    const language = detectLanguage(message);

    if (!text.trim()) {
        return getGreeting(language);
    }

    if (text.includes("weather") || text.includes("rain") || text.includes("havaman") || text.includes("મોસમ") || text.includes("बारिश")) {
        return "Check the Weather Alerts page, enter your city, and look at Rain risk + Harvest Decision. If rain risk is above 60%, delay harvest. If it is 30-60%, harvest only if storage and transport are ready.";
    }

    if (text.includes("price") || text.includes("mandi") || text.includes("market") || text.includes("ભાવ") || text.includes("कीमत")) {
        return "Open Mandi Prices, enter crop name and city, then click Search. Compare modal rate, min-max range, and market location before selling. Demo database works even if live AGMARKNET is unavailable.";
    }

    if (text.includes("transport") || text.includes("truck") || text.includes("vehicle") || text.includes("પરિવહન") || text.includes("वाहन")) {
        return "For transport, group farmers going to the same mandi on the same date. Shared transport reduces per-farmer cost and increases net revenue. Use crop weight, destination, and pickup date to match farmers.";
    }

    if (text.includes("sell") || text.includes("harvest") || text.includes("today") || text.includes("વેચ") || text.includes("बेच")) {
        return "To decide whether to sell today: compare today's mandi price, expected future price, transport cost, crop shelf life, and rain risk. If crop is perishable or rain risk is high, selling earlier is safer.";
    }

    return "I can help with four things: mandi prices, weather risk, harvest timing, and transport planning. Ask like: 'tomato price in Pune', 'is today safe for harvest?', or 'how to reduce transport cost?'.";
}

async function askAssistant({ message }) {
    const provider = process.env.AI_PROVIDER || "fallback";
    const apiKey = process.env.AI_API_KEY;

    // Keep a deterministic local answer so the hackathon demo works without paid AI keys.
    if (!apiKey || provider === "fallback") {
        return {
            source: "fallback",
            reply: buildFallbackAnswer(message)
        };
    }

    return {
        source: "fallback",
        reply: buildFallbackAnswer(message)
    };
}

module.exports = { askAssistant };
