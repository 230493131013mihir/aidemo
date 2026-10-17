/**
 * transportController.js
 * Controller for Shared Transport & Vehicle Pooling
 * HarvestMitra AI - ISSUE-08
 */

const { findMatchingTransport, calculateSharedTransportCost } = require('../services/transportMatcher');

// Realistic transport pools across Maharashtra APMC Mandis
let transportPools = [
  {
    id: 'veh-01',
    driverName: 'Dnyaneshwar Shinde',
    driverPhone: '+91 98220 44120',
    vehicleType: 'Tata 407 (Agri Freight)',
    vehicleNumber: 'MH-12-RN-4120',
    location: 'Pune',
    destination: 'Mumbai Vashi Mega APMC',
    capacity: 2500,
    availableCapacity: 1500,
    currentLoad: 1000,
    availableDate: new Date().toISOString().split('T')[0],
    departureTime: '05:30 AM',
    totalTripCost: 2600,
    rating: 4.9,
    coFarmersCount: 1,
    coFarmers: [
      { farmerName: 'Anil Jadhav (Haveli)', quantity: 1000, crop: 'Tomato' }
    ]
  },
  {
    id: 'veh-02',
    driverName: 'Santosh Gaikwad',
    driverPhone: '+91 94220 88219',
    vehicleType: 'Mahindra Bolero Maxi Truck',
    vehicleNumber: 'MH-15-TC-8821',
    location: 'Nashik',
    destination: 'Pune APMC (Gultekdi)',
    capacity: 1500,
    availableCapacity: 900,
    currentLoad: 600,
    availableDate: new Date().toISOString().split('T')[0],
    departureTime: '06:30 AM',
    totalTripCost: 1800,
    rating: 4.8,
    coFarmersCount: 1,
    coFarmers: [
      { farmerName: 'Popat Pawar (Niphad)', quantity: 600, crop: 'Onion' }
    ]
  },
  {
    id: 'veh-03',
    driverName: 'Vitthal Thorat',
    driverPhone: '+91 97220 11984',
    vehicleType: 'Ashok Leyland Dost Agri',
    vehicleNumber: 'MH-17-AZ-1198',
    location: 'Ahmednagar',
    destination: 'Mumbai Vashi Mega APMC',
    capacity: 1800,
    availableCapacity: 1100,
    currentLoad: 700,
    availableDate: new Date().toISOString().split('T')[0],
    departureTime: '05:00 AM',
    totalTripCost: 2900,
    rating: 4.7,
    coFarmersCount: 1,
    coFarmers: [
      { farmerName: 'Babanrao Shinde (Rahuri)', quantity: 700, crop: 'Soybean' }
    ]
  },
  {
    id: 'veh-04',
    driverName: 'Sachin More',
    driverPhone: '+91 98229 55671',
    vehicleType: 'Eicher Pro 2049 Heavy',
    vehicleNumber: 'MH-09-EM-5567',
    location: 'Kolhapur',
    destination: 'Pune APMC (Gultekdi)',
    capacity: 3500,
    availableCapacity: 2100,
    currentLoad: 1400,
    availableDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    departureTime: '04:30 AM',
    totalTripCost: 3100,
    rating: 4.9,
    coFarmersCount: 1,
    coFarmers: [
      { farmerName: 'Tukaram Patil (Karveer)', quantity: 1400, crop: 'Jaggery & Vegetables' }
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
