import { useSession } from '@/features/auth';
import type { SystemRole } from '@/shared';
import { Navigate, Outlet } from 'react-router-dom';

/** Lets only the listed roles through; everyone else goes home. The server enforces the same rule on every request. */
export function RequireRole({ roles }: { roles: SystemRole[] }) {
  const { user } = useSession();
  if (!user || !roles.includes(user.systemRole)) return <Navigate to="/" replace />;
  return <Outlet />;
}