import { Alert, Button, Dialog, TextField } from '@/shared';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { PEOPLE_MESSAGES } from '../constants';
import type { InviteEmployeeDialogProps } from '../types';

/** Dialog that invites an employee by name and exact email address. */
export function InviteEmployeeDialog({ open, departmentName, isSubmitting, error, onSubmit, onClose }: InviteEmployeeDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  /** Validates and hands the values to the page hook. */
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!name.trim()) return setProblem(PEOPLE_MESSAGES.nameRequired);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setProblem(PEOPLE_MESSAGES.emailInvalid);
    setProblem(null);
    onSubmit({ name: name.trim(), email: email.trim() });
  };

  return (
    <Dialog open={open} title={`Invite to ${departmentName}`} description="They get an email, set their own password and land in your department." onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {(error ?? problem) && <Alert tone="error">{error ?? problem}</Alert>}
        <TextField label="Full Name" name="name" autoComplete="off" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label="Work Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          hint="They must register with exactly this address."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}