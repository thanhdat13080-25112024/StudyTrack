import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/** Gate protected routes: unauthenticated users go to /login. */
export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.token !== null);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
