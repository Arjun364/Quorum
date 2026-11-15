import { useId } from 'react';
import type { SelectFieldProps } from '../types';

/** Renders a labelled drop-down list with an optional hint and inline error, wired for screen readers. */
export function SelectField({ label, error, hint, className = '', children, ...select }: SelectFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={`field block min-h-12 w-full rounded-lg border bg-surface px-3.5 text-base text-ink ${error ? 'border-danger' : 'border-line hover:border-muted'}`}
        {...select}
      >
        {children}
      </select>
      {hint && !error && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}