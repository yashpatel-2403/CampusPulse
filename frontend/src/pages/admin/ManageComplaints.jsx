import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { PageHeader, Skeleton, EmptyState, Select, StatusBadge, PriorityBadge } from '../../components/ui/index';

const CATEGORIES = ['','Electrical','Plumbing','WiFi','Hostel','Cleanliness','Furniture','Security','Classroom','Laboratory','Other'];
const STATUSES   = ['','Pending','In Progress','Resolved'];
const PRIORITIES = ['','Low','Medium','High','Emergency'];

export default function ManageComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [filters,    setFilters]    = useState({ status:'', category:'', priority:'', search:'', sort:'-createdAt' });
  const [searchInput, setSearchInput] = useState('');
  const searchTimeoutRef = useRef(null);

  const fetchComplaints = useCallback(async (signal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      Object.entries(filters).forEach(([k,v]) => { if(v) params.set(k,v); });
      const { data } = await api.get(`/admin/complaints?${params}`, { signal });
      setComplaints(data.complaints);
      setTotal(data.total);
    } catch (err) { if (err.code !== 'ERR_CANCELED') toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { setPage(1); }, [filters]);
  useEffect(() => {
    const controller = new AbortController();
    fetchComplaints(controller.signal);
    return () => controller.abort();
  }, [fetchComplaints]);

  useEffect(() => () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  }, []);

  const setFilter = (k,v) => setFilters(f => ({ ...f, [k]: v }));

  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setFilter('search', value), 300);
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/admin/complaints/${id}/status`, { status });
      if (filters.status && filters.status !== data.complaint.status) {
        setComplaints(prev => prev.filter(c => c._id !== id));
        setTotal(value => Math.max(0, value - 1));
      } else {
        setComplaints(prev => prev.map(c => c._id === id ? { ...c, status: data.complaint.status } : c));
      }
      toast.success(`Status → ${status}`);
    } catch { toast.error('Update failed'); }
  };

  const updatePriority = async (id, priority) => {
    try {
      const { data } = await api.put(`/admin/complaints/${id}/priority`, { priority });
      if (filters.priority && filters.priority !== data.complaint.priority) {
        setComplaints(prev => prev.filter(c => c._id !== id));
        setTotal(value => Math.max(0, value - 1));
      } else {
        setComplaints(prev => prev.map(c => c._id === id ? { ...c, priority: data.complaint.priority } : c));
      }
      toast.success(`Priority → ${priority}`);
    } catch { toast.error('Update failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this complaint?')) return;
    try {
      await api.delete(`/admin/complaints/${id}`);
      setComplaints(prev => prev.filter(c => c._id !== id));
      setTotal(t => t - 1);
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <PageHeader title="Manage Complaints" subtitle={`${total} total complaints`} />

      {/* Filter bar */}
      <div className="card mb-6 p-4 space-y-3">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input className="input pl-9" placeholder="Search by title or description…"
            value={searchInput} onChange={e => handleSearchChange(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select value={filters.status}   onChange={e => setFilter('status',   e.target.value)}
            options={STATUSES.map(s   => ({ value: s, label: s   || 'All Status' }))} />
          <Select value={filters.category} onChange={e => setFilter('category', e.target.value)}
            options={CATEGORIES.map(c => ({ value: c, label: c || 'All Categories' }))} />
          <Select value={filters.priority} onChange={e => setFilter('priority', e.target.value)}
            options={PRIORITIES.map(p => ({ value: p, label: p || 'All Priorities' }))} />
          <Select value={filters.sort}     onChange={e => setFilter('sort',     e.target.value)}
            options={[
              { value:'-createdAt', label:'Newest first' },
              { value: 'createdAt', label:'Oldest first' },
            ]} />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_,i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : complaints.length === 0 ? (
        <EmptyState title="No complaints found" description="Try adjusting your filters." />
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div key={`${page}-${JSON.stringify(filters)}`}
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['Complaint','Student','Location','Status','Priority','Actions'].map(h => (
                        <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider
                          ${h === 'Student' ? 'hidden md:table-cell' : ''}
                          ${h === 'Location' ? 'hidden lg:table-cell' : ''}
                          ${h === 'Priority' ? 'hidden md:table-cell' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {complaints.map((c, i) => (
                      <motion.tr key={c._id}
                        initial={{ opacity:0, x:-8 }}
                        animate={{ opacity:1, x:0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <Link to={`/admin/complaints/${c._id}`}
                            className="font-semibold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1 max-w-[200px] block">
                            {c.title}
                          </Link>
                          <span className="text-xs text-slate-400">{c.category} · {new Date(c.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <p className="text-slate-700 font-medium text-sm">{c.submittedBy?.name}</p>
                          <p className="text-xs text-slate-400">{c.submittedBy?.department}</p>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-slate-500 text-xs">📍 {c.building}</td>
                        <td className="px-4 py-3.5">
                          <select value={c.status}
                            onChange={e => updateStatus(c._id, e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-medium">
                            {['Pending','In Progress','Resolved'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <select value={c.priority}
                            onChange={e => updatePriority(c._id, e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-medium">
                            {['Low','Medium','High','Emergency'].map(p => <option key={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5">
                            <Link to={`/admin/complaints/${c._id}`}
                              className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors">
                              View
                            </Link>
                            <button onClick={() => handleDelete(c._id)}
                              className="px-2.5 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors">
                              Del
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </AnimatePresence>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">{(page-1)*15+1}–{Math.min(page*15,total)} of {total}</p>
              <div className="flex gap-2">
                <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">← Prev</button>
                <button disabled={page>=totalPages} onClick={() => setPage(p=>p+1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
