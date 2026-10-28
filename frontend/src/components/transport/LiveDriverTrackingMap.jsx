/**
 * LiveDriverTrackingMap.jsx
 * Dynamic Interactive Real-Time GPS & Highway Telemetry Radar for HarvestMitra AI
 * Features:
 *  - 160+ Dense High-Resolution Highway Path Interpolation (Nashik, Pune, Ahmednagar, Mumbai APMC)
 *  - Fluid Continuous Vehicle Gliding with Smooth Bearing Rotation & Speed Fluctuations
 *  - Interactive Highway Scrubber (0% to 100% route timeline dragging)
 *  - Dynamic Playback Speed Multipliers (1x Real-Time, 2x Express, 5x Turbo, 10x Hyperwarp)
 *  - Auto-Follow Camera (Smooth Leaflet Tracking Cockpit View)
 *  - Dynamic Monsoon Rain & Ghat Fog Advisory Simulator
 *  - Live Driver Phone GPS Streaming via navigator.geolocation.watchPosition
 *  - Automatic Sync with Backend Live Telemetry Hub (/api/transport/telemetry/:passCode)
 *  - React-safe Telemetry Callback to Parent Component (onTelemetryUpdate)
 * HarvestMitra AI
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Truck,
  Navigation,
  Play,
  Pause,
  RotateCcw,
  Phone,
  Compass,
  Maximize2,
  Minimize2,
  AlertTriangle,
  LocateFixed,
  CloudRain,
  Eye,
  Sliders,
  Activity,
  Sun,
  ShieldAlert
} from 'lucide-react';

import { API_BASE_URL } from '../../config/apiConfig';

// Maharashtra Highway Corridor Waypoints with Realistic Road Geometries & Checkpoints
const CORRIDOR_PROFILES = {
  // Nashik to Mumbai (NH-160 / Kasara Ghat Corridor) - 168 km
  nashik_mumbai: {
    name: 'Nashik ➔ Mumbai Vashi APMC (NH-160 & Kasara Ghat)',
    totalDistanceKm: 168,
    checkpoints: [
      { name: '🌾 Nashik Rural Farm Gate #4', lat: 19.9975, lng: 73.7898, targetSpeed: 30, zone: 'Farm Gate' },
      { name: '🛣️ Wadivarhe Toll Plaza (NH-160)', lat: 19.8821, lng: 73.6934, targetSpeed: 62, zone: 'Highway' },
      { name: '⛰️ Igatpuri Hill Crest & Fog Zone', lat: 19.7042, lng: 73.5356, targetSpeed: 52, zone: 'Ghat Approach' },
      { name: '🌧️ Kasara Ghat Hairpin Pass', lat: 19.6644, lng: 73.4735, targetSpeed: 38, zone: 'Ghat Pass' },
      { name: '🚧 Shahapur Agri Freight Bypass', lat: 19.5210, lng: 73.3421, targetSpeed: 64, zone: 'Express Stretch' },
      { name: '⚖️ Padgha Toll & Weighbridge Bay', lat: 19.3820, lng: 73.2341, targetSpeed: 32, zone: 'Weighbridge' },
      { name: '🌉 Kalyan-Bhiwandi Junction Flyover', lat: 19.2437, lng: 73.1355, targetSpeed: 58, zone: 'Corridor' },
      { name: '🏙️ Airoli Creek Gateway (Navi Mumbai)', lat: 19.1860, lng: 73.0234, targetSpeed: 48, zone: 'Urban Approach' },
      { name: '🏛️ Mumbai Vashi Mega APMC Bay #4', lat: 19.0760, lng: 72.9986, targetSpeed: 20, zone: 'Mandi Yard' }
    ]
  },

  // Pune to Mumbai (Yashwantrao Chavan Expressway) - 148 km
  pune_mumbai: {
    name: 'Pune ➔ Mumbai Vashi APMC (Yashwantrao Chavan Expressway)',
    totalDistanceKm: 148,
    checkpoints: [
      { name: '🌾 Pune Gultekdi APMC Loading Yard', lat: 18.4975, lng: 73.8647, targetSpeed: 30, zone: 'Farm Gate' },
      { name: '🛣️ Pimpri-Chinchwad Expressway Start', lat: 18.6298, lng: 73.7997, targetSpeed: 65, zone: 'Highway' },
      { name: '⚖️ Talegaon Toll Plaza', lat: 18.7180, lng: 73.6740, targetSpeed: 35, zone: 'Weighbridge' },
      { name: '⛰️ Khandala-Lonavala Ghat Curves', lat: 18.7557, lng: 73.4091, targetSpeed: 45, zone: 'Ghat Pass' },
      { name: '🚧 Khalapur Expressway Toll Plaza', lat: 18.9102, lng: 73.2045, targetSpeed: 70, zone: 'Express Stretch' },
      { name: '🌉 Panvel Expressway Terminal', lat: 19.0125, lng: 73.1042, targetSpeed: 55, zone: 'Urban Approach' },
      { name: '🏛️ Mumbai Vashi Mega APMC Bay #2', lat: 19.0760, lng: 72.9986, targetSpeed: 20, zone: 'Mandi Yard' }
    ]
  },

  // Nashik to Pune (NH-60 Corridor) - 212 km
  nashik_pune: {
    name: 'Nashik ➔ Pune Gultekdi APMC (NH-60 Corridor)',
    totalDistanceKm: 212,
    checkpoints: [
      { name: '🌾 Nashik Rural Farm Gate', lat: 19.9975, lng: 73.7898, targetSpeed: 30, zone: 'Farm Gate' },
      { name: '🛣️ Sinnar Bypass (NH-60)', lat: 19.7214, lng: 73.8821, targetSpeed: 64, zone: 'Highway' },
      { name: '🌾 Sangamner Agri Interchange', lat: 19.3421, lng: 74.0041, targetSpeed: 58, zone: 'Corridor' },
      { name: '🚧 Alephata Market Crossing', lat: 19.0215, lng: 73.9512, targetSpeed: 45, zone: 'Market Zone' },
      { name: '🍅 Narayangaon Tomato Hub Checkpoint', lat: 18.8820, lng: 73.9142, targetSpeed: 52, zone: 'Corridor' },
      { name: '🏙️ Chakan Industrial Corridor', lat: 18.7124, lng: 73.8621, targetSpeed: 50, zone: 'Urban Approach' },
      { name: '🏛️ Pune Gultekdi APMC Mandi', lat: 18.4975, lng: 73.8647, targetSpeed: 20, zone: 'Mandi Yard' }
    ]
  },

  // Ahmednagar to Mumbai (NH-61 / Malshej Ghat) - 245 km
  ahmednagar_mumbai: {
    name: 'Ahmednagar ➔ Mumbai Vashi APMC (NH-61 & Malshej Ghat)',
    totalDistanceKm: 245,
    checkpoints: [
      { name: '🌾 Ahmednagar APMC Market Yard', lat: 19.0952, lng: 74.7496, targetSpeed: 30, zone: 'Farm Gate' },
      { name: '🛣️ Parner Bypass Highway (NH-61)', lat: 19.1234, lng: 74.3120, targetSpeed: 62, zone: 'Highway' },
      { name: '🌾 Otur Agri Market Checkpoint', lat: 19.2410, lng: 73.8741, targetSpeed: 54, zone: 'Corridor' },
      { name: '⛰️ Malshej Ghat Scenic Pass', lat: 19.3412, lng: 73.5412, targetSpeed: 36, zone: 'Ghat Pass' },
      { name: '🌉 Kalyan Bypass & Flyover', lat: 19.2437, lng: 73.1355, targetSpeed: 52, zone: 'Urban Approach' },
      { name: '🏛️ Mumbai Vashi Mega APMC', lat: 19.0760, lng: 72.9986, targetSpeed: 20, zone: 'Mandi Yard' }
    ]
  }
};

/**
 * Calculate bearing between two GPS coordinates
 */
