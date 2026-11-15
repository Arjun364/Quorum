import { Alert, Button, PasswordField, PasswordRequirements, TextField } from '@/shared';
import type { SignupFormProps } from '../types';

/** Renders the company registration fields with the live address check and password checklist; validation belongs to the page hook. */
export function SignupForm({
  values,
  errors,
  formError,
  slugStatus,
  rootHost,
  passwordRules,
  isSubmitting,
  onChange,
  onSubmit,
}: SignupFormProps) {
  const slugHint =
    slugStatus.state === 'available'
      ? `${values.slug}.${rootHost} is available.`
      : slugStatus.state === 'checking'
        ? 'Checking the address…'
        : `Your people sign in at ${values.slug || 'your-company'}.${rootHost}`;

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
      {formError && <Alert tone="error">{formError}</Alert>}
      <TextField
        label="Company Name"
        name="companyName"
        autoComplete="organization"
        value={values.companyName}
        error={errors.companyName}
        onChange={(event) => onChange('companyName', event.target.value)}
      />
      <TextField
        label="Company Address"
        name="slug"
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="none"
        value={values.slug}
        error={errors.slug ?? (slugStatus.state === 'unavailable' ? slugStatus.reason : undefined)}
        hint={slugHint}
        onChange={(event) => onChange('slug', event.target.value)}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Your Name"
          name="name"
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(event) => onChange('name', event.target.value)}
        />
        <TextField
          label="Your Title"
          name="jobTitle"
          autoComplete="organization-title"
          placeholder="CEO…"
          value={values.jobTitle}
          onChange={(event) => onChange('jobTitle', event.target.value)}
        />
      </div>
      <TextField
        label="Company Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        spellCheck={false}
        autoCapitalize="none"
        hint="We send a verification link to this address."
        value={values.email}
        error={errors.email}
        onChange={(event) => onChange('email', event.target.value)}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        value={values.password}
        error={errors.password}
        onChange={(event) => onChange('password', event.target.value)}
      />
      <PasswordRequirements rules={passwordRules} />
      <Button type="submit" loading={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating…' : 'Create Company Account'}
      </Button>
    </form>
  );
}