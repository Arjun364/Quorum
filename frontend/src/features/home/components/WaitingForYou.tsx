import { Icon, stagger } from '@/shared';
import type { WaitingForYouProps } from '../types';

/** Renders the "Waiting for You" section with its empty state (real items arrive in later milestones). */
export function WaitingForYou({ emptyState }: WaitingForYouProps) {
  return (
    <section aria-labelledby="waiting-heading" data-enter style={stagger(6)} className="mt-10">
      <h2 id="waiting-heading" className="eyebrow">
        Waiting for you
      </h2>
      <div className="card mt-3 flex items-center gap-5 p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Icon name="check" className="size-6" />
        </span>
        <div>
          <p className="font-medium">{emptyState.title}</p>
          <p className="mt-0.5 max-w-lg text-sm text-muted text-pretty">{emptyState.body}</p>
        </div>
      </div>
    </section>
  );
}