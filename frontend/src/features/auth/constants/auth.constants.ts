import type { LoginPreviewRow, SystemRole } from '../types';

/** Human-readable role names shown in the interface. */
export const ROLE_LABELS: Record<SystemRole, string> = {
  PlatformOwner: 'Platform Owner',
  CompanyHead: 'Company Head',
  DepartmentHead: 'Department Head',
  Employee: 'Employee',
};

/** Illustrative rows for the preview card on the sign-in page. */
export const LOGIN_PREVIEW_ROWS: readonly LoginPreviewRow[] = [
  { text: 'Share ISO audit schedule with the team', owner: 'Anjali', state: 'Confirmed', tone: 'ok' },
  { text: 'Move UAT sign-off for Client Portal', owner: 'Rahul', state: 'Waiting', tone: 'warn' },
  { text: 'Phone use on the floor', owner: 'Standing point', state: 'Discussed', tone: 'ok' },
];

/** User-facing messages of the authentication screens. */
export const AUTH_MESSAGES = {
  emailRequired: 'Enter your work email.',
  passwordRequired: 'Enter your password.',
  currentRequired: 'Enter your current password.',
  newNotStrong: 'Your new password does not meet every requirement yet.',
  confirmMismatch: 'The two new passwords do not match.',
  loginRejected: 'That email and password do not match. Check them and try again.',
  tooManyAttempts: 'Too many attempts. Wait a minute, then try again.',
  unreachable: 'We could not reach the server. Check your connection and try again.',
} as const;
