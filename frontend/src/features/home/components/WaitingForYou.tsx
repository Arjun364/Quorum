import type { WaitingForYouProps } from '../types';

/** Renders the "Waiting for You" section with its empty state (real items arrive in later milestones). */
export function WaitingForYou({ emptyState }: WaitingForYouProps) {
  return (
    <section aria-labelledby="waiting-heading" className="mt-10">
      <h2 id="waiting-heading" className="text-lg font-semibold">
        Waiting for You
      </h2>
      <div className="mt-3 rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center">
        <p className="font-medium">{emptyState.title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted text-pretty">{emptyState.body}</p>
      </div>
    </section>
  );
}
