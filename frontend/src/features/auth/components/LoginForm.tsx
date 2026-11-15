import { Alert, Button, PasswordField, TextField } from '@/shared';
import type { LoginFormProps } from '../types';

/** Renders the email and password fields with inline errors; submission and validation belong to the page hook. */
export function LoginForm({
  emailRef,
  passwordRef,
  errors,
  formError,
  isSubmitting,
  needsVerification,
  resendStatus,
  onResend,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
      {formError && (
        <Alert tone="error">
          <p>{formError}</p>
          {needsVerification && (
            <p className="mt-2">
              {resendStatus === 'sent' ? (
                <span className="font-medium">A new link is on its way. Check your inbox.</span>
              ) : (
                <button type="button" disabled={resendStatus === 'sending'} onClick={onResend} className="link-draw font-semibold">
                  {resendStatus === 'sending' ? 'Sending…' : 'Send a New Verification Email'}
                </button>
              )}
            </p>
          )}
        </Alert>
      )}
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
      <PasswordField ref={passwordRef} label="Password" name="password" autoComplete="current-password" error={errors.password} />
      <Button type="submit" loading={isSubmitting} className="w-full">
        {isSubmitting ? 'Signing In…' : 'Sign In'}
      </Button>
    </form>
  );
}