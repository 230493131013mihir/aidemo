const DATA_GOV_RESOURCE_URL =
    "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function normalizeSearchTerm(value) {
    return String(value || "")
        .trim()
        .replace(/oes$/i, "o")
        .replace(/ies$/i, "y")
        .replace(/s$/i, "");
}

function normalizeDataGovRecord(record) {
    const modalPrice = toNumber(record.modal_price);
    const minPrice = toNumber(record.min_price) || (modalPrice ? Number((modalPrice * 0.92).toFixed(0)) : null);
    const maxPrice = toNumber(record.max_price) || (modalPrice ? Number((modalPrice * 1.08).toFixed(0)) : null);
    const commodity = record.commodity || "Agricultural Produce";

    return {
        id: `${record.market || "market"}-${commodity}`,
        crop: commodity,
        commodity: commodity,
        variety: record.variety || "Common",
        market: record.market || "APMC Mandi",
        district: record.district || "",
        state: record.state || "India",
        distanceFromSuratKm: 0,
        operatingDays: "Daily",
        modalPrice: modalPrice,
        pricePerQuintal: modalPrice,
        pricePerKg: modalPrice ? Number((modalPrice / 100).toFixed(2)) : null,
        minPrice,
        maxPrice,
        priceDate: record.arrival_date || new Date().toISOString().slice(0, 10),
        dataType: "verified_live",
        source: "data.gov.in AGMARKNET"
    };
}

async function fetchDataGovPrices({ state, commodity, market, limit }) {
    const apiKey = process.env.DATA_GOV_API_KEY || "579b464db66ec23bdd000001";
    const url = new URL(DATA_GOV_RESOURCE_URL);
    url.searchParams.set("api-key", apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(limit));

    if (state && state.toLowerCase() !== "all india" && state.toLowerCase() !== "all") {
        url.searchParams.set("filters[state]", state);
    }
    if (commodity && commodity.toLowerCase() !== "all") {
        url.searchParams.set("filters[commodity]", commodity);
    }
    if (market) url.searchParams.set("filters[market]", market);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`data.gov.in responded with ${response.status}`);
        }
        const payload = await response.json();
        const records = Array.isArray(payload.records) ? payload.records : [];
        const normalized = records.map(normalizeDataGovRecord).filter((item) => item.pricePerQuintal);

        // Deduplicate records so each market/city appears only once
        const seenMarkets = new Set();
        const deduplicated = [];
        for (const item of normalized) {
            const key = item.market.toLowerCase().trim();
            if (!seenMarkets.has(key)) {
                seenMarkets.add(key);
                deduplicated.push(item);
            }
        }
        return deduplicated;
    } finally {
        clearTimeout(timeout);
    }
}

const { MarketPrice, Crop, Market } = require("../models");
const { Op } = require("sequelize");

