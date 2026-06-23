import { motion } from 'framer-motion';

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default:  'bg-slate-100 text-slate-600',
    blue:     'bg-blue-100 text-blue-700',
    green:    'bg-emerald-100 text-emerald-700',
    yellow:   'bg-amber-100 text-amber-700',
    red:      'bg-red-100 text-red-700',
    purple:   'bg-purple-100 text-purple-700',
    orange:   'bg-orange-100 text-orange-700',
  };
  return <span className={`badge ${variants[variant] || variants.default}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  const map = {
    'Pending':     { label: '⏳ Pending',     variant: 'yellow' },
    'In Progress': { label: '🔄 In Progress', variant: 'blue' },
    'Resolved':    { label: '✅ Resolved',    variant: 'green' },
  };
  const { label, variant } = map[status] || { label: status, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function PriorityBadge({ priority }) {
  const map = {
    'Low':       { variant: 'default', label: '⬇ Low' },
    'Medium':    { variant: 'yellow',  label: '→ Medium' },
    'High':      { variant: 'orange',  label: '⬆ High' },
    'Emergency': { variant: 'red',     label: '🚨 Emergency' },
  };
  const { variant, label } = map[priority] || { variant: 'default', label: priority };
  return <Badge variant={variant}>{label}</Badge>;
}

export function StatCard({ label, value, icon, color = 'blue', trend, onClick }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   num: 'text-blue-700' },
    green:  { bg: 'bg-emerald-50',text: 'text-emerald-600',num: 'text-emerald-700' },
    yellow: { bg: 'bg-amber-50',  text: 'text-amber-600',  num: 'text-amber-700' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    num: 'text-red-700' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', num: 'text-purple-700' },
    slate:  { bg: 'bg-slate-50',  text: 'text-slate-500',  num: 'text-slate-700' },
  };
  const c = colors[color] || colors.blue;
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`card cursor-default select-none ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-extrabold ${c.num} leading-none`}>{value}</p>
          {trend && <p className="text-xs text-slate-400 mt-2">{trend}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${c.bg} ${c.text} flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mb-4">📭</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-xs leading-relaxed">{description}</p>
      {action}
    </motion.div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <svg className={`${sizes[size]} animate-spin text-blue-500`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
    </svg>
  );
}

export function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <select value={value} onChange={onChange} className="input appearance-none cursor-pointer">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-7 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-100" />
      {label && <span className="text-xs text-slate-400 font-medium">{label}</span>}
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, isDangerous = false }) {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium text-sm text-white ${
              isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
