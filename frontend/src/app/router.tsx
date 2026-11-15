import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ChangePasswordPage } from '../features/auth/pages/ChangePasswordPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { HomePage } from '../features/home/pages/HomePage';
import { AppShell } from './AppShell';
import { useSession } from './auth/session';

function Splash() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center text-muted">
      Loading…
    </div>
  );
}

/** Only signed-in users pass; a pending password change redirects to its page. */
function RequireAuth() {
  const { status, user } = useSession();
  const location = useLocation();
  if (status === 'loading') return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}

function PublicOnly() {
  const { status, user } = useSession();
  if (status === 'loading') return <Splash />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  { element: <PublicOnly />, children: [{ path: '/login', element: <LoginPage /> }] },
  {
    element: <RequireAuth />,
    children: [
      { path: '/change-password', element: <ChangePasswordPage /> },
      { element: <AppShell />, children: [{ path: '/', element: <HomePage /> }] },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
