import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard, PageHeader, Skeleton } from '../../components/ui/index';
import ComplaintCard from '../../components/ui/ComplaintCard';
import toast from 'react-hot-toast';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [recent,  setRecent]  = useState([]);
  const [stats,   setStats]   = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/complaints?limit=50&sort=-createdAt')
      .then(({ data }) => {
        const all = data.complaints || [];
        setStats(data.stats || {
          total: data.total ?? all.length,
          pending: all.filter(c => c.status === 'Pending').length,
          inProgress: all.filter(c => c.status === 'In Progress').length,
          resolved: all.filter(c => c.status === 'Resolved').length,
        });
        setRecent(all.slice(0, 5));
      })
      .catch(() => toast.error('Could not load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-slate-800 tracking-tight"
          >
            Good {getGreeting()}, {firstName} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-slate-500 text-sm mt-1"
          >
            Here's the status of your campus complaints
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
          <Link to="/dashboard/complaints/new" className="btn-primary">
            ➕ New Complaint
          </Link>
        </motion.div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div variants={item}><StatCard label="Total Complaints" value={stats.total}      icon="📋" color="blue"   /></motion.div>
          <motion.div variants={item}><StatCard label="Pending"          value={stats.pending}    icon="⏳" color="yellow" /></motion.div>
          <motion.div variants={item}><StatCard label="In Progress"      value={stats.inProgress} icon="🔄" color="purple" /></motion.div>
          <motion.div variants={item}><StatCard label="Resolved"         value={stats.resolved}   icon="✅" color="green"  /></motion.div>
        </motion.div>
      )}

      {/* Progress bar (visual summary) */}
      {!loading && stats.total > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="card mb-8 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">Resolution progress</span>
            <span className="font-semibold text-emerald-600">
              {Math.round((stats.resolved / stats.total) * 100)}% resolved
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
            {stats.resolved > 0 && (
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${(stats.resolved / stats.total) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                className="h-full bg-emerald-500 rounded-full"
              />
            )}
            {stats.inProgress > 0 && (
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                className="h-full bg-blue-400 rounded-full"
              />
            )}
            {stats.pending > 0 && (
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${(stats.pending / stats.total) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
                className="h-full bg-amber-400 rounded-full"
              />
            )}
          </div>
          <div className="flex gap-4 mt-2.5">
            {[
              { label: 'Resolved',    color: 'bg-emerald-500', count: stats.resolved },
              { label: 'In Progress', color: 'bg-blue-400',    count: stats.inProgress },
              { label: 'Pending',     color: 'bg-amber-400',   count: stats.pending },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                {s.label} ({s.count})
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent complaints */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Recent Complaints</h2>
          <Link to="/dashboard/complaints" className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : recent.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card text-center py-16 border-dashed">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📭</div>
            <p className="font-semibold text-slate-700 mb-1">No complaints yet</p>
            <p className="text-sm text-slate-400 mb-6">Submit your first complaint to get started</p>
            <Link to="/dashboard/complaints/new" className="btn-primary">
              Submit Complaint
            </Link>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {recent.map(c => (
              <motion.div key={c._id} variants={item}>
                <ComplaintCard complaint={c} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Tips card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Quick Tips</h3>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Use the <strong>map picker</strong> to pin your exact location on campus</li>
              <li>• Upload a <strong>photo</strong> — complaints with photos get resolved 40% faster</li>
              <li>• Mark <strong>Emergency</strong> only for urgent safety or infrastructure issues</li>
              <li>• You can still <strong>edit or delete</strong> a complaint while it's Pending</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
