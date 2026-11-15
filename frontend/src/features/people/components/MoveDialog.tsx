import { Alert, Button, Dialog, SelectField } from '@/shared';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { PEOPLE_MESSAGES } from '../constants';
import type { MoveDialogProps } from '../types';

/** Dialog that asks which department a person should move to; the move still needs the heads' approval. */
export function MoveDialog({ person, options, isSubmitting, error, onSubmit, onClose }: MoveDialogProps) {
  const [chosen, setChosen] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const groups = [...new Set(options.map((o) => o.organizationName))];

  /** Checks a department was chosen and hands it to the page hook. */
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!chosen) return setProblem(PEOPLE_MESSAGES.chooseDepartment);
    setProblem(null);
    onSubmit(Number(chosen));
  };

  return (
    <Dialog
      open={person !== null}
      title={person ? `Move ${person.name}` : 'Move'}
      description="Both department heads agree first. Moving to another organization also needs the company head."
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {(error ?? problem) && <Alert tone="error">{error ?? problem}</Alert>}
        <SelectField label="Move To" value={chosen} onChange={(e) => setChosen(e.target.value)}>
          <option value="">Choose a department…</option>
          {groups.map((group) => (
            <optgroup key={group} label={group}>
              {options
                .filter((o) => o.organizationName === group)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                    {o.head ? ` · ${o.head.name}` : ' · no head yet'}
                  </option>
                ))}
            </optgroup>
          ))}
        </SelectField>
        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? 'Requesting…' : 'Request Move'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}