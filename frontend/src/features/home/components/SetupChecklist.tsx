import { Icon, stagger } from '@/shared';
import { Link } from 'react-router-dom';
import type { SetupChecklistProps } from '../types';

/** Renders the company head's setup steps on a lit panel with a progress bar; finished steps are ticked and the next open step is highlighted. */
export function SetupChecklist({ steps }: SetupChecklistProps) {
  const nextId = steps.find((step) => !step.done)?.id;
  const finished = steps.filter((step) => step.done).length;
  const percent = Math.round((finished / steps.length) * 100);

  return (
    <section aria-labelledby="setup-heading" data-enter style={stagger(5)} className="glow-panel card mt-4 overflow-hidden">
      <div className="p-6 pb-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="setup-heading" className="text-2xl font-medium">
            Set up your company
          </h2>
          <p className="num text-sm text-muted">
            {finished}/{steps.length}
          </p>
        </div>
        <div role="progressbar" aria-label="Setup progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <ol className="divide-y divide-line border-t border-line">
        {steps.map((step, index) => (
          <li key={step.id}>
            <Link to={step.to} className={`lift group flex items-center gap-4 px-6 py-4 hover:bg-surface-2/60 ${step.id === nextId ? 'bg-accent-soft/50' : ''}`}>
              <span
                aria-hidden="true"
                className={`num grid size-8 shrink-0 place-items-center rounded-full border text-xs ${
                  step.done ? 'border-ok bg-ok-soft text-ok' : step.id === nextId ? 'border-accent text-accent' : 'border-line text-muted'
                }`}
              >
                {step.done ? <Icon name="check" className="size-4" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{step.title}</span>
                <span className="block text-sm text-muted">{step.body}</span>
              </span>
              <Icon name="arrow" className="size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink" />
              <span className="sr-only">{step.done ? 'Done' : 'To do'}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}