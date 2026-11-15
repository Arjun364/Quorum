import { Alert, Button, Dialog, TextField } from '@/shared';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { InviteHeadDialogProps } from '../types';

/** Dialog that invites a department head by name and exact email address. */
export function InviteHeadDialog({ open, departmentName, isSubmitting, error, onSubmit, onClose }: InviteHeadDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  /** Validates and hands the values to the page hook. */
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!name.trim()) return setProblem('Enter the person’s name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setProblem('Enter an email address with an @.');
    setProblem(null);
    onSubmit({ name: name.trim(), email: email.trim() });
  };

  return (
    <Dialog
      open={open}
      title={`Invite the Head of ${departmentName}`}
      description="They get an email, set their own password, and can then invite their team."
      onClose={onClose}
    >
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