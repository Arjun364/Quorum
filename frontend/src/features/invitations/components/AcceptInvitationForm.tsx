import { Alert, Button, PasswordField, PasswordRequirements, TextField } from '@/shared';
import type { AcceptInvitationFormProps } from '../types';

/** Renders the invited person's form: a fixed email, their name and a password of their own; validation belongs to the page hook. */
export function AcceptInvitationForm({
  invitation,
  name,
  errors,
  formError,
  rules,
  isSubmitting,
  onNameChange,
  onPasswordChange,
  onSubmit,
}: AcceptInvitationFormProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
      {formError && <Alert tone="error">{formError}</Alert>}
      <TextField label="Email" name="email" value={invitation.email} readOnly hint="Fixed by the invitation." className="[&_input]:bg-surface-2" />
      <TextField label="Full Name" name="name" autoComplete="name" value={name} error={errors.name} onChange={(e) => onNameChange(e.target.value)} />
      <PasswordField
        label="Choose a Password"
        name="password"
        autoComplete="new-password"
        error={errors.password}
        onChange={(e) => onPasswordChange(e.target.value)}
      />
      <PasswordRequirements rules={rules} />
      <Button type="submit" loading={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating…' : 'Create My Account'}
      </Button>
    </form>
  );
}