import { Icon } from '@/shared';
import { Link } from 'react-router-dom';
import type { OrganizationCardProps } from '../types';

/** Renders one organization as a card that links to its departments. */
export function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <Link to={`/organizations/${organization.id}`} className="lift card group flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-accent">
          <Icon name="building" />
        </span>
        <span className="eyebrow">{organization.code}</span>
      </div>
      <h2 className="mt-6 text-2xl font-medium leading-tight">{organization.name}</h2>
      <p className="mt-auto flex items-center justify-between pt-6 text-sm text-muted">
        <span>
          <span className="num text-ink">{organization.departmentCount}</span> {organization.departmentCount === 1 ? 'department' : 'departments'}
        </span>
        <Icon name="arrow" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink" />
      </p>
    </Link>
  );
}