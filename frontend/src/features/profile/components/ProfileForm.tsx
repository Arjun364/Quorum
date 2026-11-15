import { Alert, Button, TextField } from '@/shared';
import type { ProfileFormProps } from '../types';

/** The person's own details: name, job title and phone editable, the email shown but fixed by their invitation. */
export function ProfileForm({ profile, errors, formError, saved, isSaving, onEdit, onSubmit }: ProfileFormProps) {
  return (
    <form onSubmit={onSubmit} onChange={onEdit} noValidate className="space-y-5">
      {formError && <Alert tone="error">{formError}</Alert>}
      {saved && <Alert tone="success">Saved.</Alert>}
      <TextField label="Full Name" name="name" autoComplete="name" defaultValue={profile.name} error={errors.name} />
      <TextField label="Job Title" name="jobTitle" autoComplete="organization-title" defaultValue={profile.jobTitle ?? ''} placeholder="Quality Engineer…" />
      <TextField label="Phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={profile.phone ?? ''} error={errors.phone} hint="Only your department head and the company head see this." />
      <TextField label="Email" name="email" value={profile.email} readOnly hint="Fixed by your invitation. Ask your head if it must change." />
      <Button type="submit" loading={isSaving}>
        {isSaving ? 'Saving…' : 'Save Profile'}
      </Button>
    </form>
  );
}