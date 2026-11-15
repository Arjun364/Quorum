import { Alert, stagger } from '@/shared';
import { DeclineDialog, TransferCard } from '../components';
import { useTransfers } from '../hooks';

/** Moves between departments: the ones waiting for the viewer, and the history; all behaviour comes from `useTransfers`. */
export function TransfersPage() {
  const page = useTransfers();

  return (
    <>
      <p data-enter className="eyebrow">
        People
      </p>
      <h1 data-enter style={stagger(1)} className="mt-3 text-4xl font-medium leading-[1.05] sm:text-5xl">
        Moves
      </h1>
      <p data-enter style={stagger(2)} className="mt-2 max-w-xl text-muted text-pretty">
        A person moves when everyone who must agree has agreed. Both department heads, and the company head when it crosses organizations.
      </p>

      <div className="mt-10 space-y-10">
        {page.loadFailed && <Alert tone="error">We could not load the moves. Reload the page to try again.</Alert>}
        {page.error && <Alert tone="error">{page.error}</Alert>}
        {page.isLoading && <p role="status" className="text-muted">Loading…</p>}

        {!page.isLoading && (
          <section aria-labelledby="waiting-heading">
            <h2 id="waiting-heading" className="eyebrow">
              Waiting
            </h2>
            {page.waiting.length === 0 ? (
              <div className="card mt-3 border-dashed px-6 py-12 text-center">
                <p className="font-medium">No moves waiting</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted">Start one from a department’s people list with Move.</p>
              </div>
            ) : (
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {page.waiting.map((transfer) => (
                  <TransferCard key={transfer.id} transfer={transfer} isBusy={page.isBusy} onApprove={page.handleApprove} onDecline={page.openDecline} onCancel={page.handleCancel} />
                ))}
              </ul>
            )}
          </section>
        )}

        {page.history.length > 0 && (
          <section aria-labelledby="history-heading">
            <h2 id="history-heading" className="eyebrow">
              History
            </h2>
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {page.history.map((transfer) => (
                <TransferCard key={transfer.id} transfer={transfer} isBusy={page.isBusy} onApprove={page.handleApprove} onDecline={page.openDecline} onCancel={page.handleCancel} />
              ))}
            </ul>
          </section>
        )}
      </div>

      <DeclineDialog key={page.declineTarget?.id ?? 'none'} transfer={page.declineTarget} isSubmitting={page.isDeclining} onSubmit={page.handleDecline} onClose={page.closeDecline} />
    </>
  );
}