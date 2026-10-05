const { Op } = require("sequelize");
const { Crop, Market, MarketPrice } = require("../models");

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
    const minPrice = toNumber(record.min_price);
    const maxPrice = toNumber(record.max_price);

    return {
        crop: record.commodity || "Unknown crop",
        variety: record.variety || "Common",
        market: record.market || "Unknown market",
        district: record.district || "",
        state: record.state || "",
        pricePerQuintal: modalPrice,
        pricePerKg: modalPrice ? modalPrice / 100 : null,
        minPrice,
        maxPrice,
        priceDate: record.arrival_date || "",
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

    if (state) url.searchParams.set("filters[state]", state);
    if (commodity) url.searchParams.set("filters[commodity]", commodity);
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
        return records.map(normalizeDataGovRecord).filter((item) => item.pricePerQuintal);
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchDatabasePrices({ search, commodity, market, limit }) {
    const include = [
        { model: Market, attributes: ["id", "name", "district", "state"] },
        { model: Crop, attributes: ["id", "nameEn", "nameGu", "nameHi", "category"] }
    ];

    const where = {};
    if (commodity) {
        include[1].where = {
            [Op.or]: [
                { nameEn: { [Op.like]: `%${commodity}%` } },
                { nameGu: { [Op.like]: `%${commodity}%` } },
                { nameHi: { [Op.like]: `%${commodity}%` } }
            ]
        };
        include[1].required = true;
    }

    if (market) {
        include[0].where = {
            [Op.or]: [
                { name: { [Op.like]: `%${market}%` } },
                { district: { [Op.like]: `%${market}%` } },
                { state: { [Op.like]: `%${market}%` } }
            ]
        };
        include[0].required = true;
    }

    if (search && !commodity && !market) {
        where[Op.or] = [
            { "$Market.name$": { [Op.like]: `%${search}%` } },
            { "$Market.district$": { [Op.like]: `%${search}%` } },
            { "$Market.state$": { [Op.like]: `%${search}%` } },
            { "$Crop.name_en$": { [Op.like]: `%${search}%` } },
            { "$Crop.name_gu$": { [Op.like]: `%${search}%` } },
            { "$Crop.name_hi$": { [Op.like]: `%${search}%` } }
        ];
    }

    const prices = await MarketPrice.findAll({
        where,
        include,
        order: [["priceDate", "DESC"], ["id", "DESC"]],
        limit
    });

    return prices.map((price) => ({
        id: price.id,
        crop: price.Crop?.nameEn || "Unknown crop",
        cropGu: price.Crop?.nameGu,
        cropHi: price.Crop?.nameHi,
        variety: price.Crop?.category || "Common",
        market: price.Market?.name || "Unknown market",
        district: price.Market?.district || "",
        state: price.Market?.state || "",
        pricePerKg: toNumber(price.pricePerKg),
        pricePerQuintal: toNumber(price.pricePerQuintal),
        minPrice: toNumber(price.minPrice),
        maxPrice: toNumber(price.maxPrice),
        priceDate: price.priceDate,
        dataType: price.dataType,
        source: price.dataType === "verified_live" ? "Verified database" : "Demo database"
    }));
}

async function listPublicMarketPrices(query) {
    const limit = Math.min(Number(query.limit) || 60, 100);
    const state = query.state || "";
    const commodity = normalizeSearchTerm(query.commodity);
    const market = query.market || "";
    const search = normalizeSearchTerm(query.search);
    const wantsLive = query.source !== "demo";

    if (wantsLive) {
        try {
            const livePrices = await fetchDataGovPrices({ state, commodity, market, limit });
            if (livePrices.length) {
                return {
                    source: "live",
                    message: "Live mandi rates loaded from data.gov.in AGMARKNET.",
                    data: livePrices
                };
            }
        } catch (error) {
            console.warn("Live market price fetch failed:", error.message);
        }
    }

    const databasePrices = await fetchDatabasePrices({
        search,
        commodity,
        market: market || search,
        limit
    });
    return {
        source: "database",
        message: wantsLive
            ? "Live mandi source was unavailable, showing saved database prices."
            : "Showing saved database prices.",
        data: databasePrices
    };
}

module.exports = { listPublicMarketPrices };
