import { Button, Icon } from '@/shared';
import { APPROVER_LABELS } from '../constants';
import type { TransferCardProps } from '../types';
import { formatDate } from '../utils';

const STATUS_STYLE: Record<string, string> = {
  Pending: 'bg-warn-soft text-warn',
  Completed: 'bg-ok-soft text-ok',
  Rejected: 'bg-danger-soft text-danger',
  Cancelled: 'bg-surface-2 text-muted',
};

/** Renders one move: who goes where, which approvals are in, and the actions the viewer may take. */
export function TransferCard({ transfer, isBusy, onApprove, onDecline, onCancel }: TransferCardProps) {
  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{transfer.person.name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            {transfer.from.name}
            <Icon name="arrow" className="size-4" />
            <span className="text-ink">{transfer.to.name}</span>
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[transfer.status]}`}>{transfer.status}</span>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Approvals">
        {transfer.needs.map((approver) => {
          const done = transfer.approved.includes(approver);
          return (
            <li
              key={approver}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${done ? 'border-ok/40 bg-ok-soft text-ok' : 'border-line text-muted'}`}
            >
              {done ? <Icon name="check" className="size-3.5" /> : <Icon name="clock" className="size-3.5" />}
              {APPROVER_LABELS[approver]}
              <span className="sr-only">{done ? ' approved' : ' waiting'}</span>
            </li>
          );
        })}
      </ul>

      <p className="eyebrow mt-4 !text-[0.65rem]">
        Requested {formatDate(transfer.createdAt)}
        {transfer.completedAt && ` · moved ${formatDate(transfer.completedAt)}`}
      </p>
      {transfer.note && <p className="mt-2 text-sm text-muted">“{transfer.note}”</p>}

      {(transfer.canApprove || transfer.canCancel) && (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {transfer.canApprove && (
            <>
              <Button className="!min-h-9" disabled={isBusy} onClick={() => onApprove(transfer.id)}>
                Approve
              </Button>
              <Button variant="secondary" className="!min-h-9" disabled={isBusy} onClick={() => onDecline(transfer)}>
                Decline
              </Button>
            </>
          )}
          {transfer.canCancel && (
            <Button variant="ghost" className="!min-h-9" disabled={isBusy} onClick={() => onCancel(transfer.id)}>
              Withdraw
            </Button>
          )}
        </div>
      )}
    </li>
  );
}