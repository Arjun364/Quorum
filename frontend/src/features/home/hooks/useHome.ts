import { ROLE_LABELS, useSession } from '@/features/auth';
import { useCompanyPublic } from '@/features/company';
import { useOrganizations } from '@/features/structure';
import { EMPTY_STATE_COPY } from '../constants';
import type { SetupStep } from '../types';

/** Owns the home page data: the greeting, the role-specific empty state and the company head's setup checklist. */
export function useHome() {
  // Dependencies.
  const { user } = useSession();
  const { company } = useCompanyPublic();
  const { organizations } = useOrganizations();

  // Derived page data.
  const roleLabel = user ? ROLE_LABELS[user.systemRole] : '';
  const emptyState = user ? EMPTY_STATE_COPY[user.systemRole] : null;
  const hasOrganization = organizations.length > 0;
  const hasDepartment = organizations.some((organization) => organization.departmentCount > 0);

  const setupSteps: SetupStep[] =
    user?.systemRole === 'CompanyHead'
      ? [
          { id: 'brand', title: 'Add your logo and colours', body: 'Your people see your brand, not ours.', to: '/settings/brand', done: Boolean(company?.logoUrl) },
          { id: 'organization', title: 'Create your first organization', body: 'A unit of the company, such as a plant or a division.', to: '/organizations', done: hasOrganization },
          { id: 'department', title: 'Add a department and invite its head', body: 'The department head starts meetings and invites the team.', to: '/organizations', done: hasDepartment },
        ]
      : [];

  return { user, roleLabel, emptyState, setupSteps };
}