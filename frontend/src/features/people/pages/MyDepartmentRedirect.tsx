import { useSession } from '@/features/auth';
import { Navigate } from 'react-router-dom';

/** Sends a person to their own department's people list; the company head, who has no department, goes to the organizations. */
export function MyDepartmentRedirect() {
  const { user } = useSession();
  if (!user) return null;
  return <Navigate to={user.departmentId ? `/departments/${user.departmentId}/people` : '/organizations'} replace />;
}