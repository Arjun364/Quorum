import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../../api/client';
import { changePassword, signOut, useSession } from '../../../app/auth/session';
import { Alert } from '../../../components/Alert';
import { Button } from '../../../components/Button';
import { Logo } from '../../../components/Logo';
import { PasswordField } from '../../../components/TextField';
import { evaluatePassword } from '../passwordPolicy';

interface FieldErrors {
  current?: string;
  next?: string;
  confirm?: string;
}

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const forced = user?.mustChangePassword ?? false;
  const currentRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const rules = evaluatePassword(newPassword);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const current = String(data.get('current') ?? '');
    const next = String(data.get('next') ?? '');
    const confirm = String(data.get('confirm') ?? '');

    const found: FieldErrors = {};
    if (!current) found.current = 'Enter your current password.';
    if (rules.some((r) => !r.met)) found.next = 'Your new password does not meet every requirement yet.';
    if (next !== confirm) found.confirm = 'The two new passwords do not match.';
    setErrors(found);
    setFormError(null);
    if (found.current) return currentRef.current?.focus();
    if (found.next) return nextRef.current?.focus();
    if (found.confirm) return confirmRef.current?.focus();

    setSubmitting(true);
    try {
      await changePassword(current, next);
      navigate('/', { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        setFormError(e.errors?.length ? e.errors : [e.message]);
        currentRef.current?.focus();
      } else {
        setFormError(['We could not reach the server. Check your connection and try again.']);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-xl items-center justify-between px-5 py-6">
        <Logo />
        <Button variant="ghost" onClick={() => void signOut()}>
          Sign Out
        </Button>
      </header>
      <main id="main" className="mx-auto max-w-xl px-5 pb-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Choose a New Password</h1>
        <p className="mt-2 text-muted text-pretty">
          {forced
            ? 'You are using a temporary password. Choose your own to continue.'
            : 'Pick a password you do not use anywhere else.'}
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5 rounded-xl border border-line bg-surface p-6">
          {formError && (
            <Alert tone="error">
              <ul className="list-inside list-disc space-y-0.5">
                {formError.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Alert>
          )}
          <PasswordField
            ref={currentRef}
            label={forced ? 'Temporary Password' : 'Current Password'}
            name="current"
            autoComplete="current-password"
            error={errors.current}
          />
          <PasswordField
            ref={nextRef}
            label="New Password"
            name="next"
            autoComplete="new-password"
            error={errors.next}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <ul aria-label="Password requirements" className="-mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {rules.map((rule) => (
              <li key={rule.label} className={`flex items-center gap-2 ${rule.met ? 'text-ok' : 'text-muted'}`}>
                <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0" fill="none">
                  {rule.met ? (
                    <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <circle cx="8" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                  )}
                </svg>
                <span>
                  {rule.label}
                  <span className="sr-only">{rule.met ? ' (met)' : ' (not met yet)'}</span>
                </span>
              </li>
            ))}
          </ul>
          <PasswordField
            ref={confirmRef}
            label="Confirm New Password"
            name="confirm"
            autoComplete="new-password"
            error={errors.confirm}
          />
          <Button type="submit" loading={submitting} className="w-full sm:w-auto">
            {submitting ? 'Saving…' : 'Save New Password'}
          </Button>
        </form>
      </main>
    </div>
  );
}
