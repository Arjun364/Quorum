import { Button, Dialog, TextField } from '@/shared';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { DeclineDialogProps } from '../types';

/** Dialog that declines a move, with an optional note that the others can read. */
export function DeclineDialog({ transfer, isSubmitting, onSubmit, onClose }: DeclineDialogProps) {
  const [note, setNote] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(note.trim());
  };
  return (
    <Dialog open={transfer !== null} title={transfer ? `Decline the move of ${transfer.person.name}?` : 'Decline'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <TextField label="Note (optional)" name="note" autoComplete="off" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? 'Declining…' : 'Decline Move'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}