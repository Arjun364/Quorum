import { ChangePasswordPage, LoginPage, VerifyEmailPage } from '@/features/auth';
import { BrandSettingsPage, CheckEmailPage, StartPage } from '@/features/company';
import { HomePage } from '@/features/home';
import { AcceptInvitationPage } from '@/features/invitations';
import { LandingPage } from '@/features/landing';
import { OrganizationDetailPage, OrganizationsPage } from '@/features/structure';
import { currentCompanySlug } from '@/config';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { AppShell } from './AppShell';
import { BrandBoundary } from './BrandBoundary';
import { PublicOnly, RequireAuth, RequireRole } from './guards';

/** Routes of the platform's own address: the public website and company registration. */
const platformRoutes: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  { path: '/start', element: <StartPage /> },
  { path: '/start/check-email', element: <CheckEmailPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
];

/** Routes of a company's address: sign-in, links from emails, and the signed-in shell. */
const companyRoutes: RouteObject[] = [
  { element: <PublicOnly />, children: [{ path: '/login', element: <LoginPage /> }] },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/invite', element: <AcceptInvitationPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/change-password', element: <ChangePasswordPage /> },
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <HomePage /> },
          {
            element: <RequireRole roles={['CompanyHead']} />,
            children: [
              { path: '/organizations', element: <OrganizationsPage /> },
              { path: '/organizations/:id', element: <OrganizationDetailPage /> },
              { path: '/settings/brand', element: <BrandSettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];

/** The router for the address being viewed: the website on the platform address, the app on a company address. */
export const router = createBrowserRouter([
  { element: <BrandBoundary />, children: currentCompanySlug() === null ? platformRoutes : companyRoutes },
]);