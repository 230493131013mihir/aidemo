// transportMatcher.js

function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}

function parseDate(value) {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateMatches(requiredDate, availableDate, allowDaysDifference = 1) {
    const required = parseDate(requiredDate);
    const available = parseDate(availableDate);

    if (!required || !available) {
        return Boolean(requiredDate === availableDate);
    }

    const differenceInDays = Math.abs((available.getTime() - required.getTime()) / 86400000);
    return differenceInDays <= allowDaysDifference;
}

// Find vehicles that match a farmer's transport requirements
function findMatchingTransport(farmer = {}, vehicles = []) {
    if (!farmer || !Array.isArray(vehicles)) {
        return [];
    }

    const quantity = Number(farmer.quantity || 0);
    const farmerLocation = normalizeText(farmer.location);
    const farmerDestination = normalizeText(farmer.destination);
    const farmerDate = farmer.requiredDate;

    const matches = vehicles
        .filter((vehicle) => {
            const vehicleLocation = normalizeText(vehicle.location);
            const vehicleDestination = normalizeText(vehicle.destination);
            const vehicleCapacity = Number(vehicle.capacity || 0);
            const vehicleDate = vehicle.availableDate;

            const locationMatches = !farmerLocation || vehicleLocation === farmerLocation;
            const destinationMatches = !farmerDestination || vehicleDestination === farmerDestination;
            const capacityMatches = vehicleCapacity >= quantity;
            const dateMatchesResult = !farmerDate || dateMatches(farmerDate, vehicleDate, 1);

            return locationMatches && destinationMatches && capacityMatches && dateMatchesResult;
        })
        .map((vehicle) => {
            const vehicleCapacity = Number(vehicle.capacity || 0);
            const vehicleLocation = normalizeText(vehicle.location);
            const vehicleDestination = normalizeText(vehicle.destination);

            let matchScore = 0;
            if (vehicleLocation && farmerLocation && vehicleLocation === farmerLocation) matchScore += 40;
            if (vehicleDestination && farmerDestination && vehicleDestination === farmerDestination) matchScore += 40;
            if (farmerDate && vehicle.availableDate && dateMatches(farmerDate, vehicle.availableDate, 1)) matchScore += 20;
            if (vehicleCapacity >= quantity) matchScore += 10;

            return {
                ...vehicle,
                matchScore,
                capacityAvailable: vehicleCapacity - quantity,
                isMatch: true
            };
        })
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return matches;
}

// Calculate transport cost per farmer when multiple farmers share one vehicle.
function calculateSharedTransportCost(totalTransportCost, farmers = []) {
    if (!Array.isArray(farmers) || farmers.length === 0) {
        return [];
    }

    const normalizedCost = Number(totalTransportCost || 0);
    const totalQuantity = farmers.reduce((sum, farmer) => sum + (Number(farmer.quantity || 0) || 0), 0);

    const result = farms => farms.map((farmer) => {
        const farmerQuantity = Number(farmer.quantity || 0);
        const share = totalQuantity > 0
            ? normalizedCost * (farmerQuantity / totalQuantity)
            : normalizedCost / farms.length;

        return {
            farmerName: farmer.farmerName || farmer.name || "Farmer",
            quantity: farmerQuantity,
            transportCost: Number(share.toFixed(2)),
            sharePercentage: totalQuantity > 0 ? Number(((farmerQuantity / totalQuantity) * 100).toFixed(2)) : (100 / farms.length)
        };
    });

    return result(farmers);
}

module.exports = {
    normalizeText,
    parseDate,
    dateMatches,
    findMatchingTransport,
    calculateSharedTransportCost
};