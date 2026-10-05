// testMathEngine.js

const assert = require("assert");
const {
    calculateGrossRevenue,
    calculateTotalCost,
    calculateNetRevenue,
    calculateAllOptions
} = require("./mathEngine");

const quantity = 500;
const sellingPrice = 40;
const transportCost = 2000;
const packagingCost = 500;
const laborCost = 1000;

const grossRevenue = calculateGrossRevenue(quantity, sellingPrice);
const totalCost = calculateTotalCost(transportCost, packagingCost, laborCost);
const netRevenue = calculateNetRevenue(grossRevenue, totalCost);

assert.strictEqual(grossRevenue, 20000, "Gross revenue should be quantity × price");
assert.strictEqual(totalCost, 3500, "Total cost should include transport, packaging, and labor");
assert.strictEqual(netRevenue, 16500, "Net revenue should be gross minus total cost");

const comparison = calculateAllOptions({
    quantity: 500,
    todayPrice: 18,
    todayTransportCost: 2000,
    todayPackagingCost: 500,
    todayLaborCost: 1000,
    futurePrice: 20,
    futureTransportCost: 2000,
    futurePackagingCost: 500,
    futureLaborCost: 1000,
    alternativePrice: 26,
    alternativeTransportCost: 2500,
    alternativePackagingCost: 500,
    alternativeLaborCost: 1000
});

assert.ok(comparison.sellToday.netRevenue > 0, "Sell today option should be positive");
assert.ok(comparison.alternativeMarket.netRevenue > comparison.sellToday.netRevenue, "Alternative market should improve profit in the sample scenario");
assert.strictEqual(comparison.recommendedOption, "Alternative Market", "The best-scoring option should be the alternative market scenario");

console.log("Math engine tests passed: gross revenue, cost, net revenue, and recommended option calculations are valid.");