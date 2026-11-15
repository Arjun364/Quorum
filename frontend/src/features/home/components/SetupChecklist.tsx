import { stagger } from '@/shared';
import { Link } from 'react-router-dom';
import type { SetupChecklistProps } from '../types';

/** Renders the company head's setup steps as a checklist; finished steps are ticked, the next open step is highlighted. */
export function SetupChecklist({ steps }: SetupChecklistProps) {
  const nextId = steps.find((step) => !step.done)?.id;
  const finished = steps.filter((step) => step.done).length;

  return (
    <section aria-labelledby="setup-heading" data-enter style={stagger(2)} className="mt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="setup-heading" className="text-lg font-semibold">
          Set Up Your Company
        </h2>
        <p className="text-sm text-muted tabular-nums">
          {finished} of {steps.length} done
        </p>
      </div>
      <ol className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              to={step.to}
              className={`lift flex items-center gap-4 px-5 py-4 hover:bg-surface-2 ${step.id === nextId ? 'bg-accent-soft' : ''}`}
            >
              <span
                aria-hidden="true"
                className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                  step.done ? 'border-ok bg-ok-soft text-ok' : 'border-line text-muted'
                }`}
              >
                {step.done ? '✓' : ''}
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{step.title}</span>
                <span className="block text-sm text-muted">{step.body}</span>
              </span>
              <span className="sr-only">{step.done ? 'Done' : 'To do'}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}