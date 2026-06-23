import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Computer Science','Mechanical','Electrical','Civil','IT','Electronics','Chemical','Other'];

export default function SignupPage() {
  const { signup }  = useAuth();
  const navigate    = useNavigate();
  const [loading,   setLoading]   = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPw,    setShowPw]    = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setAuthError('');
    try {
      await signup(data);
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setAuthError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-[#f0f4ff]">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-12 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute bottom-8 -left-12 w-56 h-56 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg">C</div>
            <span className="text-white font-bold text-xl tracking-tight">Campus Pulse</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-snug mb-4">
            Join your campus community.
          </h2>
          <p className="text-emerald-200 text-lg leading-relaxed">
            Create your account and start making your campus a better place today.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            { icon: '🗺️', text: 'Pin exact locations on campus map' },
            { icon: '📸', text: 'Attach photos to complaints' },
            { icon: '🔔', text: 'Get notified when status changes' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-white/90 text-sm font-medium">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }}
          transition={{ duration:0.35, ease:[0.25,0.46,0.45,0.94] }}
          className="w-full max-w-[420px]"
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <span className="font-bold text-slate-800 text-lg">Campus Pulse</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-1">Create account</h1>
          <p className="text-slate-500 mb-7 text-sm">Fill in your details to get started</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ opacity:0, y:-6, height:0 }}
                  animate={{ opacity:1, y:0,  height:'auto' }}
                  exit={{ opacity:0, y:-6, height:0 }}
                  className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
                >
                  <span className="mt-0.5">⚠️</span>
                  <div>
                    <p className="font-semibold">Registration failed</p>
                    <p className="text-red-600 font-normal">{authError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="label">Full Name</label>
              <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Your full name"
                {...register('name', { required:'Name is required', onChange:()=>setAuthError('') })} />
              {errors.name && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email address</label>
              <input type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@campus.edu"
                {...register('email', {
                  required:'Email is required',
                  pattern:{ value:/^[^\s@]+@[^\s@]+\.[^\s@]+$/, message:'Enter a valid email' },
                  onChange:()=>setAuthError(''),
                })} />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Department</label>
              <select className={`input ${errors.department ? 'input-error' : ''}`}
                {...register('department', { required:'Department is required' })}>
                <option value="">Select your department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.department.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Min 6 characters"
                  {...register('password', {
                    required:'Password is required',
                    minLength:{ value:6, message:'Min 6 characters' },
                  })} />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-1 text-base">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                  </svg>
                  Creating account…
                </span>
              ) : 'Create account →'}
            </button>

            <p className="text-center text-sm text-slate-500 pt-1">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                Sign in →
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
