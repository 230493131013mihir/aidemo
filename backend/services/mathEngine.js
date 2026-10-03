// mathEngine.js
// Smart Harvest Decision Simulator
// HarvestMitra AI
//
// This file contains only calculation logic.
// No React, API, or external libraries are used.

// --------------------------------------------------
// 1. Calculate Gross Revenue
// Formula:
// Gross Revenue = Quantity × Selling Price
// --------------------------------------------------

function calculateGrossRevenue(quantity, sellingPrice) {
    return quantity * sellingPrice;
}


// --------------------------------------------------
// 2. Calculate Total Cost
// Formula:
// Total Cost = Transport + Packaging + Labor
// --------------------------------------------------

function calculateTotalCost(transportCost, packagingCost, laborCost) {
    return transportCost + packagingCost + laborCost;
}


// --------------------------------------------------
// 3. Calculate Net Revenue
// Formula:
// Net Revenue = Gross Revenue - Total Cost
// --------------------------------------------------

function calculateNetRevenue(grossRevenue, totalCost) {
    return grossRevenue - totalCost;
}


// --------------------------------------------------
// 4. Calculate Profit Difference
//
// This compares the current option's net revenue
// with the Sell Today option's net revenue.
//
// Example:
// Current option = ₹12,000
// Sell Today = ₹10,000
// Difference = ₹2,000
// --------------------------------------------------

function calculateProfitDifference(netRevenue, sellTodayNetRevenue) {
    return netRevenue - sellTodayNetRevenue;
}


// --------------------------------------------------
// 5. Sell Today
// --------------------------------------------------

function sellToday(quantity, sellingPrice, transportCost, packagingCost, laborCost) {

    const grossRevenue = calculateGrossRevenue(
        quantity,
        sellingPrice
    );

    const totalCost = calculateTotalCost(
        transportCost,
        packagingCost,
        laborCost
    );

    const netRevenue = calculateNetRevenue(
        grossRevenue,
        totalCost
    );

    return {
        option: "Sell Today",
        grossRevenue: grossRevenue,
        totalCost: totalCost,
        netRevenue: netRevenue,

        // Sell Today is the base option,
        // so its profit difference is 0.
        profitDifference: 0,

        risk: "Low"
    };
}


// --------------------------------------------------
// 6. Hold & Sell Later
// --------------------------------------------------

function holdAndSellLater(
    quantity,
    futureSellingPrice,
    transportCost,
    packagingCost,
    laborCost,
    sellTodayNetRevenue
) {

    const grossRevenue = calculateGrossRevenue(
        quantity,
        futureSellingPrice
    );

    const totalCost = calculateTotalCost(
        transportCost,
        packagingCost,
        laborCost
    );

    const netRevenue = calculateNetRevenue(
        grossRevenue,
        totalCost
    );

    const profitDifference = calculateProfitDifference(
        netRevenue,
        sellTodayNetRevenue
    );

    return {
        option: "Hold & Sell Later",
        grossRevenue: grossRevenue,
        totalCost: totalCost,
        netRevenue: netRevenue,
        profitDifference: profitDifference,

        // Holding produce has more uncertainty
        // because the future selling price can change.
        risk: "Medium"
    };
}


// --------------------------------------------------
// 7. Alternative Market
// --------------------------------------------------

function alternativeMarket(
    quantity,
    alternativeSellingPrice,
    transportCost,
    packagingCost,
    laborCost,
    sellTodayNetRevenue
) {

    const grossRevenue = calculateGrossRevenue(
        quantity,
        alternativeSellingPrice
    );

    const totalCost = calculateTotalCost(
        transportCost,
        packagingCost,
        laborCost
    );

    const netRevenue = calculateNetRevenue(
        grossRevenue,
        totalCost
    );

    const profitDifference = calculateProfitDifference(
        netRevenue,
        sellTodayNetRevenue
    );

    return {
        option: "Alternative Market",
        grossRevenue: grossRevenue,
        totalCost: totalCost,
        netRevenue: netRevenue,
        profitDifference: profitDifference,

        // Alternative markets can involve
        // additional market/transport uncertainty.
        risk: "Medium"
    };
}


// --------------------------------------------------
// 8. Run All Three Options
// --------------------------------------------------

function calculateAllOptions(data) {

    // First calculate Sell Today.
    // We use its net revenue as the base
    // for calculating profit differences.
    const today = sellToday(
        data.quantity,
        data.todayPrice,
        data.todayTransportCost,
        data.todayPackagingCost,
        data.todayLaborCost
    );


    // Calculate Hold & Sell Later.
    const later = holdAndSellLater(
        data.quantity,
        data.futurePrice,
        data.futureTransportCost,
        data.futurePackagingCost,
        data.futureLaborCost,
        today.netRevenue
    );


    // Calculate Alternative Market.
    const alternative = alternativeMarket(
        data.quantity,
        data.alternativePrice,
        data.alternativeTransportCost,
        data.alternativePackagingCost,
        data.alternativeLaborCost,
        today.netRevenue
    );


    // Return all three options.
    return {
        sellToday: today,
        holdAndSellLater: later,
        alternativeMarket: alternative
    };
}


// --------------------------------------------------
// 9. Export Functions
// --------------------------------------------------

// These functions can be imported into other
// JavaScript files in the Node.js project.

module.exports = {
    calculateGrossRevenue,
    calculateTotalCost,
    calculateNetRevenue,
    calculateProfitDifference,
    sellToday,
    holdAndSellLater,
    alternativeMarket,
    calculateAllOptions
};