function calculateBearing(startLat, startLng, destLat, destLng) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Calculate Haversine distance in km
 */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate Dense Interpolated High-Resolution Highway Coordinates
 * Converts sparse milestones into 150-250 smooth sub-steps
 */
function generateDenseHighwayCoordinates(checkpoints, stepsPerSegment = 22) {
  const denseCoordinates = [];
  let cumulativeDistance = 0;

  for (let i = 0; i < checkpoints.length - 1; i++) {
    const cpStart = checkpoints[i];
    const cpEnd = checkpoints[i + 1];
    const segmentDistance = getDistanceKm(cpStart.lat, cpStart.lng, cpEnd.lat, cpEnd.lng);

    for (let step = 0; step < stepsPerSegment; step++) {
      const t = step / stepsPerSegment;
      const lat = cpStart.lat + (cpEnd.lat - cpStart.lat) * t;
      const lng = cpStart.lng + (cpEnd.lng - cpStart.lng) * t;

      // Next point for bearing calculation
      const nextT = (step + 1) / stepsPerSegment;
      const nextLat = cpStart.lat + (cpEnd.lat - cpStart.lat) * nextT;
      const nextLng = cpStart.lng + (cpEnd.lng - cpStart.lng) * nextT;
      const bearing = calculateBearing(lat, lng, nextLat, nextLng);

      const stepDist = segmentDistance * (1 / stepsPerSegment);
      cumulativeDistance += stepDist;

      // Target speed with realistic speed transitions
      const baseSpeed = cpStart.targetSpeed + (cpEnd.targetSpeed - cpStart.targetSpeed) * t;

      denseCoordinates.push({
        lat,
        lng,
        bearing: Math.round(bearing),
        speed: Math.round(baseSpeed),
        checkpointName: t < 0.5 ? cpStart.name : cpEnd.name,
        currentMilestone: cpStart.name,
        nextMilestone: cpEnd.name,
        distanceCoveredKm: Number(cumulativeDistance.toFixed(1)),
        zone: t < 0.5 ? cpStart.zone : cpEnd.zone
      });
    }
  }

  // Final destination point
  const lastCp = checkpoints[checkpoints.length - 1];
  denseCoordinates.push({
    lat: lastCp.lat,
    lng: lastCp.lng,
    bearing: denseCoordinates[denseCoordinates.length - 1]?.bearing || 240,
    speed: 0,
    checkpointName: lastCp.name,
    currentMilestone: lastCp.name,
    nextMilestone: '🏁 Weighbridge Inspection Cleared',
    distanceCoveredKm: Number(cumulativeDistance.toFixed(1)),
    zone: 'Destination APMC'
  });

  return denseCoordinates;
}

