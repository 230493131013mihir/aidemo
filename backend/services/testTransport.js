// testTransport.js

const assert = require("assert");
const { findMatchingTransport, calculateSharedTransportCost } = require("./transportMatcher");

const farmer = {
    farmerName: "Ramesh",
    location: "Surat",
    destination: "Ahmedabad",
    crop: "Tomato",
    quantity: 500,
    requiredDate: "2026-10-05"
};

const vehicles = [
    {
        driverName: "Rajesh",
        location: "Surat",
        destination: "Ahmedabad",
        capacity: 1000,
        availableDate: "2026-10-05"
    },
    {
        driverName: "Amit",
        location: "Surat",
        destination: "Ahmedabad",
        capacity: 300,
        availableDate: "2026-10-05"
    },
    {
        driverName: "Suresh",
        location: "Surat",
        destination: "Vadodara",
        capacity: 1000,
        availableDate: "2026-10-05"
    }
];

const matchingVehicles = findMatchingTransport(farmer, vehicles);
assert.strictEqual(matchingVehicles.length, 1, "Only the vehicle with required route, date, and capacity should match");
assert.strictEqual(matchingVehicles[0].driverName, "Rajesh", "The best match should be Rajesh's vehicle");

const sharedCosts = calculateSharedTransportCost(3000, [
    { farmerName: "Ramesh", quantity: 500 },
    { farmerName: "Mehul", quantity: 1000 }
]);

assert.strictEqual(sharedCosts.length, 2, "The cost-sharing output should include a share for each farmer");
assert.strictEqual(sharedCosts[0].transportCost, 1000, "Ramesh should pay a proportional share of the total transport cost");
assert.strictEqual(sharedCosts[1].transportCost, 2000, "Mehul should pay the larger proportional share based on quantity");

console.log("Transport matching tests passed: route/date/capacity matching and shared cost splitting are valid.");