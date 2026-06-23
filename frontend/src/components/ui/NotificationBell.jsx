import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function NotificationBell({ dark = false }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Bug #28 fix: renamed `fetch` to `loadNotifications` to avoid shadowing window.fetch
  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/users/notifications');
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {}
  };

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => loadNotifications();
    socket.on('new_complaint', refresh);
    socket.on('status_update', refresh);
    socket.on('priority_update', refresh);
    return () => {
      socket.off('new_complaint', refresh);
      socket.off('status_update', refresh);
      socket.off('priority_update', refresh);
    };
  }, [socket]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async () => {
    try {
      await api.put('/users/notifications/read');
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markRead();
  };

  const handleNotificationClick = (n) => {
    setOpen(false);
    if (n.complaintId) {
      const cId = typeof n.complaintId === 'object' ? n.complaintId._id : n.complaintId;
      const path = user?.role === 'admin' ? `/admin/complaints/${cId}` : `/dashboard/complaints/${cId}`;
      navigate(path);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleToggle}
        className={`relative p-2 rounded-xl transition-colors ${
          dark ? 'text-white hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
        }`}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        🔔
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
              {unread > 0 && (
                <span className="text-xs text-brand-600 font-medium">{unread} unread</span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No notifications yet</p>
              ) : (
                notifications.map(n => (
                  <div key={n._id}
                    className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                      !n.read ? 'bg-blue-50/40' : ''
                    }`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
