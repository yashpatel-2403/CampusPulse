import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { PageHeader, Skeleton, EmptyState } from '../../components/ui/index';
import toast from 'react-hot-toast';

const DEPT_COLORS = {
  'Computer Science': 'bg-blue-100 text-blue-700',
  'Mechanical':       'bg-orange-100 text-orange-700',
  'Electrical':       'bg-yellow-100 text-yellow-700',
  'Civil':            'bg-green-100 text-green-700',
  'IT':               'bg-purple-100 text-purple-700',
  'Electronics':      'bg-pink-100 text-pink-700',
};

export default function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data.users))
      .catch(() => toast.error('Could not load students'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const deptSummary = users.reduce((acc, u) => {
    const d = u.department || 'Unknown';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Students" subtitle={`${users.length} registered students`} />

      {/* Dept summary pills */}
      {!loading && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          className="flex flex-wrap gap-2 mb-6">
          {Object.entries(deptSummary).sort((a,b)=>b[1]-a[1]).map(([dept, count]) => (
            <button key={dept} onClick={() => setSearch(dept === search ? '' : dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                search === dept
                  ? 'bg-blue-600 text-white border-blue-600'
                  : `${DEPT_COLORS[dept] || 'bg-slate-100 text-slate-600'} border-transparent hover:border-current`
              }`}>
              {dept} · {count}
            </button>
          ))}
        </motion.div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        <input className="input pl-9 max-w-sm" placeholder="Search by name, email, department…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(8)].map((_,i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No students found" description="No students match your search." />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Student','Department','Joined','Role'].map(h => (
                  <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider
                    ${h==='Department'?'hidden md:table-cell':''}
                    ${h==='Joined'?'hidden lg:table-cell':''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u, i) => {
                const initials = u.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
                return (
                  <motion.tr key={u._id}
                    initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: i * 0.025 }}
                    className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={`badge ${DEPT_COLORS[u.department] || 'bg-slate-100 text-slate-600'}`}>
                        {u.department || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-slate-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="badge bg-blue-50 text-blue-600 capitalize">{u.role}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
