import { Button, Logo } from '@/shared';
import { ChangePasswordForm } from '../components';
import { useChangePassword } from '../hooks';

/** Change-password page: composes the header and form; all behaviour comes from `useChangePassword`. */
export function ChangePasswordPage() {
  const {
    currentRef,
    nextRef,
    confirmRef,
    errors,
    formErrors,
    rules,
    isForced,
    isSubmitting,
    setNewPassword,
    handleSubmit,
    signOut,
  } = useChangePassword();

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
          {isForced
            ? 'You are using a temporary password. Choose your own to continue.'
            : 'Pick a password you do not use anywhere else.'}
        </p>
        <ChangePasswordForm
          currentRef={currentRef}
          nextRef={nextRef}
          confirmRef={confirmRef}
          errors={errors}
          formErrors={formErrors}
          rules={rules}
          isForced={isForced}
          isSubmitting={isSubmitting}
          onNewPasswordChange={setNewPassword}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}
