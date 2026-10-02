// transportMatcher.js

// Find vehicles that match a farmer's transport requirements
function findMatchingTransport(farmer, vehicles) {
    const matchingVehicles = [];

    for (const vehicle of vehicles) {

        // 1. Check location
        const locationMatches =
            farmer.location === vehicle.location;

        // 2. Check destination
        const destinationMatches =
            farmer.destination === vehicle.destination;

        // 3. Check vehicle capacity
        const capacityMatches =
            vehicle.capacity >= farmer.quantity;

        // 4. Check available date
        const dateMatches =
            farmer.requiredDate === vehicle.availableDate;

        // Add vehicle if all conditions match
        if (
            locationMatches &&
            destinationMatches &&
            capacityMatches &&
            dateMatches
        ) {
            matchingVehicles.push(vehicle);
        }
    }

    return matchingVehicles;
}


// Calculate transport cost per farmer
// when multiple farmers share one vehicle
function calculateSharedTransportCost(totalTransportCost, farmers) {

    // Avoid division by zero
    if (farmers.length === 0) {
        return [];
    }

    const costPerFarmer = totalTransportCost / farmers.length;

    const result = [];

    for (const farmer of farmers) {
        result.push({
            farmerName: farmer.farmerName,
            transportCost: costPerFarmer
        });
    }

    return result;
}


// Export functions
module.exports = {
    findMatchingTransport,
    calculateSharedTransportCost
};