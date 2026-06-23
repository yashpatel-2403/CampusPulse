/**
 * CampusMapPicker — Interactive Leaflet map locked to LD College of Engineering, Ahmedabad.
 * Boundary is loaded from the backend (admin-configurable) with a localStorage cache fallback.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LD_BUILDINGS } from '../../constants/campus';
import { getCachedBoundary } from '../../services/boundary';

const LDCE_CENTER = [23.0335, 72.5470];

function dist(a, b) {
  return Math.sqrt((a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2);
}
function nearestBuilding(lat, lng) {
  return LD_BUILDINGS.reduce(
    (best, b) => dist({ lat, lng }, b) < dist({ lat, lng }, best) ? b : best,
    LD_BUILDINGS[0]
  );
}

// Ray-casting point-in-polygon — works for any convex or concave polygon
function pointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = (yi > lng) !== (yj > lng) &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function makePinIcon(L) {
  return L.divIcon({
    html: `<div class="pin-drop" style="
      width:22px;height:22px;border-radius:50% 50% 50% 0;
      background:linear-gradient(135deg,#ef4444,#dc2626);
      border:3px solid white;
      box-shadow:0 3px 10px rgba(220,38,38,0.5);
      transform:rotate(-45deg)
    "></div>`,
    className: '', iconSize: [22, 22], iconAnchor: [11, 22],
  });
}

export default function CampusMapPicker({ onSelect, initialLat, initialLng, boundary }) {
  const mapRef     = useRef(null);
  const leafletMap = useRef(null);
  const markerRef  = useRef(null);
  const polyRef    = useRef(null);

  // Use passed boundary prop → cached localStorage fallback → default
  const activeBoundary = (boundary && boundary.length >= 3) ? boundary : getCachedBoundary();

  const [selected,    setSelected]    = useState(
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng, building: nearestBuilding(initialLat, initialLng).name }
      : null
  );
  const [outOfBounds, setOutOfBounds] = useState(false);
  const [mapReady,    setMapReady]    = useState(false);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      import('leaflet').then(L => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const map = L.map(mapRef.current, {
          center: LDCE_CENTER,
          zoom: 17,
          maxBounds: [[23.0295, 72.5425], [23.0375, 72.5515]],
          maxBoundsViscosity: 0.9,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap', maxZoom: 20,
        }).addTo(map);

        // Campus boundary polygon
        const polyCoords = activeBoundary.map(p => [p.lat, p.lng]);
        polyRef.current = L.polygon(polyCoords, {
          color: '#2563eb', weight: 2.5, fillColor: '#3b82f6',
          fillOpacity: 0.06, dashArray: '6 4',
        }).addTo(map).bindTooltip('LDCE Campus Boundary', {
          sticky: false, className: 'text-xs font-medium',
        });

        // Small building dots
        const dotIcon = L.divIcon({
          html: `<div style="width:7px;height:7px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
          className: '', iconSize: [7, 7], iconAnchor: [3.5, 3.5],
        });
        LD_BUILDINGS.forEach(b => {
          L.marker([b.lat, b.lng], { icon: dotIcon }).addTo(map)
            .bindTooltip(b.name, { direction: 'top', offset: [0, -5], className: 'text-xs font-semibold' });
        });

        // Restore initial marker
        if (initialLat && initialLng) {
          markerRef.current = L.marker([initialLat, initialLng], { icon: makePinIcon(L) }).addTo(map);
        }

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          if (!pointInPolygon(lat, lng, activeBoundary)) {
            setOutOfBounds(true);
            setTimeout(() => setOutOfBounds(false), 2500);
            return;
          }
          setOutOfBounds(false);
          const nearest = nearestBuilding(lat, lng);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { icon: makePinIcon(L) }).addTo(map);
          }
          const info = { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)), building: nearest.name };
          setSelected(info);
          if (onSelect) onSelect(info);
        });

        leafletMap.current = map;
        setMapReady(true);
      });
    }
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markerRef.current = null;
        polyRef.current   = null;
      }
    };
  }, []);

  // Redraw polygon when boundary prop changes
  useEffect(() => {
    if (!leafletMap.current || !polyRef.current) return;
    import('leaflet').then(L => {
      if (polyRef.current) leafletMap.current.removeLayer(polyRef.current);
      const coords = activeBoundary.map(p => [p.lat, p.lng]);
      polyRef.current = L.polygon(coords, {
        color: '#2563eb', weight: 2.5, fillColor: '#3b82f6', fillOpacity: 0.06, dashArray: '6 4',
      }).addTo(leafletMap.current);
    });
  }, [boundary]);

  const handleClear = () => {
    if (markerRef.current && leafletMap.current) {
      leafletMap.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setSelected(null);
    if (onSelect) onSelect(null);
  };

  const jumpToBuilding = (b) => {
    if (!leafletMap.current) return;
    import('leaflet').then(L => {
      leafletMap.current.setView([b.lat, b.lng], 18);
      if (markerRef.current) {
        markerRef.current.setLatLng([b.lat, b.lng]);
      } else {
        markerRef.current = L.marker([b.lat, b.lng], { icon: makePinIcon(L) }).addTo(leafletMap.current);
      }
      const info = { lat: b.lat, lng: b.lng, building: b.name };
      setSelected(info);
      if (onSelect) onSelect(info);
    });
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden border border-slate-200" style={{ height: 320 }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

        {!mapReady && (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <svg className="w-6 h-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
              </svg>
              <span className="text-xs font-medium">Loading LDCE campus map…</span>
            </div>
          </div>
        )}

        {mapReady && !selected && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
            <div className="glass rounded-xl px-3 py-2 text-xs text-slate-700 font-medium shadow-lg whitespace-nowrap flex items-center gap-1.5">
              📍 Click inside the blue boundary to pin your location
            </div>
          </div>
        )}

        <AnimatePresence>
          {outOfBounds && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[999] pointer-events-none"
            >
              <div className="bg-red-500 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-lg flex items-center gap-2 whitespace-nowrap">
                🚫 Please click inside the LDCE campus boundary
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected location */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3"
          >
            <div>
              <p className="text-xs text-blue-500 font-medium mb-0.5">Pinned location</p>
              <p className="text-sm font-semibold text-blue-800">📍 {selected.building}</p>
              <p className="text-xs text-blue-400 font-mono mt-0.5">{selected.lat}, {selected.lng}</p>
            </div>
            <button onClick={handleClear}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 text-sm transition-colors">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick-jump building chips */}
      <div>
        <p className="text-xs text-slate-400 mb-1.5">Quick jump to building:</p>
        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
          {LD_BUILDINGS.map(b => (
            <button key={b.name} type="button" onClick={() => jumpToBuilding(b)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                selected?.building === b.name
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}>
              {b.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
