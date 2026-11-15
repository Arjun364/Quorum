import { Alert, Button, Dialog } from '@/shared';
import type { DeactivateDialogProps } from '../types';

/** Confirmation before a person is deactivated: they can no longer sign in, and their history stays. */
export function DeactivateDialog({ person, isSubmitting, error, onConfirm, onClose }: DeactivateDialogProps) {
  return (
    <Dialog
      open={person !== null}
      title={person ? `Deactivate ${person.name}?` : 'Deactivate'}
      description="They can no longer sign in. Their points and history stay in the minutes."
      onClose={onClose}
    >
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose}>
            Keep Them
          </Button>
          <Button onClick={onConfirm} loading={isSubmitting}>
            {isSubmitting ? 'Deactivating…' : 'Deactivate'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}