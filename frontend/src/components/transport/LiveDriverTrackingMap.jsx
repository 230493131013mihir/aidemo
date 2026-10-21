/**
 * LiveDriverTrackingMap.jsx
 * Interactive Real-Time GPS & Highway Telemetry Radar for HarvestMitra AI
 * Tracks driver vehicle location, bearing, speed, ETA, and checkpoints between farm and APMC
 * Supports both Live Browser Geolocation (navigator.geolocation) & Simulated Corridor Highway Stream
 * Technologies: Leaflet, OpenStreetMap, TailwindCSS, Lucide-react
 * HarvestMitra AI
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Truck,
  MapPin,
  Navigation,
  Play,
  Pause,
  RotateCcw,
  Phone,
  Clock,
  ShieldCheck,
  Compass,
  Zap,
  Maximize2,
  Minimize2,
  AlertTriangle,
  LocateFixed
} from 'lucide-react';

// Maharashtra Major Mandi & District Coordinates Catalog
const MAHARASHTRA_COORDINATES = {
  'Nashik': [19.9975, 73.7898],
  'Nashik APMC': [19.9975, 73.7898],
  'Lasalgaon': [20.1477, 74.2259],
  'Lasalgaon APMC': [20.1477, 74.2259],
  'Pune': [18.4975, 73.8647],
  'Pune APMC': [18.4975, 73.8647],
  'Pune APMC (Gultekdi)': [18.4975, 73.8647],
  'Mumbai': [19.0760, 72.9986],
  'Mumbai Vashi Mega APMC': [19.0760, 72.9986],
  'Mumbai APMC': [19.0760, 72.9986],
  'Ahmednagar': [19.0952, 74.7496],
  'Ahmednagar APMC': [19.0952, 74.7496],
  'Kolhapur': [16.7050, 74.2433],
  'Kolhapur APMC': [16.7050, 74.2433],
  'Solapur': [17.6599, 75.9064],
  'Solapur APMC': [17.6599, 75.9064],
  'Jalgaon': [21.0077, 75.5626],
  'Jalgaon APMC': [21.0077, 75.5626],
  'Nagpur': [21.1458, 79.0882],
  'Nagpur APMC': [21.1458, 79.0882],
  'Sangli': [16.8524, 74.5815],
  'Sangli APMC': [16.8524, 74.5815],
  'Satara': [17.6805, 73.9997],
  'Satara APMC': [17.6805, 73.9997],
  'Surat': [21.1702, 72.8311],
  'Surat APMC': [21.1702, 72.8311]
};

// Realistic Highway Corridor GPS Waypoint Chains
const HIGHWAY_CORRIDORS = {
  // Nashik to Mumbai (NH-160 / Kasara Ghat Corridor)
  nashik_mumbai: [
    [19.9975, 73.7898], // Nashik APMC
    [19.8821, 73.6934], // Wadivarhe
    [19.7042, 73.5356], // Igatpuri
    [19.6644, 73.4735], // Kasara Ghat Pass
    [19.5210, 73.3421], // Shahapur Bypass
    [19.3820, 73.2341], // Padgha Toll
    [19.2437, 73.1355], // Kalyan Bypass Junction
    [19.1860, 73.0234], // Airoli Navi Mumbai
    [19.0760, 72.9986]  // Vashi Mega APMC
  ],

  // Pune to Mumbai (Mumbai-Pune Yashwantrao Chavan Expressway)
  pune_mumbai: [
    [18.4975, 73.8647], // Pune Gultekdi APMC
    [18.6298, 73.7997], // Pimpri-Chinchwad
    [18.7180, 73.6740], // Talegaon Toll Plaza
    [18.7557, 73.4091], // Lonavala Khandala Ghat
    [18.9102, 73.2045], // Khalapur Toll Plaza
    [19.0125, 73.1042], // Panvel Expressway Terminal
    [19.0760, 72.9986]  // Vashi Mega APMC
  ],

  // Nashik to Pune (NH-60 Corridor)
  nashik_pune: [
    [19.9975, 73.7898], // Nashik APMC
    [19.7214, 73.8821], // Sinnar Bypass
    [19.3421, 74.0041], // Sangamner
    [19.0215, 73.9512], // Alephata
    [18.8820, 73.9142], // Narayangaon
    [18.7124, 73.8621], // Chakan MIDC
    [18.4975, 73.8647]  // Pune Gultekdi APMC
  ],

  // Ahmednagar to Mumbai (NH-61 / Malshej-Kalyan)
  ahmednagar_mumbai: [
    [19.0952, 74.7496], // Ahmednagar APMC
    [19.1234, 74.3120], // Parner Bypass
    [19.2410, 73.8741], // Otur
    [19.3412, 73.5412], // Malshej Ghat
    [19.2437, 73.1355], // Kalyan Bypass
    [19.0760, 72.9986]  // Vashi Mega APMC
  ]
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

export default function LiveDriverTrackingMap({
  booking = null,
  isExpandedDefault = false,
  className = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const truckMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const coveredPolylineRef = useRef(null);
  const geoWatchIdRef = useRef(null);
  const simTimerRef = useRef(null);

  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
  const [trackingMode, setTrackingMode] = useState('simulated'); // 'simulated' | 'real_gps'
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x | 2x | 4x
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentProgressPct, setCurrentProgressPct] = useState(38); // default ~38% along route
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(58);
  const [currentBearing, setCurrentBearing] = useState(240);
  const [distanceRemainingKm, setDistanceRemainingKm] = useState(32);
  const [etaMinutes, setEtaMinutes] = useState(42);
  const [hasGpsError, setHasGpsError] = useState(false);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState(null);

  // Derive origin & destination names
  const originName = booking?.pickupLocation || booking?.location || 'Nashik Rural Farm #4';
  const destinationName = booking?.destinationMarket || booking?.destination || 'Mumbai Vashi Mega APMC';
  const driverName = booking?.driverName || 'Dnyaneshwar Shinde';
  const driverPhone = booking?.driverPhone || '9822044120';
  const vehicleNumber = booking?.vehicleNumber || 'MH-12-RN-4120';
  const vehicleType = booking?.vehicleType || 'Tata 407 (Agri Freight)';
  const cropInfo = `${booking?.weightKg || 1200} kg ${booking?.cropName || 'Produce'}`;

  // Resolve best matching highway waypoints
  const resolveCorridorWaypoints = useCallback(() => {
    const text = `${originName} ${destinationName}`.toLowerCase();
    if (text.includes('pune') && text.includes('mumbai')) {
      return HIGHWAY_CORRIDORS.pune_mumbai;
    }
    if (text.includes('nashik') && text.includes('pune')) {
      return HIGHWAY_CORRIDORS.nashik_pune;
    }
    if (text.includes('ahmednagar') && text.includes('mumbai')) {
      return HIGHWAY_CORRIDORS.ahmednagar_mumbai;
    }
    // Default to Nashik - Mumbai Highway Corridor
    return HIGHWAY_CORRIDORS.nashik_mumbai;
  }, [originName, destinationName]);

  const waypoints = resolveCorridorWaypoints();
  const originCoords = waypoints[0];
  const destCoords = waypoints[waypoints.length - 1];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(originCoords, 9);

    // OpenStreetMap Clean Carto-Voyager / OSM Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    // Zoom buttons in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // 1. Origin Farm Gate Marker (Amber glowing icon)
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
        <strong style="color: #b45309; font-size: 13px;">🌾 Farm Gate Pickup</strong><br/>
        <strong>Location:</strong> ${originName}<br/>
        <strong>Produce:</strong> ${cropInfo}<br/>
        <span style="color: #059669; font-weight: bold;">Status: Inspected & Loaded</span>
      </div>
    `);

    // 2. Destination APMC Marker (Emerald glowing icon)
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
        <strong>Gate Clearance:</strong> Verified Pass<br/>
        <span style="color: #2563eb; font-weight: bold;">Weighbridge Bay: Active</span>
      </div>
    `);

    // 3. Planned Corridor Route Polyline (dashed emerald/slate)
    const plannedPolyline = L.polyline(waypoints, {
      color: '#059669',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    routePolylineRef.current = plannedPolyline;

    // 4. Covered Route Polyline (solid vibrant green)
    const initialIndex = Math.min(Math.floor((waypoints.length - 1) * 0.38), waypoints.length - 1);
    const coveredPoints = waypoints.slice(0, initialIndex + 1);
    const coveredPolyline = L.polyline(coveredPoints, {
      color: '#10b981',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round'
    }).addTo(map);
    coveredPolylineRef.current = coveredPolyline;

    // 5. Driver Truck Live Marker with Pulse & Heading Rotation
    const initialTruckPos = waypoints[initialIndex] || originCoords;
    const initialHeading = waypoints[initialIndex + 1]
      ? calculateBearing(
          initialTruckPos[0],
          initialTruckPos[1],
          waypoints[initialIndex + 1][0],
          waypoints[initialIndex + 1][1]
        )
      : 240;

    setCurrentBearing(Math.round(initialHeading));

    const truckIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div id="truck-marker-container" style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
          <div style="position: absolute; width: 42px; height: 42px; border-radius: 9999px; background: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 38px; height: 38px; border-radius: 12px; background: #0f172a; border: 2.5px solid #10b981; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); transform: rotate(${initialHeading}deg); transition: transform 0.4s ease;">
            <span style="font-size: 18px;">🚚</span>
          </div>
          <div style="position: absolute; bottom: -8px; background: #059669; color: white; font-family: monospace; font-size: 9px; font-weight: bold; padding: 1px 5px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            58 km/h
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const truckMarker = L.marker(initialTruckPos, { icon: truckIcon, zIndexOffset: 1000 }).addTo(map);
    truckMarker.bindPopup(`
      <div style="font-family: system-ui; padding: 6px; font-size: 12px; line-height: 1.5; min-width: 200px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          <strong style="color: #0f172a; font-size: 13px;">🚚 ${driverName}</strong>
          <span style="background: #dcfce7; color: #166534; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">EN ROUTE</span>
        </div>
        <div><strong>Vehicle:</strong> ${vehicleNumber} (${vehicleType})</div>
        <div><strong>Speed:</strong> <span style="color: #059669; font-weight: bold;">~58 km/h</span></div>
        <div><strong>Tarp Protection:</strong> <span style="color: #059669; font-weight: bold;">Secured ✓</span></div>
        <div style="margin-top: 6px;">
          <a href="tel:${driverPhone}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 11px;">
            📞 Call Driver (+91 ${driverPhone})
          </a>
        </div>
      </div>
    `);

    truckMarkerRef.current = truckMarker;

    // Fit view to include origin, destination, and truck
    const bounds = L.latLngBounds([originCoords, destCoords, initialTruckPos]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [waypoints, originCoords, destCoords, driverName, driverPhone, vehicleNumber, vehicleType, originName, destinationName, cropInfo]);

  // Handle Simulated Vehicle Movement Along Highway Corridor
  useEffect(() => {
    if (trackingMode !== 'simulated' || !isPlaying) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      return;
    }

    const intervalMs = Math.max(400, Math.round(1800 / playbackSpeed));

    simTimerRef.current = setInterval(() => {
      setCurrentStepIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % waypoints.length;
        const currentCoord = waypoints[nextIndex];
        const nextCoord = waypoints[(nextIndex + 1) % waypoints.length];

        // Update bearing
        const newBearing = calculateBearing(
          currentCoord[0],
          currentCoord[1],
          nextCoord[0],
          nextCoord[1]
        );
        setCurrentBearing(Math.round(newBearing));

        // Speed fluctuation (52-64 km/h highway average)
        const speedJitter = 54 + Math.round(Math.sin(nextIndex) * 8);
        setCurrentSpeedKmh(speedJitter);

        // Calculate remaining distance to APMC
        const remainingKm = Math.round(
          getDistanceKm(currentCoord[0], currentCoord[1], destCoords[0], destCoords[1])
        );
        setDistanceRemainingKm(remainingKm);

        // ETA calculation: distance / speed * 60
        const calculatedEta = Math.max(5, Math.round((remainingKm / speedJitter) * 60));
        setEtaMinutes(calculatedEta);

        // Progress percentage
        const progress = Math.round((nextIndex / (waypoints.length - 1)) * 100);
        setCurrentProgressPct(progress);

        // Move Leaflet Truck Marker
        if (truckMarkerRef.current && mapInstanceRef.current) {
          truckMarkerRef.current.setLatLng(currentCoord);

          // Update rotation & speed badge on HTML
          const truckIcon = L.divIcon({
            className: 'custom-map-icon',
            html: `
              <div id="truck-marker-container" style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
                <div style="position: absolute; width: 42px; height: 42px; border-radius: 9999px; background: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="width: 38px; height: 38px; border-radius: 12px; background: #0f172a; border: 2.5px solid #10b981; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); transform: rotate(${Math.round(newBearing)}deg); transition: transform 0.4s ease;">
                  <span style="font-size: 18px;">🚚</span>
                </div>
                <div style="position: absolute; bottom: -8px; background: #059669; color: white; font-family: monospace; font-size: 9px; font-weight: bold; padding: 1px 5px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  ${speedJitter} km/h
                </div>
              </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });
          truckMarkerRef.current.setIcon(truckIcon);
        }

        // Update covered polyline
        if (coveredPolylineRef.current) {
          const covered = waypoints.slice(0, nextIndex + 1);
          coveredPolylineRef.current.setLatLngs(covered);
        }

        return nextIndex;
      });
    }, intervalMs);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [trackingMode, isPlaying, playbackSpeed, waypoints, destCoords]);

  // Handle Real Device Geolocation Streaming (Driver Mode)
  useEffect(() => {
    if (trackingMode !== 'real_gps') {
      if (geoWatchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setHasGpsError(true);
      return;
    }

    setHasGpsError(false);

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading, accuracy } = pos.coords;
        setGpsAccuracyMeters(Math.round(accuracy));

        const latLng = [latitude, longitude];
        const kmh = speed ? Math.round(speed * 3.6) : 56;
        setCurrentSpeedKmh(kmh);

        if (heading !== null && !isNaN(heading)) {
          setCurrentBearing(Math.round(heading));
        }

        // Distance to APMC
        const remaining = Math.round(
          getDistanceKm(latitude, longitude, destCoords[0], destCoords[1])
        );
        setDistanceRemainingKm(remaining);
        setEtaMinutes(Math.max(5, Math.round((remaining / (kmh || 50)) * 60)));

        if (truckMarkerRef.current && mapInstanceRef.current) {
          truckMarkerRef.current.setLatLng(latLng);
          mapInstanceRef.current.panTo(latLng);
        }
      },
      (err) => {
        console.warn('[LiveDriverTrackingMap] Geolocation stream error:', err.message);
        setHasGpsError(true);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );

    return () => {
      if (geoWatchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
    };
  }, [trackingMode, destCoords]);

  // Center on Vehicle Button Action
  const handleCenterOnVehicle = () => {
    if (!mapInstanceRef.current || !truckMarkerRef.current) return;
    const pos = truckMarkerRef.current.getLatLng();
    mapInstanceRef.current.flyTo(pos, 13, { duration: 1.2 });
  };

  // Reset Simulation to Start
  const handleResetSimulation = () => {
    setCurrentStepIndex(0);
    setCurrentProgressPct(0);
    if (truckMarkerRef.current && mapInstanceRef.current) {
      truckMarkerRef.current.setLatLng(originCoords);
      mapInstanceRef.current.flyTo(originCoords, 11, { duration: 1.0 });
    }
    if (coveredPolylineRef.current) {
      coveredPolylineRef.current.setLatLngs([originCoords]);
    }
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border-2 border-emerald-500/30 bg-slate-950 text-white shadow-2xl transition-all duration-300 ${
        isExpanded ? 'h-[580px] sm:h-[640px]' : 'h-[400px] sm:h-[460px]'
      } ${className}`}
    >
      {/* Interactive Leaflet Map Surface */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Glassmorphism Status Bar */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-2">
        <div className="px-3.5 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-xs flex items-center gap-2.5 shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold text-white tracking-wide">
            🛰️ Live Highway Radar
          </span>
          <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
            {trackingMode === 'real_gps' ? 'DEVICE GPS ACTIVE' : 'CORRIDOR TELEMETRY'}
          </span>
        </div>

        {/* Tracking Mode Switcher */}
        <div className="p-1 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-xs flex items-center gap-1 shadow-lg">
          <button
            type="button"
            onClick={() => setTrackingMode('simulated')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
              trackingMode === 'simulated'
                ? 'bg-emerald-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Corridor Stream
          </button>
          <button
            type="button"
            onClick={() => setTrackingMode('real_gps')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors ${
              trackingMode === 'real_gps'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LocateFixed className="w-3 h-3" />
            <span>Driver Phone GPS</span>
          </button>
        </div>
      </div>

      {/* Floating HUD Telemetry Card (Bottom Left) */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-10 sm:max-w-sm rounded-2xl bg-slate-950/92 backdrop-blur-md border border-emerald-500/30 p-3.5 text-xs shadow-2xl space-y-2.5">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-white text-xs leading-none">{driverName}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{vehicleNumber} • {vehicleType}</p>
            </div>
          </div>

          <a
            href={`tel:${driverPhone}`}
            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 shadow transition-colors"
          >
            <Phone className="w-3 h-3" />
            <span>Call Driver</span>
          </a>
        </div>

        {/* 4-Item Telemetry Matrix */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">Speed</span>
            <span className="font-mono font-black text-emerald-400 text-xs">
              {currentSpeedKmh} <span className="text-[9px]">km/h</span>
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">ETA</span>
            <span className="font-mono font-black text-amber-300 text-xs">
              ~{etaMinutes} <span className="text-[9px]">min</span>
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">Distance</span>
            <span className="font-mono font-black text-white text-xs">
              {distanceRemainingKm} <span className="text-[9px]">km</span>
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">Bearing</span>
            <span className="font-mono font-black text-cyan-400 text-xs flex items-center justify-center gap-0.5">
              <Compass className="w-2.5 h-2.5" />
              <span>{currentBearing}°</span>
            </span>
          </div>
        </div>

        {/* Highway Corridor & Cargo Weather Protection Notice */}
        <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1">
          <span className="truncate max-w-[200px] text-slate-400">
            🛣️ Route: {originName.split(' ')[0]} → {destinationName.split(' ')[0]} APMC
          </span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Tarp Secured</span>
          </span>
        </div>

        {/* Geolocation Notice / Error banner if GPS permission denied */}
        {hasGpsError && (
          <div className="p-1.5 rounded bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>GPS access restricted on device. Reverted to Highway Corridor Stream.</span>
          </div>
        )}
      </div>

      {/* Top-Right Floating Controls (Center, Speed, Fullscreen) */}
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
          onClick={() => setIsExpanded((prev) => !prev)}
          title={isExpanded ? 'Collapse Map' : 'Expand Fullscreen Radar'}
          className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-white/15 backdrop-blur-md flex items-center justify-center shadow-lg transition-colors"
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Simulation Play/Pause & Speed Multiplier Controls */}
        {trackingMode === 'simulated' && (
          <div className="rounded-xl bg-slate-900/90 border border-white/15 backdrop-blur-md p-1 flex flex-col items-center gap-1 shadow-lg">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
              className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={handleResetSimulation}
              title="Rewind to Farm Gate"
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
              title="Simulation Speed Multiplier"
              className="text-[10px] font-mono font-bold text-amber-300 py-0.5 px-1 rounded hover:bg-white/10 transition-colors"
            >
              {playbackSpeed}x
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
