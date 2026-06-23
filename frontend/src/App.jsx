import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';

import LandingPage   from './pages/LandingPage';
import LoginPage     from './pages/LoginPage';
import SignupPage    from './pages/SignupPage';

import StudentLayout   from './layouts/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import MyComplaints    from './pages/student/MyComplaints';
import NewComplaint    from './pages/student/NewComplaint';
import EditComplaint   from './pages/student/EditComplaint';
import ComplaintDetail from './pages/student/ComplaintDetail';
import ProfilePage     from './pages/student/Profile';

import AdminLayout        from './layouts/AdminLayout';
import AdminDashboard     from './pages/admin/Dashboard';
import ManageComplaints   from './pages/admin/ManageComplaints';
import AnalyticsPage      from './pages/admin/Analytics';
import HeatmapPage        from './pages/admin/Heatmap';
import UsersPage          from './pages/admin/Users';
import BoundaryEditorPage from './pages/admin/BoundaryEditor';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#f8f9fc]">
      <div className="flex flex-col items-center gap-3">
        <svg className="w-10 h-10 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
        </svg>
        <p className="text-sm text-slate-500 font-medium">Loading…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role)
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <SocketProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'text-sm font-medium',
                duration: 4000,
                style: { borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
              }}
            />
            <ConnectionStatus />
            <Routes>
              <Route path="/"       element={<LandingPage />} />
              <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Student */}
            <Route path="/dashboard" element={
              <ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>
            }>
              <Route index element={<StudentDashboard />} />
              <Route path="complaints"          element={<MyComplaints />} />
              <Route path="complaints/new"      element={<NewComplaint />} />
              <Route path="complaints/:id"      element={<ComplaintDetail />} />
              <Route path="complaints/:id/edit" element={<EditComplaint />} />
              <Route path="profile"             element={<ProfilePage />} />
            </Route>

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="complaints"     element={<ManageComplaints />} />
              <Route path="complaints/:id" element={<ComplaintDetail />} />
              <Route path="analytics"      element={<AnalyticsPage />} />
              <Route path="heatmap"        element={<HeatmapPage />} />
              <Route path="users"          element={<UsersPage />} />
              <Route path="boundary"       element={<BoundaryEditorPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
            </SocketProvider>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    );
  }
