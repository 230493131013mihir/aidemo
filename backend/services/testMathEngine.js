// testMathEngine.js

const {
    calculateGrossRevenue,
    calculateTotalCost,
    calculateNetRevenue
} = require("./mathEngine");

// Test data
const quantity = 500;
const sellingPrice = 40;

const transportCost = 2000;
const packagingCost = 500;
const laborCost = 1000;

// Calculate values
const grossRevenue = calculateGrossRevenue(quantity, sellingPrice);

const totalCost = calculateTotalCost(
    transportCost,
    packagingCost,
    laborCost
);

const netRevenue = calculateNetRevenue(
    grossRevenue,
    totalCost
);

// Print results
console.log("===== HarvestMitra AI - Math Engine Test =====");

console.log("Quantity:", quantity, "kg");
console.log("Selling Price: ₹" + sellingPrice + "/kg");

console.log("Gross Revenue: ₹" + grossRevenue);
console.log("Total Cost: ₹" + totalCost);
console.log("Net Revenue: ₹" + netRevenue); 