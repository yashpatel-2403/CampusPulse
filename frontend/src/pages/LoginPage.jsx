import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [loading,   setLoading]   = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const formRef = useRef(null);

  // react-hook-form — mode:'onSubmit' prevents any browser default reloads
  const { register, handleSubmit, formState: { errors }, setFocus } = useForm({ mode: 'onSubmit' });

  // KEY FIX: handleSubmit from RHF already calls e.preventDefault() internally.
  // We still call e.preventDefault() manually as a safety net in case the outer
  // <form> somehow bypasses RHF (e.g. browser autofill submit).
  const onSubmit = async (data) => {
    setLoading(true);
    setAuthError('');
    try {
      const user = await login(data.email, data.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setAuthError(msg);
      if (formRef.current) {
        formRef.current.classList.remove('shake');
        void formRef.current.offsetWidth;
        formRef.current.classList.add('shake');
      }
      setFocus('password');
    } finally {
      setLoading(false);
    }
  };

  // Extra safety: intercept native submit event to block any browser reload
  const handleNativeSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="min-h-screen flex bg-[#f0f4ff]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-12 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute bottom-10 -right-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg">C</div>
            <span className="text-white font-bold text-xl tracking-tight">Campus Pulse</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-snug mb-4">
            Smarter complaints.<br />Faster resolutions.
          </h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            Report campus issues in seconds. Track progress in real-time. Get resolved faster.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            { icon: '⚡', text: 'Real-time status updates via socket' },
            { icon: '🗺️', text: 'Interactive LDCE campus map picker' },
            { icon: '📊', text: 'Analytics & hotspot detection' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-white/90 text-sm font-medium">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[400px]"
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <span className="font-bold text-slate-800 text-lg">Campus Pulse</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-1">Sign in</h1>
          <p className="text-slate-500 mb-8 text-sm">Enter your credentials to continue</p>

          {/*
            CRITICAL FIX for page reload on wrong credentials:
            1. onSubmit={handleNativeSubmit} prevents any native browser form submission
            2. RHF's handleSubmit wraps our async onSubmit — it calls e.preventDefault() too
            3. type="button" on submit button as extra guard (type="submit" handled by RHF)
            This triple-guard ensures the page NEVER reloads on failed login.
          */}
          <form
            ref={formRef}
            onSubmit={handleNativeSubmit}
            noValidate
            className="space-y-4"
            autoComplete="on"
          >
            {/* Inline error banner */}
            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
                >
                  <span className="mt-0.5 flex-shrink-0 text-base">⚠️</span>
                  <div>
                    <p className="font-semibold">Login failed</p>
                    <p className="text-red-600 font-normal mt-0.5">{authError}</p>
                  </div>
                  <button type="button" onClick={() => setAuthError('')}
                    className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@campus.edu"
                className={`input ${errors.email || authError ? 'input-error' : ''}`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                  onChange: () => setAuthError(''),
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">⚠ {errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`input pr-11 ${errors.password || authError ? 'input-error' : ''}`}
                  {...register('password', {
                    required: 'Password is required',
                    onChange: () => setAuthError(''),
                  })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-lg select-none"
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">⚠ {errors.password.message}</p>
              )}
            </div>

            {/* Use type="button" + manual RHF handleSubmit call — prevents any native form submission */}
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit(onSubmit)}
              className="btn-primary w-full justify-center py-3 mt-2 text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                  </svg>
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">Sign in <span>→</span></span>
              )}
            </button>

            {import.meta.env.DEV && (
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-600 mb-1.5">Demo credentials</p>
                <p>Admin: <span className="font-mono text-blue-600">admin@campus.edu</span> / <span className="font-mono text-blue-600">password123</span></p>
                <p>Student: <span className="font-mono text-blue-600">student1@campus.edu</span> / <span className="font-mono text-blue-600">password123</span></p>
              </div>
            )}

            <p className="text-center text-sm text-slate-500 pt-1">
              No account?{' '}
              <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                Create one →
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
