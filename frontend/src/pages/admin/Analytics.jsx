import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import api from '../../services/api';
import { PageHeader, Skeleton } from '../../components/ui/index';
import toast from 'react-hot-toast';

const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CAT_COLORS      = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#6b7280'];
const PRIORITY_COLORS = { Low: '#94a3b8', Medium: '#f59e0b', High: '#f97316', Emergency: '#ef4444' };
// Bug #26 fix: separate status colors used for status pie
const STATUS_COLORS   = { Pending: '#f59e0b', 'In Progress': '#3b82f6', Resolved: '#10b981' };

const TOOLTIP_STYLE = { borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 };

export default function AnalyticsPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Could not load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <PageHeader title="Analytics" subtitle="Complaint trends and insights" />
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    </div>
  );

  const monthlyData  = (data?.monthly || []).map(m => ({
    name: `${MONTHS[m._id.month]} '${String(m._id.year).slice(2)}`,
    complaints: m.count,
  }));

  const categoryData = (data?.byCategory || []).map(c => ({ name: c._id, value: c.count }));
  const priorityData = (data?.byPriority || []).map(p => ({ name: p._id, value: p.count }));
  // Bug #25 #26 fix: use byStatus (now correctly returned from backend)
  const statusData   = (data?.byStatus || []).map(s => ({ name: s._id, value: s.count }));
  const buildingData = (data?.byBuilding || []).slice(0, 5).map(b => ({ name: b._id, count: b.count }));

  const total    = data?.stats?.total    || 0;
  const resolved = data?.stats?.resolved || 0;
  const resRate  = total ? `${Math.round((resolved / total) * 100)}%` : '0%';

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Complaint trends and insights" />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Complaints', value: total,                      bg: 'bg-blue-50 text-blue-700' },
          { label: 'Resolution Rate',  value: resRate,                    bg: 'bg-emerald-50 text-emerald-700' },
          { label: 'Active',           value: (data?.stats?.pending || 0) + (data?.stats?.inProgress || 0), bg: 'bg-amber-50 text-amber-700' },
          { label: 'Active Emergencies', value: data?.stats?.emergency || 0, bg: 'bg-red-50 text-red-700' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-slate-500 text-xs font-medium mb-2">{s.label}</p>
            <p className={`text-2xl font-bold px-3 py-1 rounded-xl inline-block ${s.bg}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly trend — full width */}
        <div className="card md:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-5">Monthly Complaint Trends</h3>
          {monthlyData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">No monthly data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="complaints" stroke="#3b82f6" strokeWidth={2.5}
                  dot={{ r: 5, fill: '#3b82f6' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category pie */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-5">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="45%" outerRadius={85} innerRadius={40}
                dataKey="value" paddingAngle={2}>
                {categoryData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend formatter={v => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bug #26 fix: Status donut now uses correct statusData */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-5">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="45%" outerRadius={85} innerRadius={55}
                dataKey="value" paddingAngle={3}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || CAT_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend formatter={v => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority horizontal bar */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-5">Priority Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priorityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={85} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top buildings bar */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-5">Top 5 Problem Locations</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={buildingData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={100} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
