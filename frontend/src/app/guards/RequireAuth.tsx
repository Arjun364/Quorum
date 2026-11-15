import { useSession } from '@/features/auth';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { SplashScreen } from './SplashScreen';

/** Lets only signed-in users through; a pending password change redirects to the change-password page. */
export function RequireAuth() {
  const { status, user } = useSession();
  const location = useLocation();
  if (status === 'loading') return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}
