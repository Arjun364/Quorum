import { CompanyStatus, SystemRole, type Company, type Invitation } from '@prisma/client';
import type { AppConfig } from '../config';
import { INVITATION_TTL_DAYS } from '../constants';
import { generateRefreshToken, hashPassword, hashToken } from '../helpers';
import type {
  AuthUser,
  DepartmentRepositoryContract,
  InvitationRepositoryContract,
  InvitationWithContext,
  IssuedSession,
  UserRepositoryContract,
} from '../types';
import { badRequest, checkPasswordPolicy, companyUrl, conflict, forbidden, notFound } from '../utils';
import type { AuditService } from './audit.service';
import type { AuthService } from './auth.service';
import type { EmailSender } from './email.service';

const INVALID_INVITATION = 'This invitation is invalid or has expired. Ask the person who invited you for a new one.';

/** An invitation as the inviter sees it. */
export interface InvitationResponse {
  id: number;
  departmentId: number;
  name: string;
  email: string;
  role: SystemRole;
  expiresAt: string;
}

/** What the invited person sees before accepting. */
export interface InvitationLookupResponse {
  companyName: string;
  departmentName: string;
  name: string;
  /** Fixed by the invitation: the account is created with exactly this address. */
  email: string;
  role: SystemRole;
}

const toInvitation = (i: Invitation): InvitationResponse => ({
  id: i.id,
  departmentId: i.departmentId,
  name: i.name,
  email: i.email,
  role: i.role,
  expiresAt: i.expiresAt.toISOString(),
});

const expiry = (): Date => new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000);

/** Dependencies of the invitation service. */
export interface InvitationServiceDeps {
  invitations: InvitationRepositoryContract;
  departments: DepartmentRepositoryContract;
  users: UserRepositoryContract;
  audit: AuditService;
  email: EmailSender;
  auth: Pick<AuthService, 'issueSession'>;
  config: Pick<AppConfig, 'appBaseUrl'>;
}

/** Business rules of invitations: each is tied to one email address, works once and expires. */
export class InvitationService {
  constructor(private readonly deps: InvitationServiceDeps) {}

  /** Invites a person to lead a department of the company; refuses when it already has a head or the address is in use. */
  async inviteDepartmentHead(company: Company, inviterId: number, departmentId: number, input: { name: string; email: string }): Promise<InvitationResponse> {
    const department = await this.deps.departments.findById(company.id, departmentId);
    if (!department) throw notFound('Department not found');
    if (department.headUserId) throw conflict('This department already has a head');
    return this.issue(company, inviterId, department, SystemRole.DepartmentHead, input);
  }

  /** Invites an employee to a department; only that department's head (or the company head) may. */
  async inviteEmployee(company: Company, actor: AuthUser, departmentId: number, input: { name: string; email: string }): Promise<InvitationResponse> {
    const department = await this.deps.departments.findById(company.id, departmentId);
    if (!department) throw notFound('Department not found');
    this.requireAuthority(actor, department.headUserId);
    return this.issue(company, actor.id, department, SystemRole.Employee, input);
  }

  /** Creates, stores and emails one invitation (after the address check). */
  private async issue(
    company: Company,
    inviterId: number,
    department: { id: number; name: string },
    role: SystemRole,
    input: { name: string; email: string },
  ): Promise<InvitationResponse> {
    const email = input.email.trim().toLowerCase();
    if (await this.deps.users.findByEmail(company.id, email)) throw conflict('Someone in your company already uses that email');
    await this.deps.invitations.revokeOpenFor(company.id, department.id, email);
    const token = generateRefreshToken();
    const invitation = await this.deps.invitations.create({
      companyId: company.id,
      departmentId: department.id,
      email,
      name: input.name.trim(),
      role,
      tokenHash: hashToken(token),
      expiresAt: expiry(),
      invitedBy: inviterId,
    });
    await this.deps.audit.log({ userId: inviterId, companyId: company.id, action: 'InvitationSent', entityType: 'Invitation', entityId: invitation.id, details: { role, departmentId: department.id } });
    await this.sendInvitation(company, invitation, department.name, token);
    return toInvitation(invitation);
  }

  /** Only the company head, or the head of that very department, may manage its invitations. */
  private requireAuthority(actor: AuthUser, departmentHeadId: number | null): void {
    if (actor.systemRole === SystemRole.CompanyHead) return;
    if (actor.systemRole === SystemRole.DepartmentHead && departmentHeadId === actor.id) return;
    throw forbidden('You do not have permission to do that');
  }

  /** Shows an invitation to the person holding its link. */
  async lookup(token: string, companyId: number): Promise<InvitationLookupResponse> {
    const invitation = await this.requireUsable(token, companyId);
    return {
      companyName: invitation.company.name,
      departmentName: invitation.department.name,
      name: invitation.name,
      email: invitation.email,
      role: invitation.role,
    };
  }

