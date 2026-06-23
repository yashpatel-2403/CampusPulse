import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { PageHeader, Skeleton, EmptyState, Select } from '../../components/ui/index';
import ComplaintCard from '../../components/ui/ComplaintCard';

const CATEGORIES = ['','Electrical','Plumbing','WiFi','Hostel','Cleanliness','Furniture','Security','Classroom','Laboratory','Other'];
const STATUSES   = ['','Pending','In Progress','Resolved'];
const PRIORITIES = ['','Low','Medium','High','Emergency'];

export default function MyComplaints() {
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
      const params = new URLSearchParams({ page, limit: 10 });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const { data } = await api.get(`/complaints?${params}`, { signal });
      setComplaints(data.complaints);
      setTotal(data.total);
    } catch (err) { if (err.code !== 'ERR_CANCELED') throw err; }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { setPage(1); }, [filters]);
  useEffect(() => {
    const controller = new AbortController();
    fetchComplaints(controller.signal).catch(() => {});
    return () => controller.abort();
  }, [fetchComplaints]);

  useEffect(() => () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  }, []);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  // Debounce search input to avoid excessive API calls
  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilter('search', value);
      setPage(1);
    }, 300);
  }, []);

  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <PageHeader
        title="My Complaints"
        subtitle={`${total} total complaint${total !== 1 ? 's' : ''}`}
        action={<Link to="/dashboard/complaints/new" className="btn-primary">➕ New Complaint</Link>}
      />

      {/* Filter bar */}
      <div className="card mb-6 p-4 space-y-3">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            className="input pl-9"
            placeholder="Search complaints by title or description…"
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
          />
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
              { value: '-createdAt', label: 'Newest first' },
              { value:  'createdAt', label: 'Oldest first' },
            ]} />
        </div>
        {/* Active filters */}
        {Object.entries(filters).some(([k, v]) => v && k !== 'sort') && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400">Active:</span>
            {filters.status   && <Chip label={filters.status}   onRemove={() => setFilter('status', '')} />}
            {filters.category && <Chip label={filters.category} onRemove={() => setFilter('category', '')} />}
            {filters.priority && <Chip label={filters.priority} onRemove={() => setFilter('priority', '')} />}
            {filters.search   && <Chip label={`"${filters.search}"`} onRemove={() => { setSearchInput(''); setFilter('search', ''); }} />}
            <button onClick={() => { setSearchInput(''); setFilters({ status:'', category:'', priority:'', search:'', sort:'-createdAt' }); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium ml-1">Clear all</button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          title="No complaints found"
          description="Try adjusting your filters or submit a new complaint."
          action={<Link to="/dashboard/complaints/new" className="btn-primary">Submit Complaint</Link>}
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${page}-${JSON.stringify(filters)}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {complaints.map(c => <ComplaintCard key={c._id} complaint={c} />)}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">← Prev</button>
            <div className="flex gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      page === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>{p}</button>
                );
              })}
            </div>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900 ml-0.5">✕</button>
    </span>
  );
}
