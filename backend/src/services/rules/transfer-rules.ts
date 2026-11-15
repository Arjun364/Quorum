import { SystemRole, UserStatus } from '@prisma/client';

/** The facts about a department that the transfer rules need. */
export interface DepartmentFacts {
  id: number;
  organizationId: number;
  headUserId: number | null;
}

/** The facts about the person being moved. */
export interface PersonFacts {
  id: number;
  systemRole: SystemRole;
  status: UserStatus;
  departmentId: number | null;
}

/** Who is asking: their id and role. */
export interface ActorFacts {
  id: number;
  systemRole: SystemRole;
}

/** The three approvals a transfer can need. */
export type Approver = 'FromHead' | 'ToHead' | 'CompanyHead';

/** Which approvals a transfer needs. */
export interface ApprovalNeeds {
  needFromHead: boolean;
  needToHead: boolean;
  needCompanyHead: boolean;
}

/** Which approvals have been given so far. */
export interface ApprovalState extends ApprovalNeeds {
  fromHeadApproved: boolean;
  toHeadApproved: boolean;
  companyHeadApproved: boolean;
}

/**
 * Why this person cannot be moved between these departments, or null when they can. A department head cannot move
 * until a replacement is named (the head slot must be handed over first), and only active employees move.
 */
export function transferBlocker(person: PersonFacts, from: DepartmentFacts, to: DepartmentFacts): string | null {
  if (person.status !== UserStatus.Active) return 'Only active people can be moved.';
  if (person.systemRole === SystemRole.DepartmentHead || from.headUserId === person.id) {
    return 'A department head cannot be moved until a replacement head is named.';
  }
  if (person.systemRole !== SystemRole.Employee) return 'Only employees can be moved between departments.';
  if (person.departmentId !== from.id) return 'This person is not in the department the move starts from.';
  if (from.id === to.id) return 'The person is already in that department.';
  return null;
}

/**
 * The approvals a move needs: both department heads, and the company head as well when the move crosses
 * organizations or when either department has no head to ask.
 */
export function approvalNeeds(from: DepartmentFacts, to: DepartmentFacts): ApprovalNeeds {
  const crossesOrganizations = from.organizationId !== to.organizationId;
  const headMissing = from.headUserId === null || to.headUserId === null;
  return {
    needFromHead: from.headUserId !== null,
    needToHead: to.headUserId !== null,
    needCompanyHead: crossesOrganizations || headMissing,
  };
}

/** The approvals this person is entitled to give on a move between these departments. */
export function approvalsAvailableTo(actor: ActorFacts, from: DepartmentFacts, to: DepartmentFacts): Approver[] {
  if (actor.systemRole === SystemRole.CompanyHead) return ['CompanyHead'];
  const roles: Approver[] = [];
  if (actor.systemRole === SystemRole.DepartmentHead) {
    if (from.headUserId === actor.id) roles.push('FromHead');
    if (to.headUserId === actor.id) roles.push('ToHead');
  }
  return roles;
}

/** Who may start a move: the company head, or the head of either department. */
export function canStartTransfer(actor: ActorFacts, from: DepartmentFacts, to: DepartmentFacts): boolean {
  return actor.systemRole === SystemRole.CompanyHead || approvalsAvailableTo(actor, from, to).length > 0;
}

/** A fresh state: nothing approved yet. */
export function emptyApprovals(needs: ApprovalNeeds): ApprovalState {
  return { ...needs, fromHeadApproved: false, toHeadApproved: false, companyHeadApproved: false };
}

/** Records one approval; approvals that are not needed are ignored. */
export function withApproval(state: ApprovalState, approver: Approver): ApprovalState {
  return {
    ...state,
    fromHeadApproved: state.fromHeadApproved || (approver === 'FromHead' && state.needFromHead),
    toHeadApproved: state.toHeadApproved || (approver === 'ToHead' && state.needToHead),
    companyHeadApproved: state.companyHeadApproved || (approver === 'CompanyHead' && state.needCompanyHead),
  };
}

/** The approvals still missing. */
export function missingApprovals(state: ApprovalState): Approver[] {
  const missing: Approver[] = [];
  if (state.needFromHead && !state.fromHeadApproved) missing.push('FromHead');
  if (state.needToHead && !state.toHeadApproved) missing.push('ToHead');
  if (state.needCompanyHead && !state.companyHeadApproved) missing.push('CompanyHead');
  return missing;
}

/** True when every needed approval is in. */
export function isFullyApproved(state: ApprovalState): boolean {
  return missingApprovals(state).length === 0;
}