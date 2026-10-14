const { MarketPrice, Crop, Market } = require("../models");
const { Op } = require("sequelize");

function detectLanguage(text) {
    if (/[\u0A80-\u0AFF]/.test(text)) return "gu";
    if (/[\u0900-\u097F]/.test(text)) return "hi";
    return "en";
}

function getGreeting(language) {
    if (language === "gu") {
        return "નમસ્તે ખેડૂત મિત્ર! હું મિત્રા AI છું. હું તમને લાઈવ એપીએમસી બજાર ભાવ, હવામાન વરસાદી જોખમ, પાક લણણી નિર્ણય અને શેર ટ્રાન્સપોર્ટ બુકિંગમાં મદદ કરી શકું છું.";
    }
    if (language === "hi") {
        return "नमस्ते किसान मित्र! मैं मित्रा AI हूँ। मैं आपको लाइव APMC मंडी भाव, मौसम पूर्वानुमान, फसल कटाई निर्णय और शेयर्ड ट्रांसपोर्ट बुकिंग में सहायता कर सकता हूँ।";
    }
    return "Namaste farmer friend! I am Mitra AI. I can assist you with real-time APMC mandi prices, weather and rain risks, harvest timing decisions, and shared logistics pooling.";
}

async function queryDatabaseForPrice(text) {
    try {
        const lower = text.toLowerCase();
        // Common crops detection
        const cropKeywords = [
            { en: "Tomato", gu: "ટામેટા", hi: "टमाटर" },
            { en: "Onion", gu: "ડુંગળી", hi: "प्याज" },
            { en: "Potato", gu: "બટાકા", hi: "आलू" },
            { en: "Wheat", gu: "ઘઉં", hi: "गेहूं" },
            { en: "Green Chilli", gu: "લીલા મરચાં", hi: "हरी मिर्च" },
            { en: "Rice", gu: "ડાંગર", hi: "चावल" },
            { en: "Cotton", gu: "કપાસ", hi: "कपास" },
            { en: "Groundnut", gu: "મગફળી", hi: "मूंगफली" },
            { en: "Mustard", gu: "રાઈ", hi: "सरसों" },
            { en: "Soybean", gu: "સોયાબીન", hi: "सोयाबीन" },
            { en: "Garlic", gu: "લસણ", hi: "लहसुन" },
            { en: "Cumin", gu: "જીરું", hi: "जीरा" }
        ];

        let matchedCrop = null;
        for (const c of cropKeywords) {
            if (lower.includes(c.en.toLowerCase()) || text.includes(c.gu) || text.includes(c.hi)) {
                matchedCrop = c.en;
                break;
            }
        }

        // Common mandis detection
        const mandiNames = ["Surat", "Ahmedabad", "Rajkot", "Pune", "Nashik", "Lasalgaon", "Azadpur", "Delhi", "Bengaluru", "Kolar", "Indore", "Jaipur", "Guntur"];
        let matchedMandi = null;
        for (const m of mandiNames) {
            if (lower.includes(m.toLowerCase())) {
                matchedMandi = m;
                break;
            }
        }

        if (matchedCrop) {
            const cropWhere = { nameEn: matchedCrop };
            const marketWhere = matchedMandi ? { name: { [Op.like]: `%${matchedMandi}%` } } : {};

            const record = await MarketPrice.findOne({
                include: [
                    { model: Crop, where: cropWhere, required: true },
                    { model: Market, where: Object.keys(marketWhere).length ? marketWhere : undefined, required: true }
                ],
                order: [["priceDate", "DESC"], ["id", "DESC"]]
            });

            if (record) {
                const quintal = Number(record.pricePerQuintal) || 0;
                const kg = Number(record.pricePerKg) || (quintal / 100);
                const marketName = record.Market?.name || matchedMandi || "APMC";
                const lang = detectLanguage(text);

                if (lang === "gu") {
                    return `આજના APMC ડેટા મુજબ ${marketName} માર્કેટમાં ${matchedCrop} નો ભાવ ₹${quintal} પ્રતિ ક્વિન્ટલ (₹${kg} પ્રતિ કિલો) ચાલી રહ્યો છે. દૈનિક રેન્જ: ₹${record.minPrice || Math.round(quintal * 0.9)} થી ₹${record.maxPrice || Math.round(quintal * 1.1)} છે.`;
                }
                if (lang === "hi") {
                    return `आज के APMC आंकड़ों के अनुसार ${marketName} मंडी में ${matchedCrop} का भाव ₹${quintal} प्रति क्विंटल (₹${kg} प्रति किलो) चल रहा है। दैनिक मूल्य प्रसार: ₹${record.minPrice || Math.round(quintal * 0.9)} - ₹${record.maxPrice || Math.round(quintal * 1.1)} है।`;
                }
                return `According to today's live APMC records, ${matchedCrop} in ${marketName} is trading at ₹${quintal} / Quintal (₹${kg} / kg). Daily spread range is ₹${record.minPrice || Math.round(quintal * 0.9)} - ₹${record.maxPrice || Math.round(quintal * 1.1)} per quintal.`;
            }
        }
    } catch (err) {
        console.warn("DB Price lookup for chat failed:", err.message);
    }
    return null;
}

