import { BrandMark, useCompanyPublic } from '@/features/company';
import { Button } from '@/shared';
import { Link } from 'react-router-dom';
import { useVerifyEmail } from '../hooks';

/** Landing page of the emailed verification link: confirms it once and points to the sign-in page; behaviour comes from `useVerifyEmail`. */
export function VerifyEmailPage() {
  const { status } = useVerifyEmail();
  const { company } = useCompanyPublic();
  const name = company?.name ?? 'Quorum';

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-xl items-center gap-2.5 px-5 py-6">
        <BrandMark name={name} logoUrl={company?.logoUrl ?? null} />
        <span className="font-display text-lg font-semibold tracking-tight">{name}</span>
      </header>
      <main id="main" className="mx-auto max-w-xl px-5 pb-20 text-center" aria-live="polite">
        {status === 'verifying' && <p role="status" className="mt-16 text-muted">Verifying your email…</p>}
        {status === 'done' && (
          <>
            <span data-enter className="mx-auto mt-10 grid size-16 place-items-center rounded-full bg-ok-soft text-ok">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12.5 4.2 4.2L19 7" />
              </svg>
            </span>
            <h1 data-enter className="mt-6 text-4xl font-medium leading-[1.05] sm:text-5xl">Your email is verified</h1>
            <p data-enter className="mt-3 text-muted">{name} is now active. Sign in to set up your organizations.</p>
            <Link to="/login" className="mt-8 inline-block" data-enter>
              <Button>Sign In</Button>
            </Link>
          </>
        )}
        {status === 'invalid' && (
          <>
            <h1 className="mt-16 text-4xl font-medium leading-[1.05] sm:text-5xl">This link does not work</h1>
            <p className="mt-3 text-muted text-pretty">It may have been used already or expired. Sign in to ask for a new verification email.</p>
            <Link to="/login" className="mt-8 inline-block">
              <Button variant="secondary">Go to Sign In</Button>
            </Link>
          </>
        )}
      </main>
    </div>
  );
}