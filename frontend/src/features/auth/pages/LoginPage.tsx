import { BrandMark } from '@/features/company';
import { stagger } from '@/shared';
import { LoginForm, LoginHero } from '../components';
import { useLogin } from '../hooks';

/** Sign-in page on a company's own address: its brand on the left, the form on the right; all behaviour comes from `useLogin`. */
export function LoginPage() {
  const login = useLogin();
  const name = login.company?.name ?? 'Quorum';

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <LoginHero companyName={name} logoUrl={login.company?.logoUrl ?? null} showPoweredBy={login.company?.showPoweredBy ?? true} />
      <main id="main" className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div data-enter="fade" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <BrandMark name={name} logoUrl={login.company?.logoUrl ?? null} />
            <span className="font-display text-lg font-semibold tracking-tight">{name}</span>
          </div>
          <h1 data-enter style={stagger(1)} className="font-display text-3xl font-semibold tracking-tight">
            Sign In
          </h1>
          <p data-enter style={stagger(2)} className="mt-2 text-muted">
            Use the email {name} registered for you.
          </p>
          <div data-enter style={stagger(3)}>
            <LoginForm
              emailRef={login.emailRef}
              passwordRef={login.passwordRef}
              errors={login.errors}
              formError={login.formError}
              isSubmitting={login.isSubmitting}
              needsVerification={login.needsVerification}
              resendStatus={login.resendStatus}
              onResend={login.handleResend}
              onSubmit={login.handleSubmit}
            />
          </div>
          <p data-enter="fade" style={stagger(5)} className="mt-8 text-sm text-muted">
            Trouble signing in? Ask your department head or company head to reset your password.
          </p>
        </div>
      </main>
    </div>
  );
}