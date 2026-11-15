import { Alert, Button, Dialog, TextField } from '@/shared';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { NameCodeDialogProps } from '../types';
import { suggestCode } from '../utils';

/** Dialog with a name and a short code; the code follows the name until it is edited by hand. */
export function NameCodeDialog({ open, title, description, nameLabel, submitLabel, isSubmitting, error, onSubmit, onClose }: NameCodeDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  /** Validates and hands the values to the page hook. */
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!name.trim() || !code.trim()) {
      setProblem('Enter a name and a code.');
      return;
    }
    setProblem(null);
    onSubmit({ name: name.trim(), code: code.trim() });
  };

  return (
    <Dialog open={open} title={title} description={description} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {(error ?? problem) && <Alert tone="error">{error ?? problem}</Alert>}
        <TextField
          label={nameLabel}
          name="name"
          autoComplete="off"
          autoFocus
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!codeTouched) setCode(suggestCode(event.target.value));
          }}
        />
        <TextField
          label="Short Code"
          name="code"
          autoComplete="off"
          spellCheck={false}
          hint="Used in lists and reports. Letters, digits and hyphens."
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''));
            setCodeTouched(true);
          }}
        />
        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}