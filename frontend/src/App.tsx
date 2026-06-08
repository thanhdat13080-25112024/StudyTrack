import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import Focus from '@/pages/Focus';
import History from '@/pages/History';
import Schedule from '@/pages/Schedule';
import Courses from '@/pages/Courses';
import Grades from '@/pages/Grades';
import Roadmap from '@/pages/Roadmap';
import Analysis from '@/pages/Analysis';
import Deadlines from '@/pages/Deadlines';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuthStore } from '@/store/authStore';
import { useMe } from '@/features/auth/hooks';
import { createWsClient } from '@/lib/wsClient';
import { apiClient, getToken } from '@/lib/apiClient';
import { useNotificationStore } from '@/store/notificationStore';
import { NOTIFICATIONS_KEY, UNREAD_KEY } from '@/features/notifications/hooks';

/**
 * Routed shell. Public auth routes (/login, /register) bounce to /dashboard when
 * already authenticated; the dashboard/profile routes are gated by RequireAuth.
 * `useMe()` hydrates the current user (and applies server lang/theme) on boot
 * whenever a stored token exists.
 */
export default function App() {
  useMe();
  const isAuthenticated = useAuthStore((s) => s.token !== null);

  const queryClient = useQueryClient();
  const pushLive = useNotificationStore((s) => s.push);

  useEffect(() => {
    if (!isAuthenticated) return;
    const client = createWsClient({
      baseUrl: apiClient.baseUrl,
      getToken,
      onMessage: (data) => {
        const msg = data as { type?: string; notification_type?: string; payload?: unknown };
        if (msg.type === 'notification') {
          pushLive({
            notification_type: msg.notification_type ?? 'unknown',
            payload: (msg.payload as Record<string, unknown>) ?? {},
          });
          void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
          void queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
        }
      },
    });
    client.connect();
    return () => client.disconnect();
  }, [isAuthenticated, queryClient, pushLive]);

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
        <Route path="/courses" element={<Courses />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/deadlines" element={<Deadlines />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}
