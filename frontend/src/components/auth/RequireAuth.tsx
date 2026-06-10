import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AppShell } from '@/components/shell/AppShell';

/** Gate protected routes: unauthenticated users go to /login. Authenticated
 * routes render inside the Notion app-shell (sidebar/drawer + content canvas);
 * the shell also mounts the email-verify banner once at the top of the content
 * area, so individual pages carry no chrome of their own. */
export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.token !== null);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
