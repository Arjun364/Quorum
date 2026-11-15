import type {
  Company,
  Department,
  DepartmentTransfer,
  EmailVerificationToken,
  Invitation,
  Organization,
  Prisma,
  RefreshToken,
  SystemRole,
  TransferStatus,
  User,
} from '@prisma/client';
import type { AuthUser } from './auth.types';

/** Data access for users. Services depend on these interfaces, so tests can supply in-memory versions. */
export interface UserRepositoryContract {
  /** Finds a user by lowercase email inside one company (null companyId: the platform owner). */
  findByEmail(companyId: number | null, email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  /** Loads only the fields the authentication middleware needs, plus the status. */
  findAuthById(id: number): Promise<(AuthUser & { status: User['status'] }) | null>;
  count(): Promise<number>;
  create(data: Prisma.UserUncheckedCreateInput): Promise<User>;
  update(id: number, data: Prisma.UserUncheckedUpdateInput): Promise<User>;
}

/** A stored refresh token together with its owner. */
export type RefreshTokenWithUser = RefreshToken & { user: User };

/** Data access for refresh tokens (only SHA-256 hashes are ever stored). */
export interface RefreshTokenRepositoryContract {
  create(data: { companyId: number | null; userId: number; tokenHash: string; expiresAt: Date }): Promise<RefreshToken>;
  findByHash(tokenHash: string): Promise<RefreshTokenWithUser | null>;
  revoke(id: number): Promise<void>;
  revokeActiveByHash(tokenHash: string): Promise<void>;
  revokeAllActiveForUser(userId: number): Promise<void>;
}

/** One audit entry; every create, update, approval, reopen, transfer and role change writes one. */
export interface AuditEntry {
  userId?: number | null;
  companyId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  details?: Prisma.InputJsonValue;
}

/** Data access for the audit log. */
export interface AuditLogRepositoryContract {
  create(entry: AuditEntry): Promise<void>;
}

/** One logged email attempt. */
export interface EmailLogEntry {
  companyId: number | null;
  userId: number | null;
  toEmail: string;
  type: string;
  subject: string;
  status: 'Sent' | 'Failed';
  error: string | null;
}

/** Data access for the email log. */
export interface EmailLogRepositoryContract {
  create(entry: EmailLogEntry): Promise<void>;
}

/** What is needed to register a company together with its head, in one transaction. */
export interface NewCompanyWithHead {
  company: { name: string; slug: string };
  head: { name: string; email: string; passwordHash: string; jobTitle: string | null };
}

/** Data access for companies (the tenants). */
export interface CompanyRepositoryContract {
  findBySlug(slug: string): Promise<Company | null>;
  findById(id: number): Promise<Company | null>;
  /** Creates the company (pending verification) and its CompanyHead user together. */
  createWithHead(input: NewCompanyWithHead): Promise<{ company: Company; head: User }>;
  update(id: number, data: Prisma.CompanyUncheckedUpdateInput): Promise<Company>;
}

/** A verification token together with the user it belongs to. */
export type VerificationTokenWithUser = EmailVerificationToken & { user: User };

/** Data access for email-verification tokens (hashes only). */
export interface VerificationTokenRepositoryContract {
  create(data: { userId: number; tokenHash: string; expiresAt: Date }): Promise<void>;
  findByHash(tokenHash: string): Promise<VerificationTokenWithUser | null>;
  /** Marks the token used, the user's email verified and the company active, together. */
  consume(tokenId: number, userId: number, companyId: number): Promise<void>;
  /** Invalidates every unused token of a user (before sending a new one). */
  invalidateForUser(userId: number): Promise<void>;
}

/** Data access for organizations. Every method is limited to one company. */
export interface OrganizationRepositoryContract {
  list(companyId: number): Promise<(Organization & { departmentCount: number })[]>;
  findById(companyId: number, id: number): Promise<Organization | null>;
  findByCode(companyId: number, code: string): Promise<Organization | null>;
  create(companyId: number, data: { name: string; code: string; createdBy: number }): Promise<Organization>;
  update(companyId: number, id: number, data: { name?: string; code?: string; isActive?: boolean }): Promise<Organization>;
}

/** A department with its head (if any) and member count. */
export type DepartmentWithHead = Department & {
  head: Pick<User, 'id' | 'name' | 'email'> | null;
  memberCount: number;
};

/** A department with its organization and head (if any). */
export type DepartmentWithOrganization = Department & {
  organization: Pick<Organization, 'id' | 'name'>;
  head: Pick<User, 'id' | 'name'> | null;
};

/** Data access for departments. Every method is limited to one company. */
export interface DepartmentRepositoryContract {
  listByOrganization(companyId: number, organizationId: number): Promise<DepartmentWithHead[]>;
  findById(companyId: number, id: number): Promise<Department | null>;
  findByCode(organizationId: number, code: string): Promise<Department | null>;
  /** Every department of the company with its organization and head, for pickers and head lookups. */
  listAll(companyId: number): Promise<DepartmentWithOrganization[]>;
  create(companyId: number, data: { organizationId: number; name: string; code: string; createdBy: number }): Promise<Department>;
  update(companyId: number, id: number, data: { name?: string; code?: string; isActive?: boolean }): Promise<Department>;
}

/** An invitation with the names needed to show it to the invited person. */
export type InvitationWithContext = Invitation & {
  company: Pick<Company, 'id' | 'name' | 'slug' | 'status'>;
  department: Pick<Department, 'id' | 'name' | 'headUserId'>;
};

/** Data access for invitations. */
export interface InvitationRepositoryContract {
  create(data: {
    companyId: number;
    departmentId: number;
    email: string;
    name: string;
    role: SystemRole;
    tokenHash: string;
    expiresAt: Date;
    invitedBy: number;
  }): Promise<Invitation>;
  findByHash(tokenHash: string): Promise<InvitationWithContext | null>;
  findById(companyId: number, id: number): Promise<Invitation | null>;
  /** Invitations that are neither accepted nor revoked, for the given departments. */
  listOpenByDepartments(companyId: number, departmentIds: number[]): Promise<Invitation[]>;
  revoke(companyId: number, id: number): Promise<void>;
  /** Revokes open invitations of the same address to the same department (before sending a new one). */
  revokeOpenFor(companyId: number, departmentId: number, email: string): Promise<void>;
  replaceToken(id: number, tokenHash: string, expiresAt: Date): Promise<void>;
  /**
   * Accepts an invitation in one transaction: creates the user (verified, active), marks the invitation
   * accepted and, for a department head, makes them the department's head.
   */
  accept(invitationId: number, user: { name: string; passwordHash: string }): Promise<User>;
}

/** Data access for people (users) of one company: lists, profile edits, deactivation and moves. */
export interface PeopleRepositoryContract {
  listByDepartment(companyId: number, departmentId: number): Promise<User[]>;
  findInCompany(companyId: number, id: number): Promise<User | null>;
  findCompanyHead(companyId: number): Promise<User | null>;
  updateProfile(companyId: number, id: number, data: { name?: string; jobTitle?: string | null; phone?: string | null }): Promise<User>;
  setAvatar(companyId: number, id: number, data: { avatarUrl: string | null; avatarPublicId: string | null }): Promise<User>;
  deactivate(companyId: number, id: number): Promise<User>;
}

/** A transfer with the names needed to show it. */
export type TransferWithContext = DepartmentTransfer & {
  user: Pick<User, 'id' | 'name' | 'email'>;
  fromDepartment: Pick<Department, 'id' | 'name' | 'organizationId' | 'headUserId'>;
  toDepartment: Pick<Department, 'id' | 'name' | 'organizationId' | 'headUserId'>;
};

/** Data access for department transfers. */
export interface TransferRepositoryContract {
  create(data: Prisma.DepartmentTransferUncheckedCreateInput): Promise<DepartmentTransfer>;
  findById(companyId: number, id: number): Promise<TransferWithContext | null>;
  /** Newest first; `departmentIds` limits to transfers that start from or arrive at one of them. */
  list(companyId: number, filter: { status?: TransferStatus; departmentIds?: number[] }): Promise<TransferWithContext[]>;
  findPendingForUser(companyId: number, userId: number): Promise<DepartmentTransfer | null>;
  update(companyId: number, id: number, data: Prisma.DepartmentTransferUncheckedUpdateInput): Promise<DepartmentTransfer>;
  /** Marks the transfer completed and moves the person into the new department, together. */
  complete(companyId: number, id: number, data: Prisma.DepartmentTransferUncheckedUpdateInput, userId: number, toDepartmentId: number): Promise<void>;
}
