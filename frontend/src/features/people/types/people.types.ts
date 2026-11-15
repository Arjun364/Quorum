import type { SystemRole } from '@/shared';

/** One person as listed in a department; contact details only reach people who manage it. */
export interface Person {
  id: number;
  name: string;
  jobTitle: string | null;
  avatarUrl: string | null;
  systemRole: SystemRole;
  status: 'Pending' | 'Active' | 'Inactive';
  email?: string;
  phone?: string | null;
}

/** An invitation waiting to be accepted. */
export interface OpenInvitation {
  id: number;
  name: string;
  email: string;
  role: SystemRole;
  expiresAt: string;
}

/** A department's people and open invitations. */
export interface DepartmentPeople {
  department: { id: number; name: string; code: string };
  canManage: boolean;
  members: Person[];
  invitations: OpenInvitation[];
}

/** A department offered as a destination. */
export interface DepartmentOption {
  id: number;
  name: string;
  code: string;
  organizationId: number;
  organizationName: string;
  head: { id: number; name: string } | null;
}

/** The three approvals a move can need. */
export type Approver = 'FromHead' | 'ToHead' | 'CompanyHead';

/** A move between departments with what is still missing and what the viewer may do. */
export interface Transfer {
  id: number;
  status: 'Pending' | 'Completed' | 'Rejected' | 'Cancelled';
  person: { id: number; name: string };
  from: { id: number; name: string };
  to: { id: number; name: string };
  needs: Approver[];
  approved: Approver[];
  missing: Approver[];
  note: string | null;
  createdAt: string;
  completedAt: string | null;
  canApprove: boolean;
  canCancel: boolean;
}

/** Name and exact email of the person to invite. */
export interface InvitePayload {
  name: string;
  email: string;
}

/** What starts a move. */
export interface TransferPayload {
  userId: number;
  toDepartmentId: number;
}