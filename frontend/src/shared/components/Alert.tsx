import type { AlertProps, AlertTone } from '../types';

const TONES: Record<AlertTone, string> = {
  error: 'border-danger/40 bg-danger-soft text-ink',
  info: 'border-line bg-surface-2 text-ink',
};

/** Renders an inline message; errors are announced politely to screen readers. */
export function Alert({ tone = 'info', children }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      data-enter
      className={`rounded-xl border px-3.5 py-3 text-sm ${TONES[tone]}`}
    >
      {children}
    </div>
  );
}
