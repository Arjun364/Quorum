import { Alert, Button, PasswordField, PasswordRequirements } from '@/shared';
import type { ChangePasswordFormProps } from '../types';

/** Renders the three password fields and the live requirement checklist; validation belongs to the page hook. */
export function ChangePasswordForm({
  currentRef,
  nextRef,
  confirmRef,
  errors,
  formErrors,
  rules,
  isForced,
  isSubmitting,
  onNewPasswordChange,
  onSubmit,
}: ChangePasswordFormProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5 rounded-xl border border-line bg-surface p-6">
      {formErrors && (
        <Alert tone="error">
          <ul className="list-inside list-disc space-y-0.5">
            {formErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}
      <PasswordField
        ref={currentRef}
        label={isForced ? 'Temporary Password' : 'Current Password'}
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
        onChange={(event) => onNewPasswordChange(event.target.value)}
      />
      <PasswordRequirements rules={rules} />
      <PasswordField
        ref={confirmRef}
        label="Confirm New Password"
        name="confirm"
        autoComplete="new-password"
        error={errors.confirm}
      />
      <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Saving…' : 'Save New Password'}
      </Button>
    </form>
  );
}
