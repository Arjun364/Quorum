import { ChangePasswordPage, LoginPage } from '@/features/auth';
import { HomePage } from '@/features/home';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { PublicOnly, RequireAuth } from './guards';

/** Application routes: public sign-in, the forced change-password page, and the signed-in shell. */
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
