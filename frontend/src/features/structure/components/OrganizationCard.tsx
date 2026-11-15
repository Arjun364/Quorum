import { Link } from 'react-router-dom';
import type { OrganizationCardProps } from '../types';

/** Renders one organization as a card that links to its departments. */
export function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <Link
      to={`/organizations/${organization.id}`}
      className="lift block rounded-2xl border border-line bg-surface p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">{organization.code}</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">{organization.name}</h2>
      <p className="mt-6 text-sm text-muted">
        {organization.departmentCount} {organization.departmentCount === 1 ? 'department' : 'departments'}
      </p>
    </Link>
  );
}