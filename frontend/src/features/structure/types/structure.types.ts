/** An organization (a unit inside the company). */
export interface Organization {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  departmentCount: number;
}

/** A department with its head, or the invitation waiting for one. */
export interface Department {
  id: number;
  organizationId: number;
  name: string;
  code: string;
  isActive: boolean;
  memberCount: number;
  head: { id: number; name: string; email: string } | null;
  pendingHeadInvitation: { id: number; name: string; email: string; expiresAt: string } | null;
}

/** Name and short code of a new organization or department. */
export interface NameAndCode {
  name: string;
  code: string;
}

/** Name and email of the person to invite. */
export interface InvitePayload {
  name: string;
  email: string;
}

/** The invitation the server created. */
export interface InvitationSummary {
  id: number;
  departmentId: number;
  name: string;
  email: string;
  expiresAt: string;
}