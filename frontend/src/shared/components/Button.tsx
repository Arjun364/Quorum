import type { ButtonProps, ButtonVariant } from '../types';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'btn-primary bg-accent text-accent-ink hover:bg-accent-hover active:bg-accent-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-2 hover:border-muted active:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2 active:bg-surface-2',
};

/** Renders a button that steps up on hover and presses in on click; while `loading` it is disabled and shows a spinner so a request cannot be sent twice. */
export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4 animate-spin motion-reduce:animate-none"
          fill="none"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}
