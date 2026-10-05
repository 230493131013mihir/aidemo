/**
 * transportController.js
 * Controller for Shared Transport & Vehicle Pooling
 * HarvestMitra AI - ISSUE-08
 */

const { findMatchingTransport, calculateSharedTransportCost } = require('../services/transportMatcher');

// Realistic transport pools across Gujarat APMC Mandis
let transportPools = [
  {
    id: 'veh-01',
    driverName: 'Rajesh Patel',
    driverPhone: '+91 98251 44120',
    vehicleType: 'Tata 407 (Medium Freight)',
    vehicleNumber: 'GJ-05-BX-4120',
    location: 'Surat',
    destination: 'Ahmedabad',
    capacity: 2500,
    availableCapacity: 1500,
    currentLoad: 1000,
    availableDate: new Date().toISOString().split('T')[0],
    departureTime: '06:00 AM',
    totalTripCost: 2800,
    rating: 4.9,
    coFarmersCount: 1,
    coFarmers: [
      { farmerName: 'Suresh Chaudhari (Navsari)', quantity: 1000, crop: 'Tomatoes' }
    ]
  },
  {
    id: 'veh-02',
    driverName: 'Manish Varma',
    driverPhone: '+91 94280 88219',
    vehicleType: 'Mahindra Bolero Maxi Truck',
    vehicleNumber: 'GJ-19-K-8821',
    location: 'Navsari',
    destination: 'Surat',
    capacity: 1200,
    availableCapacity: 700,
    currentLoad: 500,
    availableDate: new Date().toISOString().split('T')[0],
    departureTime: '07:30 AM',
    totalTripCost: 1400,
    rating: 4.8,
    coFarmersCount: 1,
    coFarmers: [
      { farmerName: 'Hasmukh Bhai', quantity: 500, crop: 'Green Chilli' }
    ]
  },
  {
    id: 'veh-03',
    driverName: 'Pravin Solanki',
    driverPhone: '+91 97230 11984',
    vehicleType: 'Ashok Leyland Dost',
    vehicleNumber: 'GJ-03-TC-1198',
    location: 'Surat',
    destination: 'Rajkot',
    capacity: 1800,
    availableCapacity: 1200,
    currentLoad: 600,
    availableDate: new Date().toISOString().split('T')[0],
    departureTime: '05:00 AM',
    totalTripCost: 3200,
    rating: 4.7,
    coFarmersCount: 1,
    coFarmers: [
      { farmerName: 'Kishore Dave', quantity: 600, crop: 'Onion' }
    ]
  },
  {
    id: 'veh-04',
    driverName: 'Iqbal Mansuri',
    driverPhone: '+91 98980 55671',
    vehicleType: 'Eicher Pro 2049',
    vehicleNumber: 'GJ-06-AZ-5567',
    location: 'Surat',
    destination: 'Ahmedabad',
    capacity: 3500,
    availableCapacity: 2200,
    currentLoad: 1300,
    availableDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    departureTime: '04:30 AM',
    totalTripCost: 3400,
    rating: 4.9,
    coFarmersCount: 1,
    coFarmers: [
      { farmerName: 'Dhirubhai Patel', quantity: 1300, crop: 'Wheat' }
    ]
  }
];

/**
 * GET /api/transport/vehicles
 * Get all available shared vehicles
 */
function handleGetVehicles(req, res) {
  try {
    const { destination, location } = req.query;
    let list = [...transportPools];

    if (destination) {
      const destLower = destination.trim().toLowerCase();
      list = list.filter(v => v.destination.toLowerCase().includes(destLower));
    }
    if (location) {
      const locLower = location.trim().toLowerCase();
      list = list.filter(v => v.location.toLowerCase().includes(locLower));
    }

    return res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/transport/match
 * Smart matching engine using transportMatcher.js
 */
function handleMatchTransport(req, res) {
  try {
    const {
      farmerName = 'Farmer',
      location = 'Surat',
      destination = 'Ahmedabad',
      quantity = 500,
      requiredDate,
      crop = 'Tomato'
    } = req.body;

    const farmerReq = {
      farmerName,
      location,
      destination,
      quantity: Number(quantity) || 500,
      requiredDate: requiredDate || new Date().toISOString().split('T')[0]
    };

    // Use transportMatcher service
    const matched = findMatchingTransport(farmerReq, transportPools);

    // Compute exact shared cost calculations for each match
    const enriched = matched.map(vehicle => {
      const existingFarmers = (vehicle.coFarmers || []).map(f => ({
        farmerName: f.farmerName,
        quantity: f.quantity
      }));

      // Combine existing farmers with current requesting farmer
      const allFarmersInPool = [
        ...existingFarmers,
        { farmerName, quantity: farmerReq.quantity }
      ];

      const costBreakdown = calculateSharedTransportCost(vehicle.totalTripCost, allFarmersInPool);
      const myShare = costBreakdown.find(f => f.farmerName === farmerName) || {
        transportCost: vehicle.totalTripCost / 2,
        sharePercentage: 50
      };

      const soloCost = vehicle.totalTripCost;
      const sharedCost = myShare.transportCost;
      const savings = Math.max(0, soloCost - sharedCost);
      const savingsPercent = soloCost > 0 ? Number(((savings / soloCost) * 100).toFixed(1)) : 0;

      return {
        ...vehicle,
        soloCost,
        sharedCost,
        savings,
        savingsPercent,
        farmerSharePercentage: myShare.sharePercentage,
        costBreakdown
      };
    });

    return res.json({
      success: true,
      farmerRequest: farmerReq,
      matchesFound: enriched.length,
      matches: enriched
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/transport/pool
 * Confirm vehicle pooling booking
 */
function handleBookPool(req, res) {
  try {
    const {
      vehicleId,
      farmerName = 'Ramesh Patel',
      phone = '+91 99999 99991',
      quantity = 500,
      crop = 'Tomato',
      pickupAddress = 'Surat APMC Mandi Yard'
    } = req.body;

    const vehicle = transportPools.find(v => v.id === vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found or no longer available' });
    }

    const bookingQuantity = Number(quantity) || 500;
    if (vehicle.availableCapacity < bookingQuantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient vehicle capacity. Available: ${vehicle.availableCapacity} kg, requested: ${bookingQuantity} kg.`
      });
    }

    // Update vehicle capacity
    vehicle.availableCapacity -= bookingQuantity;
    vehicle.currentLoad += bookingQuantity;
    vehicle.coFarmersCount += 1;
    vehicle.coFarmers.push({
      farmerName: `${farmerName} (Booked)`,
      quantity: bookingQuantity,
      crop
    });

    const bookingId = `HM-POOL-${Math.floor(100000 + Math.random() * 900000)}`;

    return res.json({
      success: true,
      message: 'Transport space pooled and confirmed successfully!',
      booking: {
        bookingId,
        farmerName,
        phone,
        crop,
        quantity: bookingQuantity,
        pickupAddress,
        driverName: vehicle.driverName,
        driverPhone: vehicle.driverPhone,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        destination: vehicle.destination,
        departureTime: vehicle.departureTime,
        availableDate: vehicle.availableDate,
        pooledCost: Number((vehicle.totalTripCost * (bookingQuantity / vehicle.capacity)).toFixed(2)),
        status: 'CONFIRMED'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  handleGetVehicles,
  handleMatchTransport,
  handleBookPool
};
