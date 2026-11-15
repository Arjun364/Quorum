import type { FormEvent } from 'react';
import type { DepartmentOption, InvitePayload, OpenInvitation, Person, Transfer } from './people.types';

/** Props of one person's row. */
export interface PersonRowProps {
  person: Person;
  canManage: boolean;
  isSelf: boolean;
  onMove: (person: Person) => void;
  onDeactivate: (person: Person) => void;
}

/** Props of one open invitation's row. */
export interface InvitationRowProps {
  invitation: OpenInvitation;
  isBusy: boolean;
  onResend: (id: number) => void;
  onRevoke: (id: number) => void;
}

/** Props of the dialog that invites an employee. */
export interface InviteEmployeeDialogProps {
  open: boolean;
  departmentName: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: InvitePayload) => void;
  onClose: () => void;
}

/** Props of the dialog that asks for a destination department. */
export interface MoveDialogProps {
  person: Person | null;
  fromDepartmentId: number;
  options: DepartmentOption[];
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (toDepartmentId: number) => void;
  onClose: () => void;
}

/** Props of the confirmation before deactivating a person. */
export interface DeactivateDialogProps {
  person: Person | null;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Props of one transfer's card. */
export interface TransferCardProps {
  transfer: Transfer;
  isBusy: boolean;
  onApprove: (id: number) => void;
  onDecline: (transfer: Transfer) => void;
  onCancel: (id: number) => void;
}

/** Props of the dialog that declines a move with an optional note. */
export interface DeclineDialogProps {
  transfer: Transfer | null;
  isSubmitting: boolean;
  onSubmit: (note: string) => void;
  onClose: () => void;
}

/** Submit handler type shared by the people dialogs. */
export type DialogSubmit = (event: FormEvent<HTMLFormElement>) => void;