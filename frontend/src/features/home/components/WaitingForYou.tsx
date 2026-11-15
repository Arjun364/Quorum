import { stagger } from '@/shared';
import type { WaitingForYouProps } from '../types';

/** Renders the "Waiting for You" section with its empty state (real items arrive in later milestones). */
export function WaitingForYou({ emptyState }: WaitingForYouProps) {
  return (
    <section aria-labelledby="waiting-heading" data-enter style={stagger(3)} className="mt-12">
      <h2 id="waiting-heading" className="text-lg font-semibold">
        Waiting for You
      </h2>
      <div className="mt-4 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none">
            <path
              d="M5 12.5l4.2 4.2L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="mt-4 font-medium">{emptyState.title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted text-pretty">{emptyState.body}</p>
      </div>
    </section>
  );
}
