import { useSession } from '@/features/auth';
import { Navigate, Outlet } from 'react-router-dom';
import { SplashScreen } from './SplashScreen';

/** Lets only signed-out visitors through (for example the sign-in page); signed-in users go to the home page. */
export function PublicOnly() {
  const { status, user } = useSession();
  if (status === 'loading') return <SplashScreen />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
