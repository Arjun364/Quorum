import { Logo } from '@/shared';
import { LoginForm, LoginHero } from '../components';
import { useLogin } from '../hooks';

/** Sign-in page: composes the brand panel and the form; all behaviour comes from `useLogin`. */
export function LoginPage() {
  const { emailRef, passwordRef, errors, formError, isSubmitting, handleSubmit } = useLogin();

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <LoginHero />
      <main id="main" className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <Logo className="mb-10 text-ink lg:hidden" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Sign In</h1>
          <p className="mt-2 text-muted">Use the email your administrator registered for you.</p>
          <LoginForm
            emailRef={emailRef}
            passwordRef={passwordRef}
            errors={errors}
            formError={formError}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
          <p className="mt-8 text-sm text-muted">
            Trouble signing in? Ask your department head or administrator to reset your password.
          </p>
        </div>
      </main>
    </div>
  );
}
