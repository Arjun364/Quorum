import { SystemRole, UserStatus, type User } from '@prisma/client';
import type { AuthUser, DepartmentRepositoryContract, InvitationRepositoryContract, PeopleRepositoryContract, RefreshTokenRepositoryContract } from '../types';
import { badRequest, conflict, forbidden, notFound } from '../utils';
import type { AuditService } from './audit.service';

/** One person as shown in a department's list; contact details only to people who manage the department. */
export interface PersonResponse {
  id: number;
  name: string;
  jobTitle: string | null;
  avatarUrl: string | null;
  systemRole: SystemRole;
  status: UserStatus;
  email?: string;
  phone?: string | null;
}

/** An invitation waiting to be accepted. */
export interface OpenInvitationResponse {
  id: number;
  name: string;
  email: string;
  role: SystemRole;
  expiresAt: string;
}

/** A department's people and the invitations still open. */
export interface DepartmentPeopleResponse {
  department: { id: number; name: string; code: string };
  canManage: boolean;
  members: PersonResponse[];
  invitations: OpenInvitationResponse[];
}

/** A department as offered in a picker (for example as the destination of a transfer). */
export interface DepartmentOptionResponse {
  id: number;
  name: string;
  code: string;
  organizationId: number;
  organizationName: string;
  head: { id: number; name: string } | null;
}

/**
 * Asks whether a person still owns open points. Meeting points arrive in a later milestone, so the answer is
 * always none for now; the rule stays wired so it starts to apply the moment points exist.
 */
export interface OpenPointsCheck {
  countOpenOwned(companyId: number, userId: number): Promise<number>;
}

/** The placeholder used until points exist. */
export const noPointsYet: OpenPointsCheck = { countOpenOwned: async () => 0 };

const toPerson = (user: User, withContact: boolean): PersonResponse => ({
  id: user.id,
  name: user.name,
  jobTitle: user.jobTitle,
  avatarUrl: user.avatarUrl,
  systemRole: user.systemRole,
  status: user.status,
  ...(withContact ? { email: user.email, phone: user.phone } : {}),
});

/** Dependencies of the people service. */
export interface PeopleServiceDeps {
  people: PeopleRepositoryContract;
  departments: DepartmentRepositoryContract;
  invitations: InvitationRepositoryContract;
  refreshTokens: RefreshTokenRepositoryContract;
  openPoints: OpenPointsCheck;
  audit: AuditService;
}

/** Business rules for who is in a department and how people leave it. */
export class PeopleService {
  constructor(private readonly deps: PeopleServiceDeps) {}

  /** True when the actor runs the department: the company head, or that department's own head. */
  private canManage(actor: AuthUser, headUserId: number | null): boolean {
    return actor.systemRole === SystemRole.CompanyHead || (actor.systemRole === SystemRole.DepartmentHead && headUserId === actor.id);
  }

  /** Lists a department's people; open to its managers and to the department's own members. */
  async listDepartmentPeople(companyId: number, actor: AuthUser, departmentId: number): Promise<DepartmentPeopleResponse> {
    const department = await this.deps.departments.findById(companyId, departmentId);
    if (!department) throw notFound('Department not found');
    const canManage = this.canManage(actor, department.headUserId);
    if (!canManage && actor.departmentId !== department.id) throw forbidden('You do not have permission to do that');

    const members = await this.deps.people.listByDepartment(companyId, departmentId);
    const open = canManage ? await this.deps.invitations.listOpenByDepartments(companyId, [departmentId]) : [];
    const now = new Date();
    return {
      department: { id: department.id, name: department.name, code: department.code },
      canManage,
      members: members.map((user) => toPerson(user, canManage)),
      invitations: open
        .filter((invitation) => invitation.expiresAt > now)
        .map((invitation) => ({ id: invitation.id, name: invitation.name, email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt.toISOString() })),
    };
  }

  /** Lists every department of the company, for pickers; open to the heads. */
  async listDepartmentOptions(companyId: number): Promise<DepartmentOptionResponse[]> {
    const all = await this.deps.departments.listAll(companyId);
    return all.map((d) => ({ id: d.id, name: d.name, code: d.code, organizationId: d.organization.id, organizationName: d.organization.name, head: d.head }));
  }

  /** Deactivates a person (never deletes) and ends their sessions; heads must be replaced first, and open points reassigned. */
  async deactivate(companyId: number, actor: AuthUser, userId: number): Promise<PersonResponse> {
    const person = await this.deps.people.findInCompany(companyId, userId);
    if (!person) throw notFound('Person not found');
    if (person.id === actor.id) throw badRequest('You cannot deactivate yourself.');
    if (person.systemRole !== SystemRole.Employee) throw badRequest('A head cannot be deactivated until a replacement is named.');
    if (person.status === UserStatus.Inactive) throw conflict('This person is already inactive.');
    const department = person.departmentId ? await this.deps.departments.findById(companyId, person.departmentId) : null;
    if (!this.canManage(actor, department?.headUserId ?? null)) throw forbidden('You do not have permission to do that');
    if ((await this.deps.openPoints.countOpenOwned(companyId, person.id)) > 0) {
      throw conflict('Reassign this person’s open points before they leave.');
    }

    const updated = await this.deps.people.deactivate(companyId, person.id);
    await this.deps.refreshTokens.revokeAllActiveForUser(person.id);
    await this.deps.audit.log({ userId: actor.id, companyId, action: 'UserDeactivated', entityType: 'User', entityId: person.id, details: { departmentId: person.departmentId } });
    return toPerson(updated, true);
  }
}