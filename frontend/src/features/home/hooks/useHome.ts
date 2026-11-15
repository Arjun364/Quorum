import { ROLE_LABELS, useSession } from '@/features/auth';
import { useCompanyPublic } from '@/features/company';
import { useOrganizations } from '@/features/structure';
import { EMPTY_STATE_COPY } from '../constants';
import type { SetupStep, StatTile } from '../types';

/** Owns the home page data: the greeting, the role-specific empty state, and for the company head the figures and the setup checklist. */
export function useHome() {
  // Dependencies.
  const { user } = useSession();
  const { company } = useCompanyPublic();
  const { organizations } = useOrganizations();

  // Derived page data.
  const roleLabel = user ? ROLE_LABELS[user.systemRole] : '';
  const emptyState = user ? EMPTY_STATE_COPY[user.systemRole] : null;
  const departmentCount = organizations.reduce((sum, organization) => sum + organization.departmentCount, 0);
  const isCompanyHead = user?.systemRole === 'CompanyHead';

  const setupSteps: SetupStep[] = isCompanyHead
    ? [
        { id: 'brand', title: 'Add your logo and colours', body: 'Your people see your brand, not ours.', to: '/settings/brand', done: Boolean(company?.logoUrl) },
        { id: 'organization', title: 'Create your first organization', body: 'A unit of the company, such as a plant or a division.', to: '/organizations', done: organizations.length > 0 },
        { id: 'department', title: 'Add a department and invite its head', body: 'The department head starts meetings and invites the team.', to: '/organizations', done: departmentCount > 0 },
      ]
    : [];

  const finished = setupSteps.filter((step) => step.done).length;
  const stats: StatTile[] = isCompanyHead
    ? [
        { label: 'Organizations', value: String(organizations.length), note: organizations.length === 1 ? 'unit in your company' : 'units in your company' },
        { label: 'Departments', value: String(departmentCount), note: departmentCount === 1 ? 'ready for a head' : 'across all organizations' },
        { label: 'Setup', value: `${finished}/${setupSteps.length}`, note: finished === setupSteps.length ? 'everything is in place' : 'steps done' },
      ]
    : [];

  return { user, companyName: company?.name ?? 'Quorum', roleLabel, emptyState, setupSteps, stats };
}