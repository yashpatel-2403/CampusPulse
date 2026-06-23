import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StatusBadge, PriorityBadge } from './index';

const CATEGORY_ICONS = {
  Electrical:'⚡', Plumbing:'🚿', WiFi:'📶', Hostel:'🏠',
  Cleanliness:'🧹', Furniture:'🪑', Security:'🔒',
  Classroom:'📚', Laboratory:'🔬', Other:'📌',
};

const CATEGORY_BG = {
  Electrical:'bg-yellow-50', Plumbing:'bg-blue-50', WiFi:'bg-indigo-50',
  Hostel:'bg-orange-50', Cleanliness:'bg-green-50', Furniture:'bg-slate-50',
  Security:'bg-red-50', Classroom:'bg-purple-50', Laboratory:'bg-teal-50', Other:'bg-slate-50',
};

export default function ComplaintCard({ complaint, basePath = '/dashboard' }) {
  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.round(diff/60)}m ago`;
    if (diff < 86400) return `${Math.round(diff/3600)}h ago`;
    return `${Math.round(diff/86400)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -1 }}
    >
      <Link to={`${basePath}/complaints/${complaint._id}`}>
        <div className="card-hover cursor-pointer group">
          <div className="flex gap-4">
            {/* Thumbnail or category icon */}
            {complaint.imageUrl ? (
              <img
                src={complaint.imageUrl}
                alt={complaint.title}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0 ring-1 ring-slate-100"
              />
            ) : (
              <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${CATEGORY_BG[complaint.category] || 'bg-slate-50'}`}>
                {CATEGORY_ICONS[complaint.category] || '📌'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {complaint.title}
                </h3>
                <div className="flex-shrink-0">
                  <StatusBadge status={complaint.status} />
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                {complaint.description}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <PriorityBadge priority={complaint.priority} />
                <span className="badge bg-slate-100 text-slate-500">{CATEGORY_ICONS[complaint.category]} {complaint.category}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <span>📍</span>{complaint.building}
                </span>
                <span className="text-xs text-slate-300 ml-auto">{timeAgo(complaint.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
