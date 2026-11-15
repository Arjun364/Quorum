import type { SystemRole } from '@/shared';

/** What the invited person sees before accepting. */
export interface InvitationLookup {
  companyName: string;
  departmentName: string;
  name: string;
  /** Fixed by the invitation: the account is created with exactly this address. */
  email: string;
  role: SystemRole;
}

/** Body of the accept-invitation request. */
export interface AcceptPayload {
  token: string;
  name: string;
  password: string;
}

/** Inline validation messages of the accept form. */
export interface AcceptErrors {
  name?: string;
  password?: string;
}