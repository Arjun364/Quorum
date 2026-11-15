import { Avatar, Button } from '@/shared';
import { ROLE_LABELS } from '@/features/auth';
import type { PersonRowProps } from '../types';

/** Renders one person: photo, name, job title and role, and for managers the contact details with Move and Deactivate. */
export function PersonRow({ person, canManage, isSelf, onMove, onDeactivate }: PersonRowProps) {
  const inactive = person.status === 'Inactive';
  const isEmployee = person.systemRole === 'Employee';
  return (
    <li className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 ${inactive ? 'opacity-55' : ''}`}>
      <div className="flex min-w-0 items-center gap-3.5">
        <Avatar name={person.name} url={person.avatarUrl} className="size-11" />
        <div className="min-w-0">
          <p className="truncate font-medium">
            {person.name}
            {isSelf && <span className="eyebrow ml-2 !text-[0.65rem]">You</span>}
          </p>
          <p className="truncate text-sm text-muted">
            {person.jobTitle ?? ROLE_LABELS[person.systemRole]}
            {person.email && <span className="num"> · {person.email}</span>}
            {person.phone && <span className="num"> · {person.phone}</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {!isEmployee && <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">{ROLE_LABELS[person.systemRole]}</span>}
        {inactive && <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">Inactive</span>}
        {canManage && isEmployee && !inactive && (
          <>
            <Button variant="secondary" className="!min-h-9" onClick={() => onMove(person)}>
              Move
            </Button>
            {!isSelf && (
              <Button variant="ghost" className="!min-h-9" onClick={() => onDeactivate(person)}>
                Deactivate
              </Button>
            )}
          </>
        )}
      </div>
    </li>
  );
}