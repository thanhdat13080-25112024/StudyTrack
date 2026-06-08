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
    <>
      <div className="bg-bg-main px-4 pt-4 md:px-8">
        <div className="mx-auto max-w-5xl">
          <EmailVerifyBanner />
        </div>
      </div>
      <Outlet />
    </>
  );
}