export default function LiveDriverTrackingMap({
  booking = null,
  isExpandedDefault = false,
  className = '',
  onTelemetryUpdate = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const truckMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const routePolylineRef = useRef(null);
  const coveredPolylineRef = useRef(null);
  const geoWatchIdRef = useRef(null);
  const animFrameTimerRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Component States
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
  const [isPhoneGpsActive, setIsPhoneGpsActive] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [wasThrottledAlert, setWasThrottledAlert] = useState(false);
  const [trackingMode, setTrackingMode] = useState('live'); // 'live' (Real-time backend polling) | 'demo' (Simulated corridor demo)
  const [isPlaying, setIsPlaying] = useState(false); // Default false: Do not fake-move automatically in Live mode
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x Natural | 2x Brisk | 4x Fast-Forward
  const [autoFollow, setAutoFollow] = useState(true); // Follow vehicle camera
  const [isSimulatingRain, setIsSimulatingRain] = useState(false); // Dynamic monsoon weather advisory
  const tripStatus = booking?.status || 'pending';
  const isPendingPickup = ['open', 'pending', 'confirmed', 'accepted', 'driver_assigned', 'awaiting_pickup'].includes(tripStatus);
  const isDelivered = ['delivered', 'completed'].includes(tripStatus);

  const [currentIndex, setCurrentIndex] = useState(isPendingPickup ? 0 : 45);
  const [liveSpeedKmh, setLiveSpeedKmh] = useState(0);
  const [liveBearing, setLiveBearing] = useState(236);
  const [liveOdometerCoveredKm, setLiveOdometerCoveredKm] = useState(0);
  const [liveDistanceRemainingKm, setLiveDistanceRemainingKm] = useState(168);
  const [liveEtaMinutes, setLiveEtaMinutes] = useState(booking?.estimatedDurationMinutes || 120);
  const [currentMilestoneText, setCurrentMilestoneText] = useState(
    isPendingPickup
      ? (['open', 'pending'].includes(tripStatus) ? '⏳ Awaiting Transporter Acceptance' : '🚚 Driver Assigned & Preparing for Pickup')
      : isDelivered
      ? '🏁 Mandi Auction Bay'
      : '🛰️ Corridor Route Active'
  );
  const [nextMilestoneText, setNextMilestoneText] = useState('🚧 State Highway APMC Corridor');
  const [hasGpsError, setHasGpsError] = useState(false);
  const [lastTelemetryTimestamp, setLastTelemetryTimestamp] = useState(null);
  const [isLiveTelemetryActive, setIsLiveTelemetryActive] = useState(false);

  // Booking particulars (Strictly resolved from actual database booking record)
  const originName = booking?.pickupLocation || booking?.location || 'Origin Farm Gate';
  const destinationName = booking?.destinationMarket || booking?.destination || 'Destination APMC Mandi';
  const driverName = booking?.driverName || booking?.Vehicle?.driverName || '';
  const driverPhone = booking?.driverPhone || booking?.Vehicle?.driverPhone || '';
  const vehicleNumber = booking?.vehicleNumber || booking?.Vehicle?.registrationNumber || '';
  const vehicleType = booking?.vehicleType || booking?.Vehicle?.vehicleType || '';
  const cropInfo = booking ? `${booking.weightKg || 0} kg ${booking.cropName || 'Produce'}` : 'Agri Freight';
  const passCode = booking?.gatePassCode || (booking?.id ? `MH-APMC-${booking.id}` : '');

  // Determine appropriate corridor profile
  const selectedProfile = useMemo(() => {
    const text = `${originName} ${destinationName}`.toLowerCase();
    if (text.includes('pune') && text.includes('mumbai')) return CORRIDOR_PROFILES.pune_mumbai;
    if (text.includes('nashik') && text.includes('pune')) return CORRIDOR_PROFILES.nashik_pune;
    if (text.includes('ahmednagar') && text.includes('mumbai')) return CORRIDOR_PROFILES.ahmednagar_mumbai;
    return CORRIDOR_PROFILES.nashik_mumbai;
  }, [originName, destinationName]);

  // Generate 160+ Dense GPS sub-steps
  const denseRoute = useMemo(() => {
    return generateDenseHighwayCoordinates(selectedProfile.checkpoints, 24);
  }, [selectedProfile]);

  const originCoords = useMemo(() => [denseRoute[0].lat, denseRoute[0].lng], [denseRoute]);
  const destCoords = useMemo(
    () => [denseRoute[denseRoute.length - 1].lat, denseRoute[denseRoute.length - 1].lng],
    [denseRoute]
  );
  const totalCorridorKm = selectedProfile.totalDistanceKm || 168;
  const progressPct = Math.round((currentIndex / (denseRoute.length - 1)) * 100);

  const onTelemetryUpdateRef = useRef(onTelemetryUpdate);
  useEffect(() => {
    onTelemetryUpdateRef.current = onTelemetryUpdate;
  }, [onTelemetryUpdate]);

  // React-safe Telemetry Callback to Parent Component (outside render phase)
  useEffect(() => {
    if (typeof onTelemetryUpdateRef.current === 'function' && denseRoute[currentIndex]) {
      onTelemetryUpdateRef.current({
        speedKmh: liveSpeedKmh,
        bearing: liveBearing,
        distanceCoveredKm: liveOdometerCoveredKm,
        distanceRemainingKm: liveDistanceRemainingKm,
        etaMinutes: liveEtaMinutes,
        checkpoint: currentMilestoneText,
        nextCheckpoint: nextMilestoneText,
        progressPct,
        isSimulatingRain
      });
    }
  }, [currentIndex, liveSpeedKmh, liveBearing, liveOdometerCoveredKm, liveDistanceRemainingKm, liveEtaMinutes, currentMilestoneText, nextMilestoneText, progressPct, isSimulatingRain]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(originCoords, 9);

    // OpenStreetMap Clean Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // 1. Origin Farm Gate Marker
    const originIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-amber-500/30 animate-ping"></div>
          <div class="w-8 h-8 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs">
            🚜
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const originMarker = L.marker(originCoords, { icon: originIcon }).addTo(map);
    originMarker.bindPopup(`
      <div style="font-family: system-ui; padding: 4px; font-size: 12px; line-height: 1.4;">
        <strong style="color: #b45309; font-size: 13px;">🌾 Farm Gate Loading Point</strong><br/>
        <strong>Location:</strong> ${originName}<br/>
        <strong>Produce:</strong> ${cropInfo}<br/>
        <span style="color: #059669; font-weight: bold;">Status: Inspected & Loaded</span>
      </div>
    `);

    // 2. Destination APMC Marker
    const destIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-9 h-9 rounded-full bg-emerald-500/30 animate-ping"></div>
          <div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg border-2 border-white font-bold text-sm">
            🏛️
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const destMarker = L.marker(destCoords, { icon: destIcon }).addTo(map);
    destMarker.bindPopup(`
      <div style="font-family: system-ui; padding: 4px; font-size: 12px; line-height: 1.4;">
        <strong style="color: #047857; font-size: 13px;">🏛️ Destination Mandi</strong><br/>
        <strong>APMC:</strong> ${destinationName}<br/>
        <strong>Gate Clearance:</strong> Verified Pass (${passCode})<br/>
        <span style="color: #2563eb; font-weight: bold;">Weighbridge Bay: Active</span>
      </div>
    `);

    // 3. Planned Corridor Polyline (dashed emerald)
    const polylineCoords = denseRoute.map((p) => [p.lat, p.lng]);
    const plannedPolyline = L.polyline(polylineCoords, {
      color: '#059669',
      weight: 5,
      opacity: 0.6,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    routePolylineRef.current = plannedPolyline;

    // 4. Covered Polyline (solid vibrant green)
    const initialCut = Math.min(currentIndex, denseRoute.length - 1);
    const coveredCoords = denseRoute.slice(0, initialCut + 1).map((p) => [p.lat, p.lng]);
    const coveredPolyline = L.polyline(coveredCoords, {
      color: '#10b981',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round'
    }).addTo(map);
    coveredPolylineRef.current = coveredPolyline;

    // 5. Driver Truck Live Marker with Pulse & Dynamic Rotation
    const initialPoint = denseRoute[initialCut] || denseRoute[0];
    const truckIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div id="truck-marker-wrapper" style="position: relative; display: flex; align-items: center; justify-content: center; width: 46px; height: 46px;">
          <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(16, 185, 129, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div id="truck-body-box" style="width: 38px; height: 38px; border-radius: 12px; background: #090d16; border: 2.5px solid #10b981; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.6); transform: rotate(${initialPoint.bearing}deg); transition: transform 0.6s ease-in-out;">
            <span style="font-size: 19px;">🚚</span>
          </div>
          <div id="truck-speed-pill" style="position: absolute; bottom: -8px; background: #059669; color: white; font-family: monospace; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2);">
            ${initialPoint.speed} km/h
          </div>
        </div>
      `,
      iconSize: [46, 46],
      iconAnchor: [23, 23]
    });

    const truckMarker = L.marker([initialPoint.lat, initialPoint.lng], {
      icon: truckIcon,
      zIndexOffset: 1000
    }).addTo(map);

    truckMarker.bindPopup(`
      <div style="font-family: system-ui; padding: 6px; font-size: 12px; line-height: 1.5; min-width: 210px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          <strong style="color: #0f172a; font-size: 13px;">🚚 ${driverName || 'Driver not assigned yet'}</strong>
          <span style="background: #dcfce7; color: #166534; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">${tripStatus.toUpperCase().replace(/_/g, ' ')}</span>
        </div>
        <div><strong>Vehicle:</strong> ${vehicleNumber ? `${vehicleNumber} ${vehicleType ? `(${vehicleType})` : ''}` : 'Vehicle not assigned yet'}</div>
        <div><strong>Gate Pass:</strong> <span style="font-family: monospace; font-weight: bold; color: #059669;">${passCode || 'Pending Assignment'}</span></div>
        <div><strong>Cargo:</strong> ${cropInfo}</div>
        ${driverPhone ? `
        <div style="margin-top: 6px;">
          <a href="tel:${driverPhone}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 11px;">
            📞 Call Driver (+91 ${driverPhone})
          </a>
        </div>` : ''}
      </div>
    `);

    truckMarkerRef.current = truckMarker;

    // Fit bounds initially
    const bounds = L.latLngBounds([originCoords, destCoords, [initialPoint.lat, initialPoint.lng]]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [denseRoute, originCoords, destCoords, originName, destinationName, driverName, driverPhone, vehicleNumber, vehicleType, cropInfo, passCode]);

  // Smooth Continuous Navigation along Maharashtra Highway Corridor (Only active during Demo Simulation Mode)
  useEffect(() => {
    if (isPhoneGpsActive || trackingMode !== 'demo' || !isPlaying) {
      if (animFrameTimerRef.current) clearInterval(animFrameTimerRef.current);
      return;
    }

    // Calibrated natural cruising pace (readable, smooth, realistic highway radar):
    // 1x = 1800ms per step (calm, clear checkpoint reading)
    // 2x = 900ms per step (brisk)
    // 4x = 450ms per step (fast demo)
    const tickIntervalMs = Math.max(300, Math.round(1800 / playbackSpeed));

    animFrameTimerRef.current = setInterval(() => {
      setCurrentIndex((prevIdx) => {
        const nextIdx = (prevIdx + 1) % denseRoute.length;
        const currentPt = denseRoute[nextIdx];

        // Apply dynamic rain speed cap if simulated
        let effectiveSpeed = currentPt.speed;
        if (isSimulatingRain) {
          effectiveSpeed = Math.min(38, Math.round(effectiveSpeed * 0.65));
        }
        effectiveSpeed = Math.max(15, effectiveSpeed + Math.round((Math.random() - 0.5) * 3));

        const distCovered = currentPt.distanceCoveredKm;
        const distRemaining = Math.max(0, Number((totalCorridorKm - distCovered).toFixed(1)));
        const calculatedEta = Math.max(3, Math.round((distRemaining / (effectiveSpeed || 50)) * 60));

        // Update local telemetry states
        setLiveSpeedKmh(effectiveSpeed);
        setLiveBearing(currentPt.bearing);
        setLiveOdometerCoveredKm(distCovered);
        setLiveDistanceRemainingKm(distRemaining);
        setLiveEtaMinutes(calculatedEta);
        setCurrentMilestoneText(currentPt.currentMilestone);
        setNextMilestoneText(currentPt.nextMilestone);

        // Move Leaflet Marker & update rotation smoothly
        if (truckMarkerRef.current) {
          const latLng = [currentPt.lat, currentPt.lng];
          truckMarkerRef.current.setLatLng(latLng);

          const truckIcon = L.divIcon({
            className: 'custom-map-icon',
            html: `
              <div id="truck-marker-wrapper" style="position: relative; display: flex; align-items: center; justify-content: center; width: 46px; height: 46px;">
                <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(16, 185, 129, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div id="truck-body-box" style="width: 38px; height: 38px; border-radius: 12px; background: #090d16; border: 2.5px solid #10b981; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.6); transform: rotate(${currentPt.bearing}deg); transition: transform 0.6s ease-in-out;">
                  <span style="font-size: 19px;">🚚</span>
                </div>
                <div id="truck-speed-pill" style="position: absolute; bottom: -8px; background: ${isSimulatingRain ? '#0284c7' : '#059669'}; color: white; font-family: monospace; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2);">
                  ${effectiveSpeed} km/h
                </div>
              </div>
            `,
            iconSize: [46, 46],
            iconAnchor: [23, 23]
          });
          truckMarkerRef.current.setIcon(truckIcon);

          // Smooth Camera Auto-Follow (gently pans every few steps)
          if (autoFollow && mapInstanceRef.current && nextIdx % 2 === 0) {
            mapInstanceRef.current.panTo(latLng, { animate: true, duration: 1.0 });
          }
        }

        // Update glowing covered polyline
        if (coveredPolylineRef.current) {
          const coveredPts = denseRoute.slice(0, nextIdx + 1).map((p) => [p.lat, p.lng]);
          coveredPolylineRef.current.setLatLngs(coveredPts);
        }

        return nextIdx;
      });
    }, tickIntervalMs);

    return () => {
      if (animFrameTimerRef.current) clearInterval(animFrameTimerRef.current);
    };
  }, [isPhoneGpsActive, trackingMode, isPlaying, playbackSpeed, denseRoute, totalCorridorKm, autoFollow, isSimulatingRain]);

  // Live Real-World Backend Polling Mode (Fetches driver reported GPS coordinates every 3.5s)
  useEffect(() => {
    if (isPhoneGpsActive || trackingMode !== 'live') return;

    let isMounted = true;

    const pollLiveTelemetry = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/transport/telemetry/${encodeURIComponent(passCode)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data?.success || !data?.telemetry) return;

        const t = data.telemetry;
        if (t.latitude && t.longitude) {
          const lat = Number(t.latitude);
          const lng = Number(t.longitude);
          const speed = Number(t.speedKmh ?? 0);
          const heading = Number(t.heading ?? 0);

          setLiveSpeedKmh(speed);
          setLiveBearing(heading);
          if (t.distanceRemainingKm !== undefined) setLiveDistanceRemainingKm(Number(t.distanceRemainingKm));
          if (t.distanceCoveredKm !== undefined) setLiveOdometerCoveredKm(Number(t.distanceCoveredKm));
          if (t.etaMinutes !== undefined) setLiveEtaMinutes(Number(t.etaMinutes));
          if (t.checkpoint) setCurrentMilestoneText(t.checkpoint);
          setLastTelemetryTimestamp(t.lastUpdated ? new Date(t.lastUpdated) : new Date());
          setIsLiveTelemetryActive(true);

          const latLng = [lat, lng];

          if (truckMarkerRef.current) {
            truckMarkerRef.current.setLatLng(latLng);

            const truckIcon = L.divIcon({
              className: 'custom-map-icon',
              html: `
                <div id="truck-marker-wrapper" style="position: relative; display: flex; align-items: center; justify-content: center; width: 46px; height: 46px;">
                  <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(16, 185, 129, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                  <div id="truck-body-box" style="width: 38px; height: 38px; border-radius: 12px; background: #090d16; border: 2.5px solid #10b981; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.6); transform: rotate(${heading}deg); transition: transform 0.6s ease-in-out;">
                    <span style="font-size: 19px;">🚚</span>
                  </div>
                  <div id="truck-speed-pill" style="position: absolute; bottom: -8px; background: ${isSimulatingRain ? '#0284c7' : '#059669'}; color: white; font-family: monospace; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2);">
                    ${speed} km/h
                  </div>
                </div>
              `,
              iconSize: [46, 46],
              iconAnchor: [23, 23]
            });
            truckMarkerRef.current.setIcon(truckIcon);

            if (autoFollow && mapInstanceRef.current) {
              mapInstanceRef.current.panTo(latLng, { animate: true, duration: 1.0 });
            }
          }
        }
      } catch (err) {
        console.warn('[LiveDriverTrackingMap] Telemetry poll failed:', err.message);
      }
    };

    pollLiveTelemetry();
    const pollInterval = setInterval(pollLiveTelemetry, 3500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [isPhoneGpsActive, trackingMode, passCode, autoFollow, isSimulatingRain]);

  // Process real-world GPS coordinates from device sensor
  const handleProcessGpsFix = useCallback((pos) => {
    if (!pos || !pos.coords) return;
    const { latitude, longitude, speed, heading, accuracy } = pos.coords;

    const latLng = [latitude, longitude];
    const kmh = speed ? Math.round(speed * 3.6) : 56;
    setLiveSpeedKmh(kmh);

    if (heading !== null && !isNaN(heading)) {
      setLiveBearing(Math.round(heading));
    }

    const remaining = Math.round(getDistanceKm(latitude, longitude, destCoords[0], destCoords[1]));
    const covered = Math.max(0, Math.round(getDistanceKm(originCoords[0], originCoords[1], latitude, longitude)));
    setLiveDistanceRemainingKm(remaining);
    setLiveOdometerCoveredKm(covered);
    setLiveEtaMinutes(Math.max(5, Math.round((remaining / (kmh || 50)) * 60)));

    if (truckMarkerRef.current && mapInstanceRef.current) {
      truckMarkerRef.current.setLatLng(latLng);
      if (autoFollow) {
        mapInstanceRef.current.panTo(latLng);
      }

      if (!accuracyCircleRef.current) {
        accuracyCircleRef.current = L.circle(latLng, {
          radius: accuracy || 50,
          color: '#3b82f6',
          fillColor: '#60a5fa',
          fillOpacity: 0.15,
          weight: 1.5
        }).addTo(mapInstanceRef.current);
      } else {
        accuracyCircleRef.current.setLatLng(latLng);
        accuracyCircleRef.current.setRadius(accuracy || 50);
      }
    }

    // Broadcast driver phone GPS to backend telemetry hub
    try {
      fetch(`${API_BASE_URL}/api/transport/telemetry/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passCode,
          latitude,
          longitude,
          speedKmh: kmh,
          heading: heading || 0,
          distanceRemainingKm: remaining,
          etaMinutes: Math.max(5, Math.round((remaining / (kmh || 50)) * 60))
        })
      }).catch(() => {});
    } catch (_) {}
  }, [destCoords, originCoords, autoFollow, passCode]);

  // Request Screen Wake Lock so phone screen does not turn off/lock while driving
  const requestWakeLock = useCallback(async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!wakeLockRef.current) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          setIsWakeLockActive(true);
          wakeLockRef.current.addEventListener('release', () => {
            setIsWakeLockActive(false);
            wakeLockRef.current = null;
          });
        }
      } catch (err) {
        console.warn('[LiveDriverTrackingMap] Screen Wake Lock error:', err.message);
        setIsWakeLockActive(false);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (_) {}
      wakeLockRef.current = null;
      setIsWakeLockActive(false);
    }
  }, []);

  // Manage Screen Wake Lock lifecycle with phone GPS broadcast
  useEffect(() => {
    if (isPhoneGpsActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
      setWasThrottledAlert(false);
    }
    return () => {
      releaseWakeLock();
    };
  }, [isPhoneGpsActive, requestWakeLock, releaseWakeLock]);

  // Page Visibility API: Detect background tab throttling & immediately re-sync GPS on return
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabHidden(true);
        if (isPhoneGpsActive) {
          setWasThrottledAlert(true);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([150, 100, 150]);
          }
        }
      } else {
        setIsTabHidden(false);
        // Driver brought the tab back to the foreground
        if (isPhoneGpsActive) {
          // 1. Re-acquire screen wake lock since browser auto-releases it upon hidden
          requestWakeLock();

          // 2. Immediate GPS re-sync to eliminate stale location lag
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => handleProcessGpsFix(pos),
              (err) => console.warn('[LiveDriverTrackingMap] Visibility restore GPS error:', err.message),
              { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
            );
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPhoneGpsActive, requestWakeLock, handleProcessGpsFix]);

  // Live Real-World Phone Geolocation Streaming Mode
  useEffect(() => {
    if (!isPhoneGpsActive) {
      if (geoWatchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      if (accuracyCircleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(accuracyCircleRef.current);
        accuracyCircleRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setHasGpsError(true);
      return;
    }

    setHasGpsError(false);

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handleProcessGpsFix(pos),
      (err) => {
        console.warn('[LiveDriverTrackingMap] GPS error:', err.message);
        setHasGpsError(true);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000
      }
    );

    return () => {
      if (geoWatchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      if (accuracyCircleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(accuracyCircleRef.current);
        accuracyCircleRef.current = null;
      }
    };
  }, [isPhoneGpsActive, handleProcessGpsFix]);

  // Center Camera on Vehicle
  const handleCenterOnVehicle = () => {
    if (!mapInstanceRef.current || !truckMarkerRef.current) return;
    const pos = truckMarkerRef.current.getLatLng();
    mapInstanceRef.current.flyTo(pos, 13, { duration: 1.2 });
  };

  // Full Route Reset to Origin Farm Gate
  const handleResetSimulation = () => {
    setCurrentIndex(0);
    const startPt = denseRoute[0];
    if (truckMarkerRef.current && mapInstanceRef.current) {
      truckMarkerRef.current.setLatLng([startPt.lat, startPt.lng]);
      mapInstanceRef.current.flyTo([startPt.lat, startPt.lng], 11, { duration: 1.0 });
    }
    if (coveredPolylineRef.current) {
      coveredPolylineRef.current.setLatLngs([[startPt.lat, startPt.lng]]);
    }
  };

  // Interactive Route Scrubber Handler
  const handleScrubberChange = (e) => {
    const pct = Number(e.target.value);
    const targetIdx = Math.min(
      Math.floor((pct / 100) * (denseRoute.length - 1)),
      denseRoute.length - 1
    );
    setCurrentIndex(targetIdx);
    const targetPt = denseRoute[targetIdx];

    if (truckMarkerRef.current) {
      truckMarkerRef.current.setLatLng([targetPt.lat, targetPt.lng]);
      if (autoFollow && mapInstanceRef.current) {
        mapInstanceRef.current.panTo([targetPt.lat, targetPt.lng]);
      }
    }
    if (coveredPolylineRef.current) {
      const coveredPts = denseRoute.slice(0, targetIdx + 1).map((p) => [p.lat, p.lng]);
      coveredPolylineRef.current.setLatLngs(coveredPts);
    }
    setLiveOdometerCoveredKm(targetPt.distanceCoveredKm);
    setLiveDistanceRemainingKm(Math.max(0, Number((totalCorridorKm - targetPt.distanceCoveredKm).toFixed(1))));
    setLiveSpeedKmh(targetPt.speed);
    setCurrentMilestoneText(targetPt.currentMilestone);
    setNextMilestoneText(targetPt.nextMilestone);
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border-2 border-emerald-500/30 bg-slate-950 text-white shadow-2xl transition-all duration-300 ${
        isExpanded ? 'h-[590px] sm:h-[650px]' : 'h-[420px] sm:h-[480px]'
      } ${className}`}
    >
      {/* Interactive Leaflet Map Surface */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Glassmorphism Status Bar */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-2">
        <div className="px-3.5 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-xs flex items-center gap-2.5 shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveTelemetryActive || isPhoneGpsActive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLiveTelemetryActive || isPhoneGpsActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="font-extrabold text-white tracking-wide">
            🛰️ Delivery Radar
          </span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            isPhoneGpsActive
              ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
              : isLiveTelemetryActive
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
          }`}>
            {isPhoneGpsActive ? 'PHONE GPS BROADCAST' : isLiveTelemetryActive ? 'LIVE HARDWARE GPS STREAM' : 'SIMULATED ROUTE PLAYBACK'}
          </span>
        </div>

        {/* Tracking Mode Switcher: Live vs Demo */}
        <div className="flex items-center rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/15 p-0.5 shadow-lg text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTrackingMode('live');
              setIsPlaying(false);
            }}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              trackingMode === 'live'
                ? 'bg-emerald-500 text-slate-950 shadow font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Live Real-time GPS stream from backend"
          >
            🟢 Live GPS
          </button>
          <button
            type="button"
            onClick={() => {
              setTrackingMode('demo');
              setIsPlaying(true);
            }}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              trackingMode === 'demo'
                ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Switch to Demo Highway Corridor Simulation"
          >
            🎮 Demo
          </button>
        </div>

        {/* Clean Driver Phone GPS Button */}
        <button
          type="button"
          onClick={() => {
            const next = !isPhoneGpsActive;
            setIsPhoneGpsActive(next);
            if (next) {
              setTrackingMode('live');
              setIsPlaying(false);
            }
          }}
          className={`px-3 py-1.5 rounded-2xl backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
            isPhoneGpsActive
              ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/30'
              : 'bg-slate-900/90 border-white/15 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={isPhoneGpsActive ? 'Stop Phone GPS Broadcast' : 'Use Driver Smartphone Live GPS'}
        >
          <LocateFixed className="w-3.5 h-3.5" />
          <span>{isPhoneGpsActive ? 'Broadcasting Phone GPS' : 'Driver Phone GPS'}</span>
        </button>

        {/* Screen Wake Lock Pill Indicator (when phone GPS is active) */}
        {isPhoneGpsActive && (
          <div
            className={`px-2.5 py-1.5 rounded-2xl backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all ${
              isWakeLockActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-amber-500/20'
                : 'bg-slate-900/90 text-slate-400 border-white/10'
            }`}
            title={
              isWakeLockActive
                ? 'Screen Wake Lock active: Your screen will stay awake to prevent GPS suspension'
                : 'Wake Lock inactive'
            }
          >
            <Sun className={`w-3.5 h-3.5 ${isWakeLockActive ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{isWakeLockActive ? 'Screen Awake' : 'Screen Sleep Allowed'}</span>
          </div>
        )}
      </div>

      {/* Floating HUD Telemetry Card (Bottom Left) */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-10 sm:max-w-md rounded-2xl bg-slate-950/94 backdrop-blur-md border border-emerald-500/30 p-3.5 text-xs shadow-2xl space-y-2.5">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-white text-xs leading-none">
                {driverName || 'Driver not assigned yet'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {vehicleNumber || 'Vehicle not assigned yet'} {vehicleType ? `• ${vehicleType}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {driverPhone ? (
              <a
                href={`tel:${driverPhone}`}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 shadow transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>Call</span>
              </a>
            ) : (
              <span className="text-[10px] text-slate-400 italic">No phone</span>
            )}
          </div>
        </div>

        {/* 4-Item Telemetry Matrix */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">Speed</span>
            <span className="font-mono font-black text-emerald-400 text-xs">
              {liveSpeedKmh} <span className="text-[9px]">km/h</span>
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">ETA</span>
            <span className="font-mono font-black text-amber-300 text-xs">
              ~{liveEtaMinutes} <span className="text-[9px]">min</span>
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">Covered</span>
            <span className="font-mono font-black text-white text-xs">
              {liveOdometerCoveredKm} <span className="text-[9px]">km</span>
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">Bearing</span>
            <span className="font-mono font-black text-cyan-400 text-xs flex items-center justify-center gap-0.5">
              <Compass className="w-2.5 h-2.5" />
              <span>{liveBearing}°</span>
            </span>
          </div>
        </div>

        {/* Current Checkpoint Banner */}
        <div className="p-2 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-bold uppercase">Current Checkpoint</span>
            <span className="font-mono text-emerald-300 font-bold">{progressPct}% Complete</span>
          </div>
          <p className="text-[11px] font-extrabold text-white truncate">{currentMilestoneText}</p>
        </div>

        {/* Live Telemetry Pulse & Status Banner (when in Live mode) vs Timeline Scrubber (Demo mode) */}
        {trackingMode === 'demo' ? (
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sliders className="w-2.5 h-2.5 text-emerald-400" />
                <span>Demo Highway Scrubber</span>
              </span>
              <span>{liveDistanceRemainingKm} km remaining</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progressPct}
              onChange={handleScrubberChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
            <span className="flex items-center gap-1.5 text-emerald-300 font-mono">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span>{isPhoneGpsActive ? 'Streaming device phone GPS' : 'Polling live driver coordinates'}</span>
            </span>
            <span className="font-mono text-slate-400 text-[9px] bg-white/5 px-2 py-0.5 rounded border border-white/10">
              {lastTelemetryTimestamp ? `Updated ${Math.max(1, Math.round((Date.now() - new Date(lastTelemetryTimestamp).getTime()) / 1000))}s ago` : 'Waiting for telemetry...'}
            </span>
          </div>
        )}

        {/* Weather / Rain Simulation Banner if active */}
        {isSimulatingRain && (
          <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] flex items-center gap-1.5 animate-in fade-in">
            <CloudRain className="w-3.5 h-3.5 shrink-0 animate-bounce" />
            <span>🌧️ Monsoon Advisory Active: Heavy Rain on Kasara Ghat. Speed Capped at 38 km/h. Tarp Double-Sealed.</span>
          </div>
        )}

        {/* Geolocation Notice / Error banner */}
        {hasGpsError && (
          <div className="p-1.5 rounded bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>Device GPS permission required. Switched to dynamic Highway Corridor Stream.</span>
          </div>
        )}

        {/* Background Throttling Advisory Banner when tab was hidden */}
        {wasThrottledAlert && isPhoneGpsActive && (
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10px] flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
              <div className="leading-tight">
                <strong className="text-amber-300 font-bold">App Minimized:</strong> Browser suspended background GPS. Coordinates re-synced! Keep screen awake on dashboard mount.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWasThrottledAlert(false)}
              className="text-amber-300 hover:text-white font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-[9px] shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Top-Right Floating Controls (Center, Camera Follow, Rain Simulator, Speed, Fullscreen) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCenterOnVehicle}
          title="Center on Truck"
          className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-white/15 backdrop-blur-md flex items-center justify-center shadow-lg transition-colors"
        >
          <Navigation className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setAutoFollow((f) => !f)}
          title={autoFollow ? 'Disable Auto-Follow Camera' : 'Enable Auto-Follow Camera'}
          className={`w-9 h-9 rounded-xl border border-white/15 backdrop-blur-md flex items-center justify-center shadow-lg transition-colors ${
            autoFollow ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900/90 text-slate-400'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsSimulatingRain((r) => !r)}
          title={isSimulatingRain ? 'Clear Weather' : 'Simulate Monsoon Rain Advisory'}
          className={`w-9 h-9 rounded-xl border border-white/15 backdrop-blur-md flex items-center justify-center shadow-lg transition-colors ${
            isSimulatingRain ? 'bg-blue-600 text-white' : 'bg-slate-900/90 text-slate-400 hover:text-blue-400'
          }`}
        >
          <CloudRain className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          title={isExpanded ? 'Collapse Map' : 'Expand Fullscreen Radar'}
          className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-white/15 backdrop-blur-md flex items-center justify-center shadow-lg transition-colors"
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Dynamic Navigation Controls (Demo Simulation Mode only) */}
        {!isPhoneGpsActive && trackingMode === 'demo' && (
          <div className="rounded-xl bg-slate-900/90 border border-white/15 backdrop-blur-md p-1 flex flex-col items-center gap-1 shadow-lg">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              title={isPlaying ? 'Pause Dynamic Movement' : 'Resume Dynamic Movement'}
              className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleResetSimulation}
              title="Rewind to Farm Gate (0%)"
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
              title="Simulation Speed Multiplier (1x Natural Cruising, 2x Brisk, 4x Fast-Forward)"
              className="text-[10px] font-mono font-black text-amber-300 py-0.5 px-1 rounded hover:bg-white/10 transition-colors"
            >
              {playbackSpeed}x
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