async function buildSmartAnswer(message) {
    const text = String(message || "").toLowerCase();
    const language = detectLanguage(message);

    if (!text.trim()) {
        return getGreeting(language);
    }

    // 1. Check for specific price questions against MySQL database
    if (text.includes("price") || text.includes("rate") || text.includes("mandi") || text.includes("ભાવ") || text.includes("કિંમત") || text.includes("भाव") || text.includes("रेट") || text.includes("tomato") || text.includes("onion") || text.includes("potato") || text.includes("wheat")) {
        const liveDbAnswer = await queryDatabaseForPrice(message);
        if (liveDbAnswer) return liveDbAnswer;
    }

    // 2. Weather & Rain Risk Queries
    if (text.includes("weather") || text.includes("rain") || text.includes("havaman") || text.includes("વરસાદ") || text.includes("હવામાન") || text.includes("बारिश") || text.includes("मौसम")) {
        if (language === "gu") {
            return "હવામાન ચેતવણીઓ: જો વરસાદનું જોખમ ૬૦% થી વધુ હોય તો પાક લણણી મુલતવી રાખો. જો જોખમ ૩૦-૬૦% હોય તો માત્ર સુરક્ષિત ગોડાઉન અને વાહનની વ્યવસ્થા હોય તો જ લણણી કરો. તમે 'Agri Weather' પેજ પર તમારા શહેરની લાઈવ સેટેલાઇટ આગાહી જોઈ શકો છો.";
        }
        if (language === "hi") {
            return "मौसम अलर्ट: यदि बारिश का जोखिम 60% से अधिक हो तो फसल कटाई टालें। 30-60% जोखिम होने पर केवल तभी कटाई करें जब सुरक्षित भंडारण और परिवहन तैयार हो। आप 'Agri Weather' पेज पर अपने शहर का लाइव मौसम देख सकते हैं।";
        }
        return "Weather Guidance: If precipitation risk exceeds 60%, postpone harvest to avoid post-harvest fungal damage. At 30-60% risk, harvest only with ready covered transport and dry storage. Check the 'Agri Weather' tab for high-resolution satellite updates for your district.";
    }

    // 3. Shared Transport & Pooling Queries
    if (text.includes("transport") || text.includes("truck") || text.includes("vehicle") || text.includes("ભાડું") || text.includes("વાહન") || text.includes("પરિવહન") || text.includes("गाड़ी") || text.includes("किराया")) {
        if (language === "gu") {
            return "પરિવહન ખર્ચ બચત: 'Transport Pooling' પેજ પર જઈને તમારા નજીકના ખેડૂતો સાથે ટ્રક પૂલ કરો. આનાથી તમારો ખર્ચ ૪૦-૫૦% સુધી ઘટી જશે અને તમને સુરક્ષિત QR કોડ સાથેનો ડિજિટલ મંડી ગેટ પાસ પણ મળશે.";
        }
        if (language === "hi") {
            return "परिवहन लागत बचत: 'Transport Pooling' पेज पर जाकर अपने नजदीकी साथी किसानों के साथ वाहन साझा (pool) करें। इससे भाड़ा 40-50% तक कम हो जाता है और आपको QR-सत्यापित डिजिटल मंडी गेट पास भी प्राप्त होता है।";
        }
        return "Logistics Cost Optimization: Visit 'Transport Pooling' to pool truck space with nearby farmers dispatching to the same APMC. Shared pooling cuts freight expenses by 40-50% and automatically issues an instant QR-verified Digital Mandi Gate Pass.";
    }

    // 4. Arbitrage & Selling Decision Queries
    if (text.includes("sell") || text.includes("harvest") || text.includes("today") || text.includes("wait") || text.includes("વેચ") || text.includes("લણણી") || text.includes("બેચ") || text.includes("कटाई")) {
        if (language === "gu") {
            return "પાક વેચાણ નિર્ણય: 'Harvest Intelligence' સિમ્યુલેટર વાપરો. તે તમારા પાકના વજન, સુરત અને અમદાવાદ જેવી પ્રાદેશિક મંડીઓના ભાવ, અને સ્ટોરેજ બગાડના જોખમની આપમેળે ગણતરી કરીને તમને સૌથી વધુ ચોખ્ખો નફો ક્યાં મળશે તે બતાવે છે.";
        }
        if (language === "hi") {
            return "फसल बिक्री निर्णय: 'Harvest Intelligence' सिमुलेटर का उपयोग करें। यह आपकी उपज की मात्रा, स्थानीय व क्षेत्रीय मंडियों के ताज़ा भाव और कोल्ड स्टोरेज लागत की तुलना करके आपको अधिकतम शुद्ध मुनाफे वाला विकल्प सुझाता है।";
        }
        return "Smart Harvest Decision: Use the 'Harvest Intelligence' simulator. It compares selling at your local APMC versus shipping to high-demand mega hubs (like Ahmedabad, Mumbai Vashi, or Azadpur) factoring in fuel freight and storage holding risks to maximize your net take-home profit.";
    }

    // General fallback
    if (language === "gu") {
        return "હું તમને બજાર ભાવ (દા.ત. 'સુરતમાં ટામેટાનો ભાવ'), વરસાદી હવામાન જોખમ, પાક લણણી નિર્ણય અને શેર ટ્રાન્સપોર્ટ બુકિંગમાં મદદ કરી શકું છું. તમારો પ્રશ્ન પૂછો!";
    }
    if (language === "hi") {
        return "मैं आपको मंडी भाव (जैसे 'सूरत में टमाटर का भाव'), मौसम जोखिम, फसल कटाई निर्णय और शेयર્ડ ट्रांसपोर्ट बुकिंग में मदद कर सकता हूँ। अपना सवाल पूछें!";
    }
    return "I am Mitra AI, your digital agronomist. Ask me about live mandi rates (e.g., 'Tomato price in Surat APMC'), rain and weather risks, whether to sell today or hold, or how to book shared freight to the mandi.";
}

async function askAssistant({ message }) {
    const provider = process.env.AI_PROVIDER || "fallback";
    const apiKey = process.env.AI_API_KEY;
    const hasRealKey = apiKey && !apiKey.includes("your_optional") && !apiKey.includes("your_");

    // 1. If Gemini live key is provided, use Gemini 1.5 Flash
    if (hasRealKey && provider === "gemini") {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: "user",
                                parts: [
                                    {
                                        text: `You are Mitra AI, an expert, concise agronomist and APMC market intelligence advisor for Indian farmers. Provide helpful, accurate advice in the language of the prompt. Prompt: ${message}`
                                    }
                                ]
                            }
                        ]
                    })
                }
            );
            if (response.ok) {
                const payload = await response.json();
                const replyText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
                if (replyText) {
                    return {
                        source: "gemini",
                        reply: replyText
                    };
                }
            }
        } catch (error) {
            console.warn("Gemini API call failed, activating smart agritech fallback:", error.message);
        }
    }

    // 2. High-Performance Agritech Knowledge & Live Database Engine
    const smartReply = await buildSmartAnswer(message);
    return {
        source: "mitra_expert_engine",
        reply: smartReply
    };
}

module.exports = { askAssistant };
