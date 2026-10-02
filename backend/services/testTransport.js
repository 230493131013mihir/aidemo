// testTransport.js

// Import transportMatcher.js
const { findMatchingTransport } = require("./transportMatcher");


// Sample farmer
const farmer = {
    farmerName: "Ramesh",
    location: "Surat",
    destination: "Ahmedabad",
    crop: "Tomato",
    quantity: 500,
    requiredDate: "2026-10-05"
};


// Sample transport vehicles
const vehicles = [

    // 1. Matching vehicle
    {
        driverName: "Rajesh",
        location: "Surat",
        destination: "Ahmedabad",
        capacity: 1000,
        availableDate: "2026-10-05"
    },

    // 2. Insufficient capacity
    {
        driverName: "Amit",
        location: "Surat",
        destination: "Ahmedabad",
        capacity: 300,
        availableDate: "2026-10-05"
    },

    // 3. Different destination
    {
        driverName: "Suresh",
        location: "Surat",
        destination: "Vadodara",
        capacity: 1000,
        availableDate: "2026-10-05"
    }
];


// Find matching vehicles
const matchingVehicles = findMatchingTransport(
    farmer,
    vehicles
);


// Print results
console.log("=================================");
console.log("   SHARED TRANSPORT MATCHING");
console.log("=================================");

console.log("Farmer Name:", farmer.farmerName);
console.log("From:", farmer.location);
console.log("To:", farmer.destination);
console.log("Quantity:", farmer.quantity, "kg");
console.log("Required Date:", farmer.requiredDate);

console.log("\nMatching Vehicles:");

if (matchingVehicles.length === 0) {
    console.log("No matching vehicles found.");
} else {

    for (const vehicle of matchingVehicles) {
        console.log("-----------------------------");
        console.log("Driver Name:", vehicle.driverName);
        console.log("Location:", vehicle.location);
        console.log("Destination:", vehicle.destination);
        console.log("Capacity:", vehicle.capacity, "kg");
        console.log("Available Date:", vehicle.availableDate);
    }
}

console.log("=================================");