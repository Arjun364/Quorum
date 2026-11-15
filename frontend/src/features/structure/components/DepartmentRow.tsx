import { Button, initialsOf } from '@/shared';
import type { DepartmentRowProps } from '../types';
import { formatDate } from '../utils';

/** Renders one department with its head, or with the pending invitation (resend and revoke) or an invite button. */
export function DepartmentRow({ department, isBusy, onInvite, onResend, onRevoke }: DepartmentRowProps) {
  const { head, pendingHeadInvitation: invite } = department;
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3.5">
        <span aria-hidden="true" className="num grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-xs font-medium text-accent">
          {initialsOf(department.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{department.name}</p>
          <p className="text-sm text-muted">
            <span className="num">{department.code}</span> · {department.memberCount} {department.memberCount === 1 ? 'person' : 'people'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {head ? (
          <div className="text-right">
            <p className="text-sm font-medium">{head.name}</p>
            <p className="text-xs text-muted">Department Head</p>
          </div>
        ) : invite ? (
          <>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
                <span className="pulse-dot size-1.5 rounded-full bg-current" aria-hidden="true" />
                Invitation sent
              </span>
              <p className="mt-1 text-xs text-muted">
                {invite.email} · expires {formatDate(invite.expiresAt)}
              </p>
            </div>
            <Button variant="secondary" className="!min-h-9" disabled={isBusy} onClick={() => onResend(invite.id)}>
              Resend
            </Button>
            <Button variant="ghost" className="!min-h-9" disabled={isBusy} onClick={() => onRevoke(invite.id)}>
              Revoke
            </Button>
          </>
        ) : (
          <>
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">No head yet</span>
            <Button className="!min-h-9" onClick={() => onInvite(department)}>
              Invite Head
            </Button>
          </>
        )}
      </div>
    </li>
  );
}