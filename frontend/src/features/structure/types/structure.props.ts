import type { Department, InvitePayload, NameAndCode, Organization } from './structure.types';

/** Props of one organization card. */
export interface OrganizationCardProps {
  organization: Organization;
}

/** Props of the dialog that creates an organization or a department. */
export interface NameCodeDialogProps {
  open: boolean;
  title: string;
  description: string;
  nameLabel: string;
  submitLabel: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: NameAndCode) => void;
  onClose: () => void;
}

/** Props of the dialog that invites a department head. */
export interface InviteHeadDialogProps {
  open: boolean;
  departmentName: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: InvitePayload) => void;
  onClose: () => void;
}

/** Props of one row in the departments list. */
export interface DepartmentRowProps {
  department: Department;
  isBusy: boolean;
  onInvite: (department: Department) => void;
  onResend: (invitationId: number) => void;
  onRevoke: (invitationId: number) => void;
}