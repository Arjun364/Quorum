import { Button, Icon } from '@/shared';
import type { InvitationRowProps } from '../types';
import { formatDate } from '../utils';

/** Renders one invitation that has not been accepted yet, with resend and revoke. */
export function InvitationRow({ invitation, isBusy, onResend, onRevoke }: InvitationRowProps) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-warn-soft text-warn">
          <Icon name="mail" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{invitation.name}</p>
          <p className="truncate text-sm text-muted">
            <span className="num">{invitation.email}</span> · expires {formatDate(invitation.expiresAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
          <span className="pulse-dot size-1.5 rounded-full bg-current" aria-hidden="true" />
          Invited
        </span>
        <Button variant="secondary" className="!min-h-9" disabled={isBusy} onClick={() => onResend(invitation.id)}>
          Resend
        </Button>
        <Button variant="ghost" className="!min-h-9" disabled={isBusy} onClick={() => onRevoke(invitation.id)}>
          Revoke
        </Button>
      </div>
    </li>
  );
}