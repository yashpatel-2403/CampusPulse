import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/ui/index';

const DEPARTMENTS = ['Computer Science','Mechanical','Electrical','Civil','IT','Electronics','Chemical','Other'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: { name: user?.name || '', department: user?.department || '', profilePhoto: user?.profilePhoto || '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { data: res } = await api.put('/auth/profile', data);
      updateUser(res.user);
      toast.success('Profile updated!');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="max-w-xl">
      <PageHeader title="My Profile" subtitle="Manage your account details" />

      {/* Avatar card */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="card mb-5">
        <div className="flex items-center gap-4">
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-100" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {initials}
            </div>
          )}
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{user?.name}</h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="badge bg-blue-100 text-blue-700 capitalize">{user?.role}</span>
              {user?.department && <span className="badge bg-slate-100 text-slate-600">{user?.department}</span>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit form */}
      <motion.form onSubmit={handleSubmit(onSubmit)} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.1 }} className="card space-y-5">
        <h3 className="font-semibold text-slate-800">Edit Information</h3>

        <div>
          <label className="label">Full Name</label>
          <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Your full name"
            {...register('name', { required:'Name is required', maxLength:{ value:60, message:'Max 60 chars' } })} />
          {errors.name && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Email <span className="text-slate-400 text-xs font-normal">(cannot be changed)</span></label>
          <input className="input bg-slate-50 text-slate-400 cursor-not-allowed" value={user?.email} disabled />
        </div>

        <div>
          <label className="label">Department</label>
          <select className="input" {...register('department')}>
            <option value="">Select department</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Profile Photo URL <span className="text-slate-400 text-xs font-normal">(optional)</span></label>
          <input className="input" placeholder="https://example.com/photo.jpg"
            {...register('profilePhoto')} />
        </div>

        <button type="submit" disabled={loading || !isDirty}
          className="btn-primary w-full justify-center py-3 disabled:opacity-50">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
              </svg>
              Saving…
            </span>
          ) : saved ? '✅ Saved!' : '💾 Save Changes'}
        </button>
      </motion.form>

      {/* Account info */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
        className="card mt-5">
        <h3 className="font-semibold text-slate-800 mb-4">Account Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2.5 border-b border-slate-50">
            <span className="text-slate-500">Member since</span>
            <span className="font-medium text-slate-700">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN',{ day:'numeric', month:'long', year:'numeric' }) : '—'}
            </span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-slate-500">Account role</span>
            <span className="badge bg-blue-100 text-blue-700 capitalize">{user?.role}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