  /** Accepts an invitation: creates the account with the invited address and the chosen password, and signs the person in. */
  async accept(token: string, companyId: number, input: { name: string; password: string }): Promise<IssuedSession> {
    const invitation = await this.requireUsable(token, companyId);
    const problems = checkPasswordPolicy(input.password);
    if (problems.length > 0) throw badRequest(problems);
    if (await this.deps.users.findByEmail(invitation.companyId, invitation.email)) throw conflict('An account with this email already exists');
    if (invitation.role === SystemRole.DepartmentHead && invitation.department.headUserId) {
      throw conflict('This department already has a head');
    }
    const user = await this.deps.invitations.accept(invitation.id, {
      name: input.name.trim(),
      passwordHash: await hashPassword(input.password),
    });
    await this.deps.audit.log({ userId: user.id, companyId: user.companyId, action: 'InvitationAccepted', entityType: 'Invitation', entityId: invitation.id, details: { role: invitation.role } });
    return this.deps.auth.issueSession(user);
  }

  /** Revokes an open invitation of the company. */
  async revoke(companyId: number, actor: AuthUser, id: number): Promise<void> {
    const invitation = await this.requireOpen(companyId, id);
    await this.requireManager(companyId, actor, invitation);
    await this.deps.invitations.revoke(companyId, invitation.id);
    await this.deps.audit.log({ userId: actor.id, companyId, action: 'InvitationRevoked', entityType: 'Invitation', entityId: id });
  }

  /** Sends an open invitation again with a fresh link; the old link stops working. */
  async resend(company: Company, actor: AuthUser, id: number): Promise<InvitationResponse> {
    const invitation = await this.requireOpen(company.id, id);
    const department = await this.requireManager(company.id, actor, invitation);
    const userId = actor.id;
    const token = generateRefreshToken();
    const expiresAt = expiry();
    await this.deps.invitations.replaceToken(invitation.id, hashToken(token), expiresAt);
    await this.deps.audit.log({ userId, companyId: company.id, action: 'InvitationResent', entityType: 'Invitation', entityId: id });
    await this.sendInvitation(company, invitation, department.name, token);
    return toInvitation({ ...invitation, expiresAt });
  }

  /** Loads the invitation's department and checks the actor may manage it (department heads: only employee invitations to their own department). */
  private async requireManager(companyId: number, actor: AuthUser, invitation: Invitation) {
    const department = await this.deps.departments.findById(companyId, invitation.departmentId);
    if (!department) throw notFound('Department not found');
    if (actor.systemRole === SystemRole.DepartmentHead && invitation.role !== SystemRole.Employee) throw forbidden('You do not have permission to do that');
    this.requireAuthority(actor, department.headUserId);
    return department;
  }

  /** Loads the invitation behind a link, or fails with one generic message for every way it can be unusable. */
  private async requireUsable(token: string, companyId: number): Promise<InvitationWithContext> {
    const invitation = await this.deps.invitations.findByHash(hashToken(token));
    if (
      !invitation ||
      invitation.companyId !== companyId ||
      invitation.acceptedAt ||
      invitation.revokedAt ||
      invitation.expiresAt <= new Date() ||
      invitation.company.status === CompanyStatus.Disabled
    ) {
      throw badRequest(INVALID_INVITATION);
    }
    return invitation;
  }

  /** Loads an invitation of the company that is still open, or fails. */
  private async requireOpen(companyId: number, id: number): Promise<Invitation> {
    const invitation = await this.deps.invitations.findById(companyId, id);
    if (!invitation) throw notFound('Invitation not found');
    if (invitation.acceptedAt) throw conflict('This invitation was already accepted');
    if (invitation.revokedAt) throw conflict('This invitation was revoked');
    return invitation;
  }

  /** Emails the single-use invitation link (the link opens the app; it carries no minutes). */
  private async sendInvitation(company: Company, invitation: Invitation, departmentName: string, token: string): Promise<void> {
    const lead = invitation.role === SystemRole.DepartmentHead ? `lead ${departmentName}` : `join ${departmentName}`;
    await this.deps.email.send({
      to: invitation.email,
      subject: `You are invited to ${lead} at ${company.name}`,
      heading: `You are invited to ${lead}`,
      body: `Set your password to get started on ${company.name}'s Quorum. This link works once and expires in ${INVITATION_TTL_DAYS} days.`,
      link: { url: companyUrl(this.deps.config.appBaseUrl, company.slug, `/invite?token=${token}`), label: 'Accept invitation' },
      type: 'Invitation',
      companyId: company.id,
    });
  }
}
