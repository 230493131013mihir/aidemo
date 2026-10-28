/**
 * transportController.js
 * Controller for Shared Transport & Vehicle Pooling
 * HarvestMitra AI - ISSUE-08
 */

const { findMatchingTransport, calculateSharedTransportCost } = require('../services/transportMatcher');
const { TransportRequest, Vehicle } = require('../models');
const { Op } = require('sequelize');

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

// In-Memory Live Driver Telemetry State (Updated via real driver phone GPS or IoT gateways)
const liveDriverTelemetry = {};

/**
 * GET /api/transport/telemetry/:passCode
 * Retrieve live GPS and telemetry for a specific gate pass / driver
 */
async function handleGetTelemetry(req, res) {
  try {
    const rawPassCode = (req.params.passCode || req.query.passCode || '').trim();
    if (!rawPassCode) {
      return res.status(400).json({ success: false, message: 'Passcode or Booking ID is required' });
    }

    // Check if live telemetry coordinates have been posted for this passCode
    const liveCoords = liveDriverTelemetry[rawPassCode] || null;

    // Look up the actual booking in MySQL by gatePassCode, bookingId, or PK id
    let booking = null;
    try {
      const isNumeric = /^\d+$/.test(rawPassCode);
      const orClauses = [
        { gatePassCode: rawPassCode },
        { bookingId: rawPassCode }
      ];
      if (isNumeric) {
        orClauses.push({ id: Number(rawPassCode) });
      }

      booking = await TransportRequest.findOne({
        where: { [Op.or]: orClauses },
        include: [{ model: Vehicle, required: false }]
      });
    } catch (dbErr) {
      console.warn('[Telemetry] DB lookup warning:', dbErr.message);
    }

    if (!booking && !liveCoords) {
      return res.status(404).json({
        success: false,
        message: `No active transport booking or telemetry found for pass code: ${rawPassCode}`
      });
    }

    const hasLiveGps = Boolean(liveCoords && liveCoords.latitude && liveCoords.longitude && !liveCoords.isSimulated);
    const lastGpsTime = liveCoords ? liveCoords.lastUpdated : null;

    const resolvedDriverName = booking
      ? (booking.driverName || booking.Vehicle?.driverName || null)
      : (liveCoords?.driverName || null);

    const resolvedDriverPhone = booking
      ? (booking.driverPhone || booking.Vehicle?.driverPhone || null)
      : (liveCoords?.driverPhone || null);

    const resolvedVehicleNumber = booking
      ? (booking.vehicleNumber || booking.Vehicle?.registrationNumber || null)
      : (liveCoords?.vehicleNumber || null);

    const resolvedVehicleType = booking
      ? (booking.vehicleType || booking.Vehicle?.vehicleType || null)
      : (liveCoords?.vehicleType || null);

    const tripStatus = booking ? booking.status : (liveCoords?.status || 'pending');

    return res.json({
      success: true,
      telemetry: {
        passCode: rawPassCode,
        bookingId: booking?.id || booking?.bookingId || rawPassCode,
        driverName: resolvedDriverName || 'Driver not assigned yet',
        driverPhone: resolvedDriverPhone,
        vehicleNumber: resolvedVehicleNumber || 'Vehicle not assigned yet',
        vehicleType: resolvedVehicleType || 'Commercial Freight Vehicle',
        status: tripStatus,
        pickupLocation: booking?.pickupLocation || liveCoords?.pickupLocation || null,
        destinationMarket: booking?.destinationMarket || liveCoords?.destinationMarket || null,
        hasLiveGps,
        isSimulated: !hasLiveGps,
        latitude: liveCoords?.latitude || null,
        longitude: liveCoords?.longitude || null,
        speedKmh: hasLiveGps ? (liveCoords?.speedKmh ?? 0) : 0,
        heading: hasLiveGps ? (liveCoords?.heading ?? 0) : 0,
        checkpoint: liveCoords?.checkpoint || null,
        distanceRemainingKm: liveCoords?.distanceRemainingKm !== undefined ? liveCoords.distanceRemainingKm : null,
        etaMinutes: booking?.estimatedDurationMinutes || liveCoords?.etaMinutes || null,
        lastUpdated: lastGpsTime || new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/transport/telemetry/update
 * Driver or IoT Gateway updates live GPS coordinates, speed, and status
 */
function handleUpdateTelemetry(req, res) {
  try {
    const {
      passCode = 'MH-APMC-9421',
      latitude,
      longitude,
      speedKmh,
      heading,
      checkpoint,
      status,
      distanceRemainingKm,
      etaMinutes
    } = req.body;

    const current = liveDriverTelemetry[passCode] || { passCode };

    liveDriverTelemetry[passCode] = {
      ...current,
      latitude: Number(latitude) || current.latitude || 19.6644,
      longitude: Number(longitude) || current.longitude || 73.4735,
      speedKmh: speedKmh !== undefined ? Number(speedKmh) : current.speedKmh || 58,
      heading: heading !== undefined ? Number(heading) : current.heading || 236,
      checkpoint: checkpoint || current.checkpoint || 'State Highway Transit',
      status: status || current.status || 'in_transit',
      distanceRemainingKm: distanceRemainingKm !== undefined ? Number(distanceRemainingKm) : current.distanceRemainingKm,
      etaMinutes: etaMinutes !== undefined ? Number(etaMinutes) : current.etaMinutes,
      lastUpdated: new Date().toISOString()
    };

    return res.json({
      success: true,
      message: 'Telemetry coordinates updated successfully',
      telemetry: liveDriverTelemetry[passCode]
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  handleGetVehicles,
  handleMatchTransport,
  handleBookPool,
  handleGetTelemetry,
  handleUpdateTelemetry
};
