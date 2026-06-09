import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { EmailVerifyBanner } from '@/components/EmailVerifyBanner';

/** Gate protected routes: unauthenticated users go to /login. The email-verify
 * banner is mounted once here so it appears atop every authenticated page
 * (it renders null when the user's email is already verified). */
export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.token !== null);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-full bg-canvas-soft">
      <div className="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl">
          <EmailVerifyBanner />
        </div>
      </div>
      <Outlet />
    </div>
  );
}
