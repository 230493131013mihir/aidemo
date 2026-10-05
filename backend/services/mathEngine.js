// mathEngine.js
// Smart Harvest Decision Simulator
// HarvestMitra AI
//
// This file contains only deterministic calculation logic.
// No React, API, or external libraries are used.

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function roundCurrency(value) {
    return Number(Number(value).toFixed(2));
}

// --------------------------------------------------
// 1. Calculate Gross Revenue
// Formula:
// Gross Revenue = Quantity × Selling Price
// --------------------------------------------------

function calculateGrossRevenue(quantity, sellingPrice) {
    return roundCurrency(toNumber(quantity, 0) * toNumber(sellingPrice, 0));
}

// --------------------------------------------------
// 2. Calculate Total Cost
// Formula:
// Total Cost = Transport + Packaging + Labor
// --------------------------------------------------

function calculateTotalCost(transportCost, packagingCost, laborCost) {
    return roundCurrency(
        toNumber(transportCost, 0) +
        toNumber(packagingCost, 0) +
        toNumber(laborCost, 0)
    );
}

// --------------------------------------------------
// 3. Calculate Net Revenue
// Formula:
// Net Revenue = Gross Revenue - Total Cost
// --------------------------------------------------

function calculateNetRevenue(grossRevenue, totalCost) {
    return roundCurrency(toNumber(grossRevenue, 0) - toNumber(totalCost, 0));
}

// --------------------------------------------------
// 4. Calculate Profit Difference
// --------------------------------------------------

function calculateProfitDifference(netRevenue, sellTodayNetRevenue) {
    return roundCurrency(
        toNumber(netRevenue, 0) - toNumber(sellTodayNetRevenue, 0)
    );
}

// --------------------------------------------------
// 5. Sell Today
// --------------------------------------------------

function sellToday(quantity, sellingPrice, transportCost = 0, packagingCost = 0, laborCost = 0) {
    const safeQuantity = toNumber(quantity, 0);
    const grossRevenue = calculateGrossRevenue(safeQuantity, sellingPrice);
    const totalCost = calculateTotalCost(transportCost, packagingCost, laborCost);
    const netRevenue = calculateNetRevenue(grossRevenue, totalCost);

    return {
        option: "Sell Today",
        grossRevenue: grossRevenue,
        totalCost: totalCost,
        netRevenue: netRevenue,
        profitDifference: 0,
        risk: netRevenue < 0 ? "High" : "Low"
    };
}

// --------------------------------------------------
// 6. Hold & Sell Later
// --------------------------------------------------

function holdAndSellLater(
    quantity,
    futureSellingPrice,
    transportCost = 0,
    packagingCost = 0,
    laborCost = 0,
    sellTodayNetRevenue = 0
) {
    const safeQuantity = toNumber(quantity, 0);
    const grossRevenue = calculateGrossRevenue(safeQuantity, futureSellingPrice);
    const totalCost = calculateTotalCost(transportCost, packagingCost, laborCost);
    const netRevenue = calculateNetRevenue(grossRevenue, totalCost);
    const profitDifference = calculateProfitDifference(netRevenue, sellTodayNetRevenue);

    return {
        option: "Hold & Sell Later",
        grossRevenue: grossRevenue,
        totalCost: totalCost,
        netRevenue: netRevenue,
        profitDifference: profitDifference,
        risk: netRevenue < 0 ? "High" : "Medium"
    };
}

// --------------------------------------------------
// 7. Alternative Market
// --------------------------------------------------

function alternativeMarket(
    quantity,
    alternativeSellingPrice,
    transportCost = 0,
    packagingCost = 0,
    laborCost = 0,
    sellTodayNetRevenue = 0
) {
    const safeQuantity = toNumber(quantity, 0);
    const grossRevenue = calculateGrossRevenue(safeQuantity, alternativeSellingPrice);
    const totalCost = calculateTotalCost(transportCost, packagingCost, laborCost);
    const netRevenue = calculateNetRevenue(grossRevenue, totalCost);
    const profitDifference = calculateProfitDifference(netRevenue, sellTodayNetRevenue);

    return {
        option: "Alternative Market",
        grossRevenue: grossRevenue,
        totalCost: totalCost,
        netRevenue: netRevenue,
        profitDifference: profitDifference,
        risk: netRevenue < 0 ? "High" : "Medium"
    };
}

// --------------------------------------------------
// 8. Run All Three Options
// --------------------------------------------------

function calculateAllOptions(data = {}) {
    const quantity = toNumber(data.quantity, 0);
    const today = sellToday(
        quantity,
        data.todayPrice,
        data.todayTransportCost,
        data.todayPackagingCost,
        data.todayLaborCost
    );

    const later = holdAndSellLater(
        quantity,
        data.futurePrice,
        data.futureTransportCost,
        data.futurePackagingCost,
        data.futureLaborCost,
        today.netRevenue
    );

    const alternative = alternativeMarket(
        quantity,
        data.alternativePrice,
        data.alternativeTransportCost,
        data.alternativePackagingCost,
        data.alternativeLaborCost,
        today.netRevenue
    );

    const scenarios = {
        sellToday: today,
        holdAndSellLater: later,
        alternativeMarket: alternative
    };

    const recommendedOption = Object.values(scenarios).reduce((best, current) => {
        if (!best || current.netRevenue > best.netRevenue) {
            return current;
        }
        return best;
    }, null);

    return {
        ...scenarios,
        recommendedOption: recommendedOption ? recommendedOption.option : "Sell Today",
        summary: {
            quantity: quantity,
            sellTodayNetRevenue: today.netRevenue,
            futureNetRevenue: later.netRevenue,
            alternativeMarketNetRevenue: alternative.netRevenue,
            recommendedNetRevenue: recommendedOption ? recommendedOption.netRevenue : today.netRevenue
        }
    };
}

module.exports = {
    toNumber,
    roundCurrency,
    calculateGrossRevenue,
    calculateTotalCost,
    calculateNetRevenue,
    calculateProfitDifference,
    sellToday,
    holdAndSellLater,
    alternativeMarket,
    calculateAllOptions
};