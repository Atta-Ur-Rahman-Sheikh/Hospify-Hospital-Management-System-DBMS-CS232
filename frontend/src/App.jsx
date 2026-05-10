import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/auth-context';
import ErrorBoundary from './components/ErrorBoundary';
import { Activity } from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Admissions from './pages/Admissions';
import Beds from './pages/Beds';
import Pharmacy from './pages/Pharmacy';
import Billing from './pages/Billing';
import Lab from './pages/Lab';
import Appointments from './pages/Appointments';
import Doctors from './pages/Doctors';
import Admin from './pages/Admin';

import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-ink-900 text-ink-50">
      <div className="relative">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-xl shadow-brand-600/30">
          <Activity className="h-7 w-7 text-white animate-pulse" strokeWidth={2.5} />
        </div>
        <div className="absolute inset-0 rounded-2xl ring-2 ring-brand-500/30 animate-ping" />
      </div>
      <p className="text-sm text-ink-200 font-medium">Loading Hospify…</p>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/beds" element={<Beds />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/pharmacy" element={<Pharmacy />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/billing" element={<Billing />} />

            <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
