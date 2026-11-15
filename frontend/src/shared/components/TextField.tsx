import { useId } from 'react';
import type { TextFieldProps } from '../types';

/** Renders a labelled input with an optional hint, inline error and trailing control, wired for screen readers. */
export function TextField({ label, error, hint, trailing, className = '', ref, ...input }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`field block min-h-12 w-full rounded-lg border bg-surface px-3.5 text-base text-ink placeholder:text-muted/70 ${
            error ? 'border-danger' : 'border-line hover:border-muted'
          } ${trailing ? 'pr-20' : ''}`}
          {...input}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
