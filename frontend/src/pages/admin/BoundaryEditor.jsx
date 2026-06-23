/**
 * Admin Boundary Editor
 * Allows the admin to view and edit the campus map boundary polygon
 * by clicking to add/move points, or entering coordinates manually.
 * Boundary is persisted by the backend and cached locally for offline fallback.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../components/ui/index';
import { DEFAULT_LDCE_BOUNDARY } from '../../constants/campus';
import { getCachedBoundary, loadBoundary, saveBoundary } from '../../services/boundary';
import toast from 'react-hot-toast';

const LDCE_CENTER = [23.0335, 72.5470];

export default function BoundaryEditorPage() {
  const mapRef     = useRef(null);
  const leafletMap = useRef(null);
  const polyRef    = useRef(null);
  const markersRef = useRef([]);

  const [points,   setPoints]   = useState(getCachedBoundary());
  const [mapReady, setMapReady] = useState(false);
  const [mode,     setMode]     = useState('view'); // 'view' | 'add' | 'edit'
  const [editIdx,  setEditIdx]  = useState(null);   // index of point being manually edited
  const [editVal,  setEditVal]  = useState({ lat: '', lng: '' });
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    loadBoundary().then(setPoints);
  }, []);

  // ── Build map once ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    import('leaflet').then(L => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: LDCE_CENTER,
        zoom: 16,
        maxBounds: [[23.025, 72.538], [23.042, 72.558]],
        maxBoundsViscosity: 0.6,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 20,
      }).addTo(map);

      leafletMap.current = map;
      setMapReady(true);
    });

    return () => {
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
    };
  }, []);

  // ── Redraw polygon + markers whenever points change ───────────────────────
  useEffect(() => {
    if (!leafletMap.current || !mapReady) return;
    import('leaflet').then(L => {
      // Save current map view (center and zoom) to prevent auto-panning
      const currentCenter = leafletMap.current.getCenter();
      const currentZoom = leafletMap.current.getZoom();

      // Remove old polygon
      if (polyRef.current) { leafletMap.current.removeLayer(polyRef.current); polyRef.current = null; }
      // Remove old point markers
      markersRef.current.forEach(m => leafletMap.current.removeLayer(m));
      markersRef.current = [];

      if (points.length < 2) return;

      // Draw polygon
      const coords = points.map(p => [p.lat, p.lng]);
      polyRef.current = L.polygon([...coords, coords[0]], {
        color: '#2563eb', weight: 2.5, fillColor: '#3b82f6', fillOpacity: 0.08, dashArray: '6 4',
      }).addTo(leafletMap.current);

      // Draw draggable numbered point markers
      points.forEach((p, i) => {
        const icon = L.divIcon({
          html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:${i === 0 ? '#2563eb' : '#fff'};
            border:2.5px solid #2563eb;
            display:flex;align-items:center;justify-content:center;
            font-size:11px;font-weight:800;
            color:${i === 0 ? '#fff' : '#2563eb'};
            box-shadow:0 2px 8px rgba(37,99,235,0.35);
            cursor:${mode === 'view' ? 'default' : 'move'};
            font-family:Inter,sans-serif;
          ">${i + 1}</div>`,
          className: '', iconSize: [28,28], iconAnchor: [14,14],
        });

        const marker = L.marker([p.lat, p.lng], {
          icon,
          draggable: mode !== 'view',
          zIndexOffset: 1000,
        });

        if (mode !== 'view') {
          marker.on('dragend', (e) => {
            const { lat, lng } = e.target.getLatLng();
            setPoints(prev => {
              const updated = [...prev];
              updated[i] = { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
              return updated;
            });
          });
        }

        // Label tooltip
        marker.bindTooltip(`Point ${i + 1}\n${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`, {
          direction: 'top', offset: [0, -12], className: 'text-xs font-mono',
        });

        marker.addTo(leafletMap.current);
        markersRef.current.push(marker);
      });

      // Click on map to ADD point (only in add mode)
      leafletMap.current.off('click');
      if (mode === 'add') {
        leafletMap.current.on('click', (e) => {
          const { lat, lng } = e.latlng;
          setPoints(prev => [...prev, { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) }]);
        });
      }

      // Restore the map view (center and zoom) to prevent auto-panning when redrawing
      leafletMap.current.setView(currentCenter, currentZoom, { animate: false });
    });
  }, [points, mapReady, mode]);

  const handleSave = async () => {
    if (points.length < 3) { toast.error('Need at least 3 points to define a boundary'); return; }
    try {
      const savedBoundary = await saveBoundary(points);
      setPoints(savedBoundary);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success('Boundary saved! Map picker will use the new boundary.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save boundary');
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset to the default LDCE boundary?')) return;
    try {
      const savedBoundary = await saveBoundary(DEFAULT_LDCE_BOUNDARY);
      setPoints(savedBoundary);
      toast.success('Boundary reset to default LDCE polygon');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset boundary');
    }
  };

  const removePoint = (idx) => {
    if (points.length <= 3) { toast.error('Minimum 3 points required'); return; }
    setPoints(prev => prev.filter((_, i) => i !== idx));
  };

  const startEditPoint = (idx) => {
    setEditIdx(idx);
    setEditVal({ lat: points[idx].lat, lng: points[idx].lng });
  };

  const saveEditPoint = () => {
    const lat = parseFloat(editVal.lat);
    const lng = parseFloat(editVal.lng);
    if (isNaN(lat) || isNaN(lng)) { toast.error('Invalid coordinates'); return; }
    if (lat < 23.0 || lat > 24.0) { toast.error('Latitude seems off for Ahmedabad (expected ~23.03)'); return; }
    if (lng < 72.0 || lng > 73.0) { toast.error('Longitude seems off for Ahmedabad (expected ~72.54)'); return; }
    setPoints(prev => { const u = [...prev]; u[editIdx] = { lat, lng }; return u; });
    setEditIdx(null);
  };

  const movePoint = (idx, dir) => {
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === points.length - 1)) return;
    setPoints(prev => {
      const arr = [...prev];
      [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
      return arr;
    });
  };

  const modeLabel = { view: 'View', add: '+ Add Points', edit: '✏ Edit Points' };

  return (
    <div className="page-enter max-w-5xl">
      <PageHeader
        title="Campus Boundary Editor"
        subtitle="Define the exact polygon that restricts where students can pin complaints"
      />

      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {['view','add','edit'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === m ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
            }`}>
            {modeLabel[m]}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={handleReset}
            className="btn-secondary text-sm py-2">↺ Reset to Default</button>
          <button onClick={handleSave}
            className="btn-primary text-sm py-2">
            {saved ? '✅ Saved!' : '💾 Save Boundary'}
          </button>
        </div>
      </div>

      {/* Mode hint */}
      <AnimatePresence>
        {mode !== 'view' && (
          <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
            className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
              mode === 'add'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
            {mode === 'add'
              ? '🖱 Click anywhere on the map to add a new boundary point'
              : '✋ Drag the numbered markers on the map to reposition points'}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden">
            {!mapReady && (
              <div className="h-[480px] flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <svg className="w-7 h-7 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                  </svg>
                  <span className="text-sm">Loading map…</span>
                </div>
              </div>
            )}
            <div ref={mapRef} style={{ height: 480, display: mapReady ? 'block' : 'none' }} />
          </div>
        </div>

        {/* Points panel */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Boundary Points</h3>
              <span className="badge bg-blue-100 text-blue-700">{points.length} pts</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Blue polygon defines where students can pin complaints. Minimum 3 points required.
              Point 1 (dark blue) is the starting vertex.
            </p>
          </div>

          {/* Point list */}
          <div className="card p-0 overflow-hidden max-h-[340px] overflow-y-auto">
            <div className="divide-y divide-slate-50">
              {points.map((p, i) => (
                <motion.div key={i}
                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: i * 0.04 }}
                  className="px-4 py-3 hover:bg-slate-50/80 transition-colors"
                >
                  {editIdx === i ? (
                    /* Inline edit mode */
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-blue-600">Editing Point {i+1}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold">LAT</label>
                          <input className="input text-xs py-1.5 font-mono"
                            value={editVal.lat}
                            onChange={e => setEditVal(v => ({ ...v, lat: e.target.value }))}
                            placeholder="23.0335" />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold">LNG</label>
                          <input className="input text-xs py-1.5 font-mono"
                            value={editVal.lng}
                            onChange={e => setEditVal(v => ({ ...v, lng: e.target.value }))}
                            placeholder="72.5470" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEditPoint} className="btn-primary text-xs py-1.5 flex-1 justify-center">✓ Save</button>
                        <button onClick={() => setEditIdx(null)} className="btn-secondary text-xs py-1.5 flex-1 justify-center">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* Normal display */
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 ${
                        i === 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-400'
                      }`}>{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-slate-700 leading-tight">
                          {p.lat.toFixed(6)}
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          {p.lng.toFixed(6)}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => movePoint(i, -1)} disabled={i===0}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs disabled:opacity-30">↑</button>
                        <button onClick={() => movePoint(i, 1)} disabled={i===points.length-1}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs disabled:opacity-30">↓</button>
                        <button onClick={() => startEditPoint(i)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs">✏</button>
                        <button onClick={() => removePoint(i)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-red-50 hover:bg-red-100 text-red-500 text-xs">✕</button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Add point manually */}
          <AddPointForm onAdd={(p) => setPoints(prev => [...prev, p])} />
        </div>
      </div>

      {/* Export / import JSON */}
      <div className="card mt-6">
        <h3 className="font-semibold text-slate-800 mb-3">Export / Import Boundary JSON</h3>
        <div className="space-y-3">
          <textarea
            className="input font-mono text-xs min-h-[80px] resize-none"
            value={JSON.stringify(points, null, 2)}
            onChange={e => {
              try {
                const parsed = JSON.parse(e.target.value);
                if (Array.isArray(parsed) && parsed.length >= 3) setPoints(parsed);
              } catch {}
            }}
          />
          <p className="text-xs text-slate-400">
            You can paste coordinates from Google Maps here. Format: <code className="bg-slate-100 px-1 rounded">[{'{'}lat, lng{'}'}, ...]</code>
          </p>
        </div>
      </div>
    </div>
  );
}

function AddPointForm({ onAdd }) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const handle = () => {
    const la = parseFloat(lat), ln = parseFloat(lng);
    if (isNaN(la) || isNaN(ln)) { toast.error('Enter valid numbers'); return; }
    onAdd({ lat: parseFloat(la.toFixed(6)), lng: parseFloat(ln.toFixed(6)) });
    setLat(''); setLng('');
  };

  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-slate-600 mb-2.5">Add Point Manually</p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-[10px] text-slate-400 font-semibold">LATITUDE</label>
          <input className="input text-xs py-1.5 font-mono" placeholder="23.0335"
            value={lat} onChange={e => setLat(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 font-semibold">LONGITUDE</label>
          <input className="input text-xs py-1.5 font-mono" placeholder="72.5470"
            value={lng} onChange={e => setLng(e.target.value)} />
        </div>
      </div>
      <button onClick={handle} className="btn-primary text-xs py-1.5 w-full justify-center">+ Add Point</button>
    </div>
  );
}
