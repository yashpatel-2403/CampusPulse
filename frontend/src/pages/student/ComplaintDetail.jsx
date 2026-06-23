import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge, Spinner, ConfirmDialog } from '../../components/ui/index';

const STATUSES   = ['Pending','In Progress','Resolved'];
const PRIORITIES = ['Low','Medium','High','Emergency'];

export default function ComplaintDetail() {
  const { id }      = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [complaint, setComplaint]   = useState(null);
  const [loading,   setLoading]     = useState(true);
  const [comment,   setComment]     = useState('');
  const [submitting,setSubmitting]  = useState(false);
  const [deleting,  setDeleting]    = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [admins, setAdmins] = useState([]);

  const isAdmin  = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/dashboard';

  useEffect(() => {
    api.get(`/complaints/${id}`)
      .then(({ data }) => setComplaint(data.complaint))
      .catch(() => toast.error('Complaint not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (isAdmin) {
      api.get('/admin/admins')
        .then(({ data }) => setAdmins(data.admins || []))
        .catch(() => {});
    }
  }, [isAdmin]);

  const handleStatusChange = async (status) => {
    try {
      const { data } = await api.put(`/admin/complaints/${id}/status`, { status });
      setComplaint(prev => ({ ...prev, status: data.complaint.status }));
      toast.success(`Status → ${status}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handlePriorityChange = async (priority) => {
    try {
      const { data } = await api.put(`/admin/complaints/${id}/priority`, { priority });
      setComplaint(prev => ({ ...prev, priority: data.complaint.priority }));
      toast.success(`Priority → ${priority}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAssignment = async (adminId) => {
    if (!adminId) return;
    try {
      const { data } = await api.put(`/admin/complaints/${id}/assign`, { adminId });
      setComplaint(prev => ({ ...prev, assignedAdmin: data.complaint.assignedAdmin }));
      toast.success('Complaint assigned');
    } catch (err) { toast.error(err.response?.data?.message || 'Assignment failed'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const endpoint = isAdmin ? `/admin/complaints/${id}` : `/complaints/${id}`;
      await api.delete(endpoint);
      toast.success('Complaint deleted successfully');
      navigate(`${basePath}/complaints`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete complaint');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/complaints/${id}/comments`, { text: comment });
      setComplaint(prev => ({ ...prev, comments: data.comments }));
      setComment('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  if (loading)    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!complaint) return <div className="text-center py-24 text-slate-500">Complaint not found</div>;

  const ownerId = complaint.submittedBy?._id?.toString() || complaint.submittedBy?.toString();
  const isOwner = ownerId === user?._id?.toString();
  const canEdit   = !isAdmin && isOwner && complaint.status === 'Pending';
  const canDelete = (isOwner && complaint.status === 'Pending') || isAdmin;

  const timeline = [
    { label: 'Submitted',   done: true,                                                   icon: '📝', date: complaint.createdAt },
    { label: 'In Progress', done: ['In Progress','Resolved'].includes(complaint.status),  icon: '🔄', date: null },
    { label: 'Resolved',    done: complaint.status === 'Resolved',                        icon: '✅', date: complaint.status === 'Resolved' ? complaint.updatedAt : null },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-600 mb-6 transition-colors font-medium">
        ← Back
      </button>

      {/* ── Main card ── */}
      <div className="card mb-5">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 mb-2.5 leading-tight">{complaint.title}</h1>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              <span className="badge bg-slate-100 text-slate-500">{complaint.category}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canEdit && (
              <Link to={`/dashboard/complaints/${id}/edit`} className="btn-secondary text-sm py-2">✏️ Edit</Link>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="btn-danger text-sm py-2 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? <Spinner size="sm" /> : <>🗑️ Delete</>}
              </button>
            )}
          </div>
        </div>

        {/* Delete confirmation dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete Complaint"
          message="Are you sure you want to delete this complaint? This action cannot be undone."
          isDangerous={true}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {/* Image */}
        {complaint.imageUrl && (
          <div className="rounded-xl overflow-hidden mb-5">
            <img src={complaint.imageUrl} alt="Complaint"
              className="w-full max-h-64 object-cover hover:scale-105 transition-transform duration-300 cursor-zoom-in"
              onClick={() => window.open(complaint.imageUrl, '_blank')} />
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
          {[
            { label: 'LOCATION',     value: `📍 ${complaint.building}` },
            { label: 'SUBMITTED BY', value: `${complaint.submittedBy?.name}${complaint.submittedBy?.department ? ` (${complaint.submittedBy.department})` : ''}` },
            { label: 'CREATED',      value: new Date(complaint.createdAt).toLocaleString('en-IN') },
            { label: 'LAST UPDATED', value: new Date(complaint.updatedAt).toLocaleString('en-IN') },
            ...(complaint.assignedAdmin ? [{ label: 'ASSIGNED TO', value: complaint.assignedAdmin?.name }] : []),
            ...(complaint.coordinates?.lat ? [{
              label: 'COORDINATES',
              value: `${Number(complaint.coordinates.lat).toFixed(5)}, ${Number(complaint.coordinates.lng).toFixed(5)}`
            }] : []),
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider mb-1">{label}</p>
              <p className="text-slate-700 text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider mb-2">DESCRIPTION</p>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
        </div>
      </div>

      {/* ── Admin controls ── */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card mb-5">
          <h3 className="font-semibold text-slate-800 mb-4">Admin Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      complaint.status === s
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Update Priority</p>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map(p => (
                  <button key={p} onClick={() => handlePriorityChange(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      complaint.priority === p
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Admin</p>
              <select
                className="input py-2 text-sm"
                value={complaint.assignedAdmin?._id || ''}
                onChange={(event) => handleAssignment(event.target.value)}
              >
                <option value="">Select admin…</option>
                {admins.map(admin => <option key={admin._id} value={admin._id}>{admin.name}</option>)}
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Timeline ── */}
      <div className="card mb-5">
        <h3 className="font-semibold text-slate-800 mb-5">Status Timeline</h3>
        <div className="flex items-start">
          {timeline.map((t, i) => (
            <div key={t.label} className="flex items-start flex-1">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                    t.done
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-slate-50 border-slate-200 text-slate-300'
                  }`}
                >
                  {t.icon}
                </motion.div>
                <p className={`text-xs font-semibold mt-2 text-center leading-tight ${t.done ? 'text-blue-700' : 'text-slate-300'}`}>
                  {t.label}
                </p>
                {t.date && (
                  <p className="text-[10px] text-slate-400 mt-0.5 text-center">
                    {new Date(t.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                  </p>
                )}
              </div>
              {i < timeline.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.15 + 0.1, duration: 0.4 }}
                  className={`flex-1 h-0.5 mt-5 origin-left ${timeline[i+1].done ? 'bg-blue-300' : 'bg-slate-100'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Comments ── */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">
          Comments <span className="text-slate-400 font-normal text-sm">({complaint.comments?.length || 0})</span>
        </h3>

        <div className="space-y-3 mb-5">
          <AnimatePresence>
            {complaint.comments?.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-6 bg-slate-50 rounded-xl">
                No comments yet — be the first to comment
              </p>
            )}
            {complaint.comments?.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {c.author?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-800">{c.author?.name}</span>
                    {c.author?.role === 'admin' && (
                      <span className="badge bg-blue-100 text-blue-700">Admin</span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{c.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Comment input */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              className="input resize-none min-h-[44px] max-h-28"
              placeholder="Add a comment…"
              rows={1}
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
            />
          </div>
          <button onClick={handleComment} disabled={submitting || !comment.trim()} className="btn-primary py-2.5 px-4">
            {submitting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
              </svg>
            ) : '↑'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </motion.div>
  );
}