async function listPublicMarketPrices(query) {
    const limit = Math.min(Number(query.limit) || 100, 150);
    const stateQuery = (query.state || "").trim();
    const commodityRaw = (query.commodity || "").trim();
    const marketRaw = (query.market || "").trim();
    const commodity = normalizeSearchTerm(commodityRaw);

    // 1. Attempt live prices if API key is active and not forced into sample mode
    if (process.env.USE_SAMPLE_MARKET_DATA !== "true" && process.env.DATA_GOV_API_KEY && process.env.DATA_GOV_API_KEY !== "your_optional_data_gov_api_key_here") {
        try {
            const livePrices = await fetchDataGovPrices({
                state: stateQuery,
                commodity,
                market: marketRaw,
                limit
            });
            if (livePrices.length > 0) {
                return {
                    source: "live",
                    message: `Loaded ${livePrices.length} live APMC rates from AGMARKNET.`,
                    data: livePrices
                };
            }
        } catch (error) {
            console.warn("Live market price fetch failed, falling back to local database:", error.message);
        }
    }

    // 2. High-Performance MySQL Fallback: Query MarketPrice with All-India Locations
    try {
        const cropInclude = {
            model: Crop,
            required: true
        };

        if (commodity && commodity.toLowerCase() !== "all") {
            cropInclude.where = {
                [Op.or]: [
                    { nameEn: { [Op.like]: `%${commodity}%` } },
                    { nameGu: { [Op.like]: `%${commodity}%` } },
                    { nameHi: { [Op.like]: `%${commodity}%` } }
                ]
            };
        }

        const marketInclude = {
            model: Market,
            required: true
        };

        const marketAndConditions = [];
        if (marketRaw) {
            marketAndConditions.push({
                [Op.or]: [
                    { name: { [Op.like]: `%${marketRaw}%` } },
                    { district: { [Op.like]: `%${marketRaw}%` } },
                    { state: { [Op.like]: `%${marketRaw}%` } }
                ]
            });
        }

        if (stateQuery && stateQuery.toLowerCase() !== "all india" && stateQuery.toLowerCase() !== "all") {
            // Zone or state mapping
            if (stateQuery.toLowerCase() === "north india") {
                marketAndConditions.push({
                    state: { [Op.in]: ["Delhi", "Punjab", "Haryana", "Rajasthan", "Uttar Pradesh"] }
                });
            } else if (stateQuery.toLowerCase() === "south india") {
                marketAndConditions.push({
                    state: { [Op.in]: ["Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Kerala"] }
                });
            } else if (stateQuery.toLowerCase() === "central india") {
                marketAndConditions.push({
                    state: { [Op.in]: ["Madhya Pradesh", "Chhattisgarh"] }
                });
            } else if (stateQuery.toLowerCase() === "east & north-east") {
                marketAndConditions.push({
                    state: { [Op.in]: ["West Bengal", "Bihar", "Odisha", "Assam"] }
                });
            } else {
                marketAndConditions.push({
                    state: { [Op.like]: `%${stateQuery}%` }
                });
            }
        }

        if (marketAndConditions.length > 0) {
            marketInclude.where = {
                [Op.and]: marketAndConditions
            };
        }

        const dbRecords = await MarketPrice.findAll({
            include: [cropInclude, marketInclude],
            limit: 500, // Fetch ample candidates to deduplicate across markets
            order: [
                ["priceDate", "DESC"],
                [Market, "distanceFromSuratKm", "ASC"],
                ["id", "DESC"]
            ]
        });

        // Strict City/Market Deduplication:
        // Guarantee each unique market/city appears exactly ONCE
        const seenMarketKeys = new Set();
        const deduplicated = [];

        for (const item of dbRecords) {
            const marketId = item.Market?.id || item.marketId;
            const marketName = (item.Market?.name || "").trim().toLowerCase();
            const dedupeKey = `${marketId}-${marketName}`;

            if (!seenMarketKeys.has(dedupeKey)) {
                seenMarketKeys.add(dedupeKey);
                deduplicated.push(item);
            }
            if (deduplicated.length >= limit) break;
        }

        const mapped = deduplicated.map((item) => {
            const modal = Number(item.pricePerQuintal) || (Number(item.pricePerKg) * 100) || 0;
            const kg = Number(item.pricePerKg) || Number((modal / 100).toFixed(2)) || 0;
            const min = Number(item.minPrice) || Number((modal * 0.92).toFixed(0));
            const max = Number(item.maxPrice) || Number((modal * 1.08).toFixed(0));

            return {
                id: item.id,
                crop: item.Crop?.nameEn || "Vegetable",
                commodity: item.Crop?.nameEn || "Vegetable",
                commodityGu: item.Crop?.nameGu || "",
                commodityHi: item.Crop?.nameHi || "",
                category: item.Crop?.category || "Standard",
                variety: item.Crop?.category || "Standard",
                marketId: item.Market?.id,
                market: item.Market?.name || "Local Mandi",
                district: item.Market?.district || "",
                state: item.Market?.state || "Maharashtra",
                distanceFromSuratKm: Number(item.Market?.distanceFromSuratKm || 0),
                distanceKm: Number(item.Market?.distanceFromSuratKm || 0),
                operatingDays: item.Market?.operatingDays || "Daily",
                modalPrice: modal,
                pricePerQuintal: modal,
                pricePerKg: kg,
                minPrice: min,
                maxPrice: max,
                priceDate: item.priceDate,
                dataType: item.dataType || "verified_live",
                source: "APMC Mandi Database (MySQL)"
            };
        });

        return {
            source: "database",
            message: `Loaded ${mapped.length} distinct All-India APMC Mandi rates without duplicate cities.`,
            data: mapped
        };
    } catch (dbError) {
        console.error("Local database market price lookup failed:", dbError.message);
        const err = new Error("Unable to load market rates from live or database sources.");
        err.statusCode = 500;
        throw err;
    }
}

module.exports = { listPublicMarketPrices };
