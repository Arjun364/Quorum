import { Logo, stagger } from '@/shared';
import { Link } from 'react-router-dom';
import { SignupForm } from '../components';
import { useSignup } from '../hooks';

/** Public registration page: the company head creates the company account; all behaviour comes from `useSignup`. */
export function StartPage() {
  const signup = useSignup();

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-6">
        <Link to="/" aria-label="Quorum home">
          <Logo />
        </Link>
        <Link to="/" className="link-draw text-sm font-medium text-muted hover:text-ink">
          Back to the website
        </Link>
      </header>
      <main id="main" className="mx-auto max-w-2xl px-5 pb-20">
        <p data-enter className="eyebrow">
          Step 1 of 4 · Company
        </p>
        <h1 data-enter style={stagger(1)} className="mt-2 text-4xl font-medium leading-[1.05] sm:text-5xl">
          Start your organization
        </h1>
        <p data-enter style={stagger(2)} className="mt-2 text-muted text-pretty">
          You become the company head: the one account that sets up organizations and departments and invites each department head.
        </p>
        <div data-enter style={stagger(3)}>
          <SignupForm
            values={signup.values}
            errors={signup.errors}
            formError={signup.formError}
            slugStatus={signup.slugStatus}
            rootHost={signup.rootHost}
            passwordRules={signup.passwordRules}
            isSubmitting={signup.isSubmitting}
            onChange={signup.handleChange}
            onSubmit={signup.handleSubmit}
          />
        </div>
      </main>
    </div>
  );
}