import type { ReactNode } from 'react';

type Tone = 'error' | 'info';

const TONES: Record<Tone, string> = {
  error: 'border-danger/40 bg-danger-soft text-ink',
  info: 'border-line bg-surface-2 text-ink',
};

/** Inline message. Errors are announced politely to screen readers. */
export function Alert({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`rounded-lg border px-3.5 py-3 text-sm ${TONES[tone]}`}
    >
      {children}
    </div>
  );
}
