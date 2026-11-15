import { Logo } from '@/shared';
import { Link, Navigate, useLocation } from 'react-router-dom';

/** Shown after registration: asks the new company head to open the verification link sent to their email. */
export function CheckEmailPage() {
  const state = useLocation().state as { email?: string; slug?: string } | null;
  if (!state?.email) return <Navigate to="/start" replace />;

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-2xl items-center px-5 py-6">
        <Link to="/" aria-label="Quorum home">
          <Logo />
        </Link>
      </header>
      <main id="main" className="mx-auto max-w-xl px-5 pb-20 text-center">
        <span data-enter className="mx-auto mt-10 grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </span>
        <h1 data-enter className="mt-6 font-display text-4xl font-semibold tracking-tight">
          Check your inbox
        </h1>
        <p data-enter className="mt-3 text-muted text-pretty">
          We sent a verification link to <strong className="text-ink">{state.email}</strong>. Open it to activate your company. The link works once and
          expires in 24 hours.
        </p>
        <p data-enter className="mt-8 text-sm text-muted">
          Nothing is visible to anyone until you verify.
        </p>
      </main>
    </div>
  );
}