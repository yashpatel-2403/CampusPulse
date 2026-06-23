import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '../components/ui/NotificationBell';

const NAV = [
  { to: '/admin',            label: 'Dashboard',         icon: '📊', end: true },
  { to: '/admin/complaints', label: 'Manage Complaints', icon: '📋' },
  { to: '/admin/analytics',  label: 'Analytics',         icon: '📈' },
  { to: '/admin/heatmap',    label: 'Heatmap',           icon: '🗺️' },
  { to: '/admin/boundary',   label: 'Boundary Editor',   icon: '📐' },
  { to: '/admin/users',      label: 'Users',             icon: '👥' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-[#f8f9fc]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 p-4 fixed h-full z-20">
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">C</div>
          <div>
            <span className="font-bold text-white text-sm block leading-tight">Campus Pulse</span>
            <span className="text-[10px] text-slate-400 font-medium">Admin Panel · LDCE</span>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer
                 ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name}</p>
              <p className="text-[11px] text-slate-400">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all duration-150 font-medium flex items-center gap-2">
            <span>【⏻】</span> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs">C</div>
          <span className="font-bold text-white text-sm">Admin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <NotificationBell dark />
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 z-50 md:hidden p-5 flex flex-col shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-sm">C</div>
                <span className="font-bold text-white">Admin Panel</span>
                <button onClick={() => setMobileOpen(false)} className="ml-auto text-slate-400 hover:text-white p-1">✕</button>
              </div>
              <nav className="flex-1 space-y-0.5 overflow-y-auto">
                {NAV.map(({ to, label, icon, end }) => (
                  <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                       ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
                    }>
                    <span>{icon}</span>{label}
                  </NavLink>
                ))}
              </nav>
              <div className="border-t border-slate-800 pt-4 mt-4">
                <button onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-xl font-medium flex items-center gap-2">
                  <span>🚪</span> Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-h-screen">
        <div className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white border-b border-slate-100">
          <div />
          <NotificationBell />
        </div>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="p-5 md:p-8"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
