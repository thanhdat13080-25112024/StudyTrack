import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import Focus from '@/pages/Focus';
import History from '@/pages/History';
import Schedule from '@/pages/Schedule';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuthStore } from '@/store/authStore';
import { useMe } from '@/features/auth/hooks';

/**
 * Routed shell. Public auth routes (/login, /register) bounce to /dashboard when
 * already authenticated; the dashboard/profile routes are gated by RequireAuth.
 * `useMe()` hydrates the current user (and applies server lang/theme) on boot
 * whenever a stored token exists.
 */
export default function App() {
  useMe();
  const isAuthenticated = useAuthStore((s) => s.token !== null);

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/history" element={<History />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}
