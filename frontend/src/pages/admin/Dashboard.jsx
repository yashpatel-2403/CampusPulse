import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../services/api';
import { StatCard, PageHeader, Skeleton, StatusBadge } from '../../components/ui/index';
import toast from 'react-hot-toast';

const MONTHS     = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#6b7280'];

export default function AdminDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Could not load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const monthlyData  = (data?.monthly || []).map(m => ({
    name: `${MONTHS[m._id.month]} '${String(m._id.year).slice(2)}`,
    complaints: m.count,
  }));

  // Bug #25 fix: use byCategory (not byPriority) for the pie on dashboard
  const categoryData = (data?.byCategory || []).map(c => ({ name: c._id, value: c.count }));

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of all campus complaints"
        action={<Link to="/admin/complaints" className="btn-primary">📋 Manage Complaints</Link>}
      />

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total"       value={data?.stats?.total       ?? 0} icon="📋" color="blue"   />
          <StatCard label="Pending"     value={data?.stats?.pending     ?? 0} icon="⏳" color="yellow" />
          <StatCard label="In Progress" value={data?.stats?.inProgress  ?? 0} icon="🔄" color="purple" />
          <StatCard label="Resolved"    value={data?.stats?.resolved    ?? 0} icon="✅" color="green"  />
          <StatCard label="Emergency"   value={data?.stats?.emergency   ?? 0} icon="🚨" color="red"    />
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Complaints per Month</h3>
          {loading ? <Skeleton className="h-48" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Line type="monotone" dataKey="complaints" stroke="#3b82f6" strokeWidth={2}
                  dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Category Distribution</h3>
          {loading ? <Skeleton className="h-48" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent complaints */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Latest Complaints</h3>
            <Link to="/admin/complaints" className="text-xs text-brand-600 font-medium hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {loading
              ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)
              : (data?.recentComplaints || []).map(c => (
                  <Link key={c._id} to={`/admin/complaints/${c._id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 mr-2">
                      <p className="text-sm font-medium text-slate-700 truncate">{c.title}</p>
                      <p className="text-xs text-slate-400">{c.submittedBy?.name} · {c.building}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                ))
            }
          </div>
        </div>

        {/* Emergency complaints */}
        <div className="card border-red-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🚨</span>
            <h3 className="font-semibold text-red-700">Active Emergencies</h3>
          </div>
          <div className="space-y-2">
            {loading
              ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)
              : (data?.emergencyComplaints || []).length === 0
                ? <p className="text-sm text-slate-400 text-center py-4">No active emergencies ✅</p>
                : (data?.emergencyComplaints || []).map(c => (
                    <Link key={c._id} to={`/admin/complaints/${c._id}`}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-red-50 transition-colors border border-red-50">
                      <div className="min-w-0 mr-2">
                        <p className="text-sm font-medium text-slate-700 truncate">{c.title}</p>
                        <p className="text-xs text-slate-400">{c.building} · {c.submittedBy?.name}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </Link>
                  ))
            }
          </div>
        </div>

        {/* Building hotspots — full width */}
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Building Hotspots</h3>
            <Link to="/admin/heatmap" className="text-xs text-brand-600 font-medium hover:underline">View heatmap →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-slate-500 font-medium">#</th>
                  <th className="text-left py-2 text-slate-500 font-medium">Location</th>
                  <th className="text-right py-2 text-slate-500 font-medium">Complaints</th>
                  <th className="text-right py-2 text-slate-500 font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i}><td colSpan={4} className="py-1"><Skeleton className="h-8" /></td></tr>
                    ))
                  : (data?.byBuilding || []).map((b, i) => (
                      <tr key={b._id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2.5 text-slate-400 font-medium pr-3">{i + 1}</td>
                        <td className="py-2.5 font-medium text-slate-700">📍 {b._id}</td>
                        <td className="py-2.5 text-right font-semibold text-slate-800">{b.count}</td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5">
                              <div className="bg-brand-500 h-1.5 rounded-full"
                                style={{ width: `${((b.count / (data?.byBuilding?.[0]?.count || 1)) * 100)}%` }} />
                            </div>
                            <span className="text-slate-400 text-xs w-8 text-right">
                              {data?.stats?.total
                                ? `${((b.count / data.stats.total) * 100).toFixed(1)}%`
                                : '—'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
