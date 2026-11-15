import type { Approver } from '../types';

/** How each approval is named on screen. */
export const APPROVER_LABELS: Record<Approver, string> = {
  FromHead: 'Current head',
  ToHead: 'New head',
  CompanyHead: 'Company head',
};

/** User-facing messages of the people screens. */
export const PEOPLE_MESSAGES = {
  nameRequired: 'Enter the person’s name.',
  emailInvalid: 'Enter an email address with an @.',
  chooseDepartment: 'Choose a department.',
  unreachable: 'We could not reach the server. Check your connection and try again.',
} as const;