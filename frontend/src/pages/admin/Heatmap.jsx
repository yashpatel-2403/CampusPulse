import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';
import { PageHeader, Skeleton } from '../../components/ui/index';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getCachedBoundary, loadBoundary } from '../../services/boundary';
import toast from 'react-hot-toast';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PRIORITY_COLORS = {
  Emergency: { fill: '#ef4444', glow: 'rgba(239,68,68,',   ring: '#fca5a5' },
  High:      { fill: '#f97316', glow: 'rgba(249,115,22,',  ring: '#fdba74' },
  Medium:    { fill: '#f59e0b', glow: 'rgba(245,158,11,',  ring: '#fcd34d' },
  Low:       { fill: '#10b981', glow: 'rgba(16,185,129,',  ring: '#6ee7b7' },
};

const PRIORITY_ORDER = ['Emergency','High','Medium','Low'];

function dominantPriority(group) {
  for (const p of PRIORITY_ORDER) {
    if (group.some(c => c.priority === p)) return p;
  }
  return 'Low';
}

function clusterPoints(complaints, threshold = 0.00040) {
  const clusters = [];
  const used = new Set();
  complaints.forEach((c, i) => {
    if (used.has(i) || !c.coordinates?.lat) return;
    const group = [c];
    used.add(i);
    complaints.forEach((d, j) => {
      if (used.has(j) || !d.coordinates?.lat) return;
      const dlat = Math.abs(c.coordinates.lat - d.coordinates.lat);
      const dlng = Math.abs(c.coordinates.lng - d.coordinates.lng);
      if (dlat < threshold && dlng < threshold) { group.push(d); used.add(j); }
    });
    clusters.push(group);
  });
  return clusters;
}

function createHeatIcon(priority, count) {
  const c    = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Low;
  const base = Math.min(60, 30 + count * 6);
  const mid  = Math.round(base * 0.55);
  const inner= Math.round(base * 0.30);
  const delay= (Math.random() * 2).toFixed(2);
  return L.divIcon({
    html: `<div style="width:${base}px;height:${base}px;position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;inset:0;border-radius:50%;
        background:radial-gradient(circle,${c.glow}0.18) 0%,${c.glow}0) 70%);
        animation:heatPulse ${2.5+Math.random()}s ease-in-out infinite;animation-delay:${delay}s;"></div>
      <div style="position:absolute;width:${mid}px;height:${mid}px;border-radius:50%;
        background:radial-gradient(circle,${c.glow}0.42) 0%,${c.glow}0.08) 100%);
        animation:heatPulse ${2+Math.random()*0.5}s ease-in-out infinite;animation-delay:${delay}s;"></div>
      <div style="position:absolute;width:${inner}px;height:${inner}px;border-radius:50%;
        background:radial-gradient(circle at 35% 35%,${c.fill}ff 0%,${c.fill}cc 60%,${c.fill}88 100%);
        box-shadow:0 0 ${inner*0.6}px ${c.glow}0.8),0 0 ${inner*1.2}px ${c.glow}0.4),inset 0 1px 2px rgba(255,255,255,0.4);"></div>
      ${count > 1 ? `<div style="position:absolute;top:-4px;right:-4px;width:18px;height:18px;
        background:${c.fill};border:2px solid white;border-radius:50%;display:flex;
        align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white;
        box-shadow:0 2px 6px ${c.glow}0.5);font-family:Inter,sans-serif;z-index:10;">
        ${count > 9 ? '9+' : count}</div>` : ''}
    </div>`,
    className: '',
    iconSize:   [base, base],
    iconAnchor: [base/2, base/2],
  });
}

