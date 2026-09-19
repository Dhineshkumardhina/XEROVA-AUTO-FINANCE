import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Vehicle {
  id: number;
  plate: string;
  name: string;
  owner: string;
  lat: number;
  lng: number;
  speed: string;
  status: string;
  area: string;
  phone?: string;
  geofence?: string;
}

interface InteractiveWebMapProps {
  lat: number;
  lng: number;
  zoom: number;
  vehicles: Vehicle[];
  selectedVehicleId: number | null;
  onSelectVehicle: (id: number) => void;
  userLocation?: { lat: number; lng: number } | null;
  onLocateMe?: () => void;
  isLocating?: boolean;
}

const TILE_LAYERS = {
  street: {
    name: "🗺️ Street Map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OSM</a>"
  },
  satellite: {
    name: "🛰️ Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
  }
};

type LayerKey = keyof typeof TILE_LAYERS;

export const InteractiveWebMap: React.FC<InteractiveWebMapProps> = ({
  lat,
  lng,
  zoom,
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  userLocation,
  onLocateMe,
  isLocating = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const [activeLayer, setActiveLayer] = useState<LayerKey>("street");
  const [internalLocate, setInternalLocate] = useState(false);
  const [localUserPos, setLocalUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const effectiveUserPos = userLocation || localUserPos;
  const loadingLocate = isLocating || internalLocate;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet map instance
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: zoom,
      zoomControl: false,
      attributionControl: true
    });

    mapInstanceRef.current = map;

    // Add initial tile layer
    const layerInfo = TILE_LAYERS[activeLayer];
    const tile = L.tileLayer(layerInfo.url, {
      attribution: layerInfo.attribution,
      maxZoom: 20
    }).addTo(map);
    tileLayerRef.current = tile;

    // Add custom zoom control in top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Layer changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const layerInfo = TILE_LAYERS[activeLayer];
    const newTile = L.tileLayer(layerInfo.url, {
      attribution: layerInfo.attribution,
      maxZoom: 20
    }).addTo(map);
    tileLayerRef.current = newTile;
  }, [activeLayer]);

  // Handle center / zoom changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([lat, lng], zoom, { animate: true, duration: 0.8 });
  }, [lat, lng, zoom]);

  // Handle User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (userCircleRef.current) {
      map.removeLayer(userCircleRef.current);
      userCircleRef.current = null;
    }

    if (effectiveUserPos) {
      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; items-align: center; justify-content: center; cursor: pointer;">
            <span style="position: absolute; top: -4px; left: 50%; transform: translateX(-50%); width: 44px; height: 44px; border-radius: 50%; background: rgba(59, 130, 246, 0.6); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <div style="width: 36px; height: 36px; background: #2563eb; border: 3px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6); z-index: 10; margin: 0 auto;">
              <span style="font-size: 18px;">📍</span>
            </div>
            <div style="background: #1d4ed8; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-size: 9.5px; font-weight: bold; white-space: nowrap; margin-top: 4px; border: 1px solid #93c5fd; box-shadow: 0 2px 6px rgba(0,0,0,0.6); text-align: center; z-index: 10;">
              YOUR LIVE DEVICE (AGENCY GPS)
            </div>
          </div>
        `,
        iconSize: [90, 60],
        iconAnchor: [45, 30]
      });

      const userMarker = L.marker([effectiveUserPos.lat, effectiveUserPos.lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map);

      userMarker.bindPopup(`
        <div style="font-family: sans-serif; color: #0f172a; min-width: 170px;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #2563eb;">📍 Active Device Telemetry</h4>
          <p style="margin: 2px 0; font-size: 11px;"><strong>Status:</strong> Live GPS Locked</p>
          <p style="margin: 2px 0; font-size: 11px;"><strong>Coordinates:</strong> ${effectiveUserPos.lat.toFixed(5)}, ${effectiveUserPos.lng.toFixed(5)}</p>
          <p style="margin: 6px 0 0 0; font-size: 10px; color: #16a34a; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 4px;">✓ Geolocation Stream Active</p>
        </div>
      `);

      userMarkerRef.current = userMarker;

      const userCircle = L.circle([effectiveUserPos.lat, effectiveUserPos.lng], {
        radius: 200,
        color: "#3b82f6",
        weight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.2
      }).addTo(map);
      userCircleRef.current = userCircle;
    }
  }, [effectiveUserPos]);

  // Update Markers and Geofence Circle when vehicles or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    // Add new markers for all vehicles
    vehicles.forEach(v => {
      const isSelected = v.id === selectedVehicleId;
      const isMoving = v.status === "MOVING";

      const icon = L.divIcon({
        className: "custom-web-marker",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; items-align: center; justify-content: center; transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'}; transition: all 0.2s; cursor: pointer;">
            ${isSelected ? '<span style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 36px; height: 36px; border-radius: 50%; background: rgba(99, 102, 241, 0.6); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>' : ''}
            <div style="width: ${isSelected ? '36px' : '28px'}; height: ${isSelected ? '36px' : '28px'}; background: ${isMoving ? '#10b981' : '#f59e0b'}; border: ${isSelected ? '3px solid #6366f1' : '2px solid #ffffff'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5); z-index: 2; margin: 0 auto;">
              <span style="font-size: ${isSelected ? '18px' : '14px'};">${isMoving ? '🚗' : '🅿️'}</span>
            </div>
            <div style="background: ${isSelected ? '#4f46e5' : '#0f172a'}; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: ${isSelected ? '10px' : '8.5px'}; font-weight: bold; white-space: nowrap; margin-top: 4px; border: 1px solid #334155; box-shadow: 0 2px 4px rgba(0,0,0,0.5); text-align: center; z-index: 2;">
              ${v.plate} • ${v.speed}
            </div>
          </div>
        `,
        iconSize: [80, 55],
        iconAnchor: [40, 27]
      });

      const marker = L.marker([v.lat, v.lng], { icon })
        .addTo(map)
        .on("click", () => {
          onSelectVehicle(v.id);
        });

      // Bind a nice popup
      marker.bindPopup(`
        <div style="font-family: sans-serif; color: #0f172a; min-width: 180px;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #4f46e5;">${v.name}</h4>
          <p style="margin: 2px 0; font-size: 11px;"><strong>Plate:</strong> ${v.plate}</p>
          <p style="margin: 2px 0; font-size: 11px;"><strong>Borrower:</strong> ${v.owner}</p>
          <p style="margin: 2px 0; font-size: 11px;"><strong>Status:</strong> <span style="color: ${isMoving ? '#10b981' : '#d97706'}; font-weight: bold;">${v.status} (${v.speed})</span></p>
          <p style="margin: 2px 0; font-size: 11px;"><strong>Location:</strong> ${v.area}</p>
          <p style="margin: 6px 0 0 0; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px;">GPS Coordinates: ${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}</p>
        </div>
      `);

      if (isSelected) {
        marker.openPopup();
        // Add Geofence circle around selected vehicle
        circleRef.current = L.circle([v.lat, v.lng], {
          radius: 600, // 600 meters geofence radius
          color: "#6366f1",
          weight: 2,
          dashArray: "4, 6",
          fillColor: "#6366f1",
          fillOpacity: 0.15
        }).addTo(map);
      }

      markersRef.current.push(marker);
    });
  }, [vehicles, selectedVehicleId]);

  const handleTriggerLocate = () => {
    if (onLocateMe) {
      onLocateMe();
      return;
    }
    // Fallback geolocation if parent didn't pass handler
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setInternalLocate(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocalUserPos(coords);
        setInternalLocate(false);
        const map = mapInstanceRef.current;
        if (map) {
          map.setView([coords.lat, coords.lng], 16, { animate: true });
        }
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setInternalLocate(false);
        alert("Unable to retrieve live device location. Using default Vellore coordinates.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl flex flex-col bg-slate-950">
      {/* Leaflet DOM Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" style={{ minHeight: "100%" }} />

      {/* Top Overlay Bar */}
      <div className="z-10 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap gap-2 justify-between items-center select-none font-mono text-[10px] text-white">
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-indigo-400 font-bold uppercase tracking-wider text-sm">XEROVA WEB LOCATOR COCKPIT</span>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[9px] font-bold">
            LIVE_DOM_RENDERED
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Locate Me Button */}
          <button
            type="button"
            onClick={handleTriggerLocate}
            disabled={loadingLocate}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg border border-blue-400/30 uppercase text-[10px] flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <span className="text-sm">🎯</span>
            {loadingLocate ? "Acquiring GPS..." : "Locate My Device"}
          </button>

          {/* Map Layer Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[9px] uppercase font-bold mr-1 pl-1">Base Layer:</span>
            {(Object.keys(TILE_LAYERS) as LayerKey[]).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveLayer(key)}
                className={`px-2.5 py-1 rounded font-bold text-[9px] uppercase cursor-pointer transition-all ${
                  activeLayer === key
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {TILE_LAYERS[key].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center Geofence Status Overlay Badge (if vehicle selected) */}
      {selectedVehicleId && (
        <div className="absolute top-16 left-4 z-10 pointer-events-none">
          <div className="bg-slate-950/90 backdrop-blur-md border border-indigo-500/40 p-3 rounded-xl shadow-2xl text-white font-mono space-y-1 max-w-sm">
            <div className="flex items-center justify-between text-[10px] text-indigo-400 font-bold uppercase">
              <span>ACTIVE GEOFENCE TRACKER</span>
              <span className="text-emerald-400">600M ZONE</span>
            </div>
            <p className="text-xs font-sans font-bold text-slate-100">
              {vehicles.find(v => v.id === selectedVehicleId)?.name} ({vehicles.find(v => v.id === selectedVehicleId)?.plate})
            </p>
            <div className="text-[10px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Status: <b className="text-amber-400">{vehicles.find(v => v.id === selectedVehicleId)?.status}</b></span>
              <span>Speed: <b>{vehicles.find(v => v.id === selectedVehicleId)?.speed}</b></span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Overlay Info Footer */}
      <div className="z-10 mt-auto bg-slate-950/85 backdrop-blur-md border-t border-slate-800/80 px-4 py-2 text-[10px] text-slate-300 font-mono flex flex-wrap gap-2 justify-between items-center select-none">
        <div className="flex items-center gap-4">
          <span>CENTER: <strong className="text-white">[{lat.toFixed(4)}, {lng.toFixed(4)}]</strong></span>
          <span>ACTIVE COLLATERAL NODES: <strong className="text-indigo-400">{vehicles.length}</strong></span>
          {effectiveUserPos && (
            <span className="text-blue-400 font-bold">| 📍 DEVICE GPS LOCKED: [{effectiveUserPos.lat.toFixed(4)}, {effectiveUserPos.lng.toFixed(4)}]</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Click any vehicle badge on map to inspect KYC & GPS telemetry</span>
        </div>
      </div>
    </div>
  );
};
