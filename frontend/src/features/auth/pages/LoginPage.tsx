import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../../api/client';
import { signIn } from '../../../app/auth/session';
import { Alert } from '../../../components/Alert';
import { Button } from '../../../components/Button';
import { Logo } from '../../../components/Logo';
import { PasswordField, TextField } from '../../../components/TextField';

interface FieldErrors {
  email?: string;
  password?: string;
}

const PREVIEW_ROWS = [
  { text: 'Share ISO audit schedule with the team', owner: 'Anjali', state: 'Confirmed', tone: 'ok' },
  { text: 'Move UAT sign-off for Client Portal', owner: 'Rahul', state: 'Waiting', tone: 'warn' },
  { text: 'Phone use on the floor', owner: 'Standing point', state: 'Discussed', tone: 'ok' },
] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    const next: FieldErrors = {};
    if (!email) next.email = 'Enter your work email.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    setFormError(null);
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();

    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (e) {
      setFormError(
        e instanceof ApiError && e.status === 401
          ? 'That email and password do not match. Check them and try again.'
          : e instanceof ApiError && e.status === 429
            ? 'Too many attempts. Wait a minute, then try again.'
            : 'We could not reach the server. Check your connection and try again.',
      );
      passwordRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="hidden flex-col justify-between bg-accent p-12 text-accent-ink lg:flex">
        <Logo className="text-accent-ink" />
        <div className="max-w-lg">
          <p className="text-sm font-medium uppercase tracking-widest opacity-75">Monthly department meetings</p>
          <h2 className="mt-4 font-display text-5xl font-semibold leading-[1.08] tracking-tight text-pretty">
            Every point has an owner. Every meeting ends confirmed.
          </h2>
          <p className="mt-5 max-w-md text-lg opacity-85 text-pretty">
            Record the decisions, let each owner confirm their own points, and watch unfinished work carry
            over by itself.
          </p>
          <div aria-hidden="true" className="mt-10 rounded-xl bg-surface p-5 text-ink shadow-lg">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Sales · Monthly meeting</p>
            <ul className="mt-3 divide-y divide-line">
              {PREVIEW_ROWS.map((row) => (
                <li key={row.text} className="flex items-center justify-between gap-4 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{row.text}</span>
                    <span className="block text-xs text-muted">{row.owner}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.tone === 'ok' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'
                    }`}
                  >
                    {row.state}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-sm opacity-70">Minutes stay inside your organization.</p>
      </aside>

      <main id="main" className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <Logo className="mb-10 text-ink lg:hidden" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Sign In</h1>
          <p className="mt-2 text-muted">Use the email your administrator registered for you.</p>

          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
            {formError && <Alert tone="error">{formError}</Alert>}
            <TextField
              ref={emailRef}
              label="Work Email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              spellCheck={false}
              autoCapitalize="none"
              placeholder="you@company.com…"
              error={errors.email}
            />
            <PasswordField
              ref={passwordRef}
              label="Password"
              name="password"
              autoComplete="current-password"
              error={errors.password}
            />
            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? 'Signing In…' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-8 text-sm text-muted">
            Trouble signing in? Ask your department head or administrator to reset your password.
          </p>
        </div>
      </main>
    </div>
  );
}