// Canvas radial heat blur layer - uses map pixel coordinates so heat stays on geographic locations
function CanvasHeatLayer({ complaints }) {
  const map = useMap();
  useEffect(() => {
    if (!complaints.length) return;
    const pts = complaints.filter(c => c.coordinates?.lat && c.coordinates?.lng);
    
    const canvas = L.DomUtil.create('canvas');
    canvas.style.cssText='position:absolute;top:0;left:0;pointer-events:none;';
    map.getPane('overlayPane').appendChild(canvas);

    const draw = () => {
      const sz = map.getSize();
      canvas.width  = sz.x; 
      canvas.height = sz.y;
      canvas.style.width = sz.x+'px'; 
      canvas.style.height = sz.y+'px';
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, sz.x, sz.y);
      
      // Get pixel bounds of current map view
      const pixelBounds = map.getPixelBounds();
      const topLeft = pixelBounds.min;
      
      pts.forEach(c => {
        // Convert lat/lng to map pixel coordinates (these are stable across pans/zooms at same zoom level)
        const latLng = L.latLng(c.coordinates.lat, c.coordinates.lng);
        const pixelPoint = map.project(latLng);
        
        // Convert map pixel coords to canvas coords relative to current view
        const canvasX = pixelPoint.x - topLeft.x;
        const canvasY = pixelPoint.y - topLeft.y;
        
        // Only draw if point is within canvas bounds (prevents drawing off-screen)
        if (canvasX < -100 || canvasX > sz.x + 100 || canvasY < -100 || canvasY > sz.y + 100) return;
        
        const r  = { Emergency:75, High:58, Medium:44, Low:32 }[c.priority] || 36;
        const cols = {
          Emergency:['rgba(239,68,68,0.55)','rgba(239,68,68,0.18)','rgba(239,68,68,0)'],
          High:     ['rgba(249,115,22,0.48)','rgba(249,115,22,0.15)','rgba(249,115,22,0)'],
          Medium:   ['rgba(245,158,11,0.42)','rgba(245,158,11,0.13)','rgba(245,158,11,0)'],
          Low:      ['rgba(16,185,129,0.35)','rgba(16,185,129,0.10)','rgba(16,185,129,0)'],
        }[c.priority]||['rgba(16,185,129,0.35)','rgba(16,185,129,0.10)','rgba(16,185,129,0)'];
        
        const g = ctx.createRadialGradient(canvasX, canvasY, 0, canvasX, canvasY, r);
        g.addColorStop(0, cols[0]); 
        g.addColorStop(0.5, cols[1]); 
        g.addColorStop(1, cols[2]);
        
        ctx.beginPath(); 
        ctx.arc(canvasX, canvasY, r, 0, Math.PI*2); 
        ctx.fillStyle = g; 
        ctx.fill();
      });
    };
    
    draw();
    
    // Redraw on move, zoom, and resize - heat stays in same geographic location
    map.on('move zoom resize', draw);
    
    return () => { 
      map.off('move zoom resize', draw);
      if(canvas.parentNode) canvas.parentNode.removeChild(canvas); 
    };
  }, [map, complaints]);
  return null;
}

// Draw campus boundary polygon on map
function BoundaryLayer({ boundary }) {
  const map = useMap();
  useEffect(() => {
    if (!boundary || boundary.length < 3) return;
    const coords = boundary.map(p => [p.lat, p.lng]);
    const poly = L.polygon(coords, {
      color:'#2563eb', weight:2, fillColor:'#3b82f6', fillOpacity:0.05, dashArray:'6 4',
    }).addTo(map).bindTooltip('LDCE Campus Boundary',{ sticky:false, className:'text-xs font-medium' });
    return () => map.removeLayer(poly);
  },[map,boundary]);
  return null;
}

const FILTER_OPTIONS = ['all','Emergency','High','Medium','Low','Pending','In Progress','Resolved'];

// Compute campus center from boundary
function boundaryCenter(boundary) {
  if (!boundary || boundary.length === 0) return [23.0335, 72.5470];
  const lat = boundary.reduce((s,p)=>s+p.lat,0)/boundary.length;
  const lng = boundary.reduce((s,p)=>s+p.lng,0)/boundary.length;
  return [lat, lng];
}

export default function HeatmapPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [showHeat,   setShowHeat]   = useState(true);
  const [showPins,   setShowPins]   = useState(true);
  const [boundary, setBoundary] = useState(getCachedBoundary());

  useEffect(() => {
    Promise.all([api.get('/admin/heatmap'), loadBoundary()])
      .then(([{ data }, savedBoundary]) => {
        setComplaints(data.complaints || []);
        setBoundary(savedBoundary);
      })
      .catch(() => toast.error('Could not load heatmap data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered     = filter === 'all' ? complaints
    : complaints.filter(c => c.priority === filter || c.status === filter);
  const withCoords   = filtered.filter(c => c.coordinates?.lat && c.coordinates?.lng);
  const clusters     = clusterPoints(withCoords);
  const center       = boundaryCenter(boundary);

  const buildingMap  = complaints.reduce((acc,c) => { acc[c.building]=(acc[c.building]||0)+1; return acc; },{});
  const buildingRank = Object.entries(buildingMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const maxCount     = buildingRank[0]?.[1] || 1;

  const priorityCount = PRIORITY_ORDER.reduce((acc,p)=>{
    acc[p]=complaints.filter(c=>c.priority===p).length; return acc;
  },{});

  return (
    <div className="page-enter">
      <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Campus Heatmap</h1>
          <p className="text-slate-500 text-sm mt-1">Complaint density across LDCE campus</p>
        </div>
        <Link to="/admin/boundary"
          className="btn-secondary text-sm py-2 flex items-center gap-2">
          📐 Edit Boundary
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-0 overflow-hidden">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
              <div className="flex gap-1.5 flex-wrap flex-1">
                {FILTER_OPTIONS.map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      filter===f ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                    {f === 'all' ? '🌐 All' : f}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={showHeat} onChange={e=>setShowHeat(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-blue-600" />
                  Heat layer
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={showPins} onChange={e=>setShowPins(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-blue-600" />
                  Pins
                </label>
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-[500px] rounded-none" />
            ) : (
              <div style={{ height: 500 }}>
                <MapContainer
                  center={center}
                  zoom={17}
                  style={{ height:'100%', width:'100%' }}
                  // Use boundary as max bounds - restrict to college area only
                  maxBounds={boundary && boundary.length >= 3 ? [
                    [Math.min(...boundary.map(p => p.lat)), Math.min(...boundary.map(p => p.lng))],
                    [Math.max(...boundary.map(p => p.lat)), Math.max(...boundary.map(p => p.lng))]
                  ] : [[center[0]-0.02, center[1]-0.02],[center[0]+0.02, center[1]+0.02]]}
                  maxBoundsViscosity={1.0}
                  minZoom={16}
                  maxZoom={19}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a>'
                  />

                  {/* Admin-configurable campus boundary */}
                  <BoundaryLayer boundary={boundary} />

                  {/* Canvas radial heat blobs */}
                  {showHeat && <CanvasHeatLayer complaints={withCoords} />}

                  {/* Clustered Snapchat-style pins */}
                  {showPins && clusters.map((group, gi) => {
                    const priority = dominantPriority(group);
                    const avgLat   = group.reduce((s,c)=>s+c.coordinates.lat,0)/group.length;
                    const avgLng   = group.reduce((s,c)=>s+c.coordinates.lng,0)/group.length;
                    const repr     = group[0];
                    return (
                      <Marker key={gi} position={[avgLat,avgLng]} icon={createHeatIcon(priority,group.length)}>
                        <Popup>
                          <div className="text-sm min-w-[190px] p-3">
                            <p className="font-bold text-slate-800 mb-2">
                              {group.length>1 ? `${group.length} complaints` : repr.title}
                            </p>
                            {group.length===1 ? (
                              <>
                                <p className="text-slate-500 text-xs mb-2">📍 {repr.building}</p>
                                <div className="flex gap-1.5 flex-wrap">
                                  <span style={{background:PRIORITY_COLORS[repr.priority]?.fill+'22',color:PRIORITY_COLORS[repr.priority]?.fill,padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700}}>{repr.priority}</span>
                                  <span style={{background:'#f1f5f9',color:'#475569',padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700}}>{repr.status}</span>
                                </div>
                              </>
                            ):(
                              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                {group.slice(0,5).map((c,i)=>(
                                  <div key={i} className="text-xs text-slate-600 flex gap-2">
                                    <span style={{color:PRIORITY_COLORS[c.priority]?.fill,fontWeight:700}}>●</span>
                                    <span className="truncate">{c.title}</span>
                                  </div>
                                ))}
                                {group.length>5 && <p className="text-xs text-slate-400">+{group.length-5} more</p>}
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            )}

            <div className="px-4 py-2.5 border-t border-slate-50 flex items-center gap-4 text-xs text-slate-400">
              <span>{withCoords.length} location{withCoords.length!==1?'s':''} shown</span>
              <span>·</span>
              <span>{clusters.length} cluster{clusters.length!==1?'s':''}</span>
              <span className="ml-auto">LD College of Engineering, Ahmedabad</span>
            </div>
          </div>

          {/* Legend */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Heat intensity legend</p>
            <div className="flex gap-5 flex-wrap">
              {PRIORITY_ORDER.map(p => {
                const c = PRIORITY_COLORS[p];
                return (
                  <div key={p} className="flex items-center gap-2.5">
                    <div className="relative w-7 h-7 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full" style={{background:`radial-gradient(circle,${c.fill}44 0%,${c.fill}00 100%)`}} />
                      <div className="w-3 h-3 rounded-full shadow" style={{background:c.fill}} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{p}</p>
                      <p className="text-[10px] text-slate-400">{priorityCount[p]} complaints</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          {/* Priority breakdown */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">Priority Breakdown</h3>
            <div className="space-y-3">
              {PRIORITY_ORDER.map(p => {
                const cnt   = priorityCount[p]||0;
                const total = complaints.length||1;
                const pct   = Math.round((cnt/total)*100);
                const c     = PRIORITY_COLORS[p];
                return (
                  <div key={p}>
                    <div className="flex justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{background:c.fill}} />
                        <span className="text-sm font-medium text-slate-700">{p}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800">{cnt}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <motion.div
                        initial={{width:0}} animate={{width:`${pct}%`}}
                        transition={{duration:0.8,delay:0.1,ease:'easeOut'}}
                        className="h-1.5 rounded-full"
                        style={{background:`linear-gradient(90deg,${c.fill},${c.ring})`}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Building hotspot ranking */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">🏆 Hotspot Ranking</h3>
              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{buildingRank.length} locations</span>
            </div>
            {loading ? (
              <div className="space-y-2">{[...Array(6)].map((_,i)=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>
            ) : buildingRank.length===0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No data yet</p>
            ) : (
              <div className="space-y-2">
                {buildingRank.map(([building,count],i)=>{
                  const pct=Math.round((count/maxCount)*100);
                  const medals=['🥇','🥈','🥉'];
                  return (
                    <motion.div key={building}
                      initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${i<3?'text-base':'bg-slate-100 text-slate-500'}`}>
                        {i<3?medals[i]:i+1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{building}</p>
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                          <motion.div initial={{width:0}} animate={{width:`${pct}%`}}
                            transition={{duration:0.7,delay:0.2+i*0.05,ease:'easeOut'}}
                            className="bg-blue-500 h-1 rounded-full" />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-800 flex-shrink-0 w-6 text-right">{count}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status summary */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">Status Summary</h3>
            <div className="space-y-2">
              {[
                {label:'Pending',    color:'#f59e0b', bg:'#fef3c7'},
                {label:'In Progress',color:'#3b82f6', bg:'#dbeafe'},
                {label:'Resolved',   color:'#10b981', bg:'#d1fae5'},
              ].map(s=>{
                const cnt=complaints.filter(c=>c.status===s.label).length;
                return (
                  <div key={s.label} className="flex items-center justify-between p-2.5 rounded-xl"
                    style={{background:s.bg+'66'}}>
                    <span className="text-sm font-medium" style={{color:s.color}}>{s.label}</span>
                    <span className="text-sm font-bold" style={{color:s.color}}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
