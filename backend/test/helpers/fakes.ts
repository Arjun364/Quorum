import {
  CompanyStatus,
  SystemRole,
  UserStatus,
  type Company,
  type Department,
  type Invitation,
  type Organization,
  type Prisma,
  type RefreshToken,
  type User,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { vi } from 'vitest';
import { createApp } from '../../src/app';
import type { AppConfig } from '../../src/config';
import { createJwtHelper } from '../../src/helpers';
import { noRateLimiters } from '../../src/middlewares';
import {
  AuditService,
  AuthService,
  CompanyService,
  InvitationService,
  StructureService,
  type EmailSender,
  type SendEmailInput,
} from '../../src/services';
import type {
  AuditEntry,
  AuditLogRepositoryContract,
  CompanyRepositoryContract,
  DepartmentRepositoryContract,
  DepartmentWithHead,
  InvitationRepositoryContract,
  InvitationWithContext,
  NewCompanyWithHead,
  OrganizationRepositoryContract,
  RefreshTokenRepositoryContract,
  RefreshTokenWithUser,
  UserRepositoryContract,
  VerificationTokenRepositoryContract,
  VerificationTokenWithUser,
} from '../../src/types';

export const TEST_PASSWORD = 'Correct-Horse-9';
export const ROOT_HOST = 'quorum.test';

/** Settings used by tests; never read from the real environment. */
export const testConfig: AppConfig = {
  nodeEnv: 'test',
  port: 0,
  databaseUrl: 'postgresql://unused',
  appBaseUrl: 'http://quorum.test',
  jwtAccessSecret: 'x'.repeat(40),
  jwtAccessTtl: '15m',
  refreshTtlDays: 30,
  cookieSecure: false,
  trustProxy: false,
  smtp: { host: 'localhost', port: 1025, secure: false },
  mailFrom: 'Quorum <no-reply@localhost>',
  appRootHost: ROOT_HOST,
  cloudinary: { cloudName: 'democloud', apiKey: '123456789012345', apiSecret: 'secret-for-tests' },
};

/** Creates a user record with sensible defaults (an active, verified employee of company 10). */
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    companyId: 10,
    departmentId: null,
    name: 'Test User',
    email: 'user@example.com',
    passwordHash: bcrypt.hashSync(TEST_PASSWORD, 4),
    systemRole: SystemRole.Employee,
    status: UserStatus.Active,
    jobTitle: null,
    mustChangePassword: false,
    emailVerifiedAt: new Date(),
    failedLoginCount: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Creates a company record with sensible defaults. */
export function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: 10,
    name: 'Acme Works',
    slug: 'acme',
    status: CompanyStatus.Active,
    meetingLanguage: 'English',
    timeZone: 'Asia/Kolkata',
    workingDays: [1, 2, 3, 4, 5],
    themePreset: 'Forest',
    accentColor: null,
    logoUrl: null,
    logoPublicId: null,
    showPoweredBy: true,
    createdAt: new Date(),
    ...overrides,
  };
}

/** In-memory user repository. */
export class InMemoryUserRepository implements UserRepositoryContract {
  readonly rows: User[] = [];

  async findByEmail(companyId: number | null, email: string) {
    return this.rows.find((u) => u.companyId === companyId && u.email === email) ?? null;
  }
  async findById(id: number) {
    return this.rows.find((u) => u.id === id) ?? null;
  }
  async findAuthById(id: number) {
    const u = this.rows.find((x) => x.id === id);
    return u
      ? {
          id: u.id,
          companyId: u.companyId,
          departmentId: u.departmentId,
          systemRole: u.systemRole,
          status: u.status,
          mustChangePassword: u.mustChangePassword,
        }
      : null;
  }
  async count() {
    return this.rows.length;
  }
  async create(data: Prisma.UserUncheckedCreateInput) {
    const user = makeUser({ ...(data as Partial<User>), id: this.rows.length + 1 });
    this.rows.push(user);
    return user;
  }
  async update(id: number, data: Prisma.UserUncheckedUpdateInput) {
    const user = this.rows.find((x) => x.id === id)!;
    Object.assign(user, data);
    return user;
  }
}

/** In-memory refresh-token repository. */
export class InMemoryRefreshTokenRepository implements RefreshTokenRepositoryContract {
  readonly rows: RefreshToken[] = [];
  private nextId = 1;

  constructor(private readonly users: InMemoryUserRepository) {}

  async create(data: { companyId: number | null; userId: number; tokenHash: string; expiresAt: Date }) {
    const row: RefreshToken = { ...data, id: this.nextId++, createdAt: new Date(), revokedAt: null };
    this.rows.push(row);
    return row;
  }
  async findByHash(tokenHash: string): Promise<RefreshTokenWithUser | null> {
    const row = this.rows.find((t) => t.tokenHash === tokenHash);
    if (!row) return null;
    return { ...row, user: (await this.users.findById(row.userId))! };
  }
  async revoke(id: number) {
    this.rows.find((t) => t.id === id)!.revokedAt = new Date();
  }
  async revokeActiveByHash(tokenHash: string) {
    for (const t of this.rows) if (t.tokenHash === tokenHash && !t.revokedAt) t.revokedAt = new Date();
  }
  async revokeAllActiveForUser(userId: number) {
    for (const t of this.rows) if (t.userId === userId && !t.revokedAt) t.revokedAt = new Date();
  }
}

/** In-memory audit repository that keeps entries for assertions. */
export class InMemoryAuditRepository implements AuditLogRepositoryContract {
  readonly entries: AuditEntry[] = [];
  async create(entry: AuditEntry) {
    this.entries.push(entry);
  }
}

/** In-memory company repository; registering a company also creates its head in the user repository. */
export class InMemoryCompanyRepository implements CompanyRepositoryContract {
  readonly rows: Company[] = [];
  constructor(private readonly users: InMemoryUserRepository) {}

  async findBySlug(slug: string) {
    return this.rows.find((c) => c.slug === slug) ?? null;
  }
  async findById(id: number) {
    return this.rows.find((c) => c.id === id) ?? null;
  }
  async createWithHead(input: NewCompanyWithHead) {
    const company = makeCompany({ id: this.rows.length + 100, ...input.company, status: CompanyStatus.PendingVerification });
    this.rows.push(company);
    const head = await this.users.create({
      ...input.head,
      companyId: company.id,
      systemRole: SystemRole.CompanyHead,
      status: UserStatus.Active,
      emailVerifiedAt: null,
    });
    return { company, head };
  }
  async update(id: number, data: Prisma.CompanyUncheckedUpdateInput) {
    const company = this.rows.find((c) => c.id === id)!;
    Object.assign(company, data);
    return company;
  }
}

/** In-memory verification-token repository. */
export class InMemoryVerificationRepository implements VerificationTokenRepositoryContract {
  readonly rows: { id: number; userId: number; tokenHash: string; expiresAt: Date; usedAt: Date | null; createdAt: Date }[] = [];
  constructor(
    private readonly users: InMemoryUserRepository,
    private readonly companies: InMemoryCompanyRepository,
  ) {}

  async create(data: { userId: number; tokenHash: string; expiresAt: Date }) {
    this.rows.push({ ...data, id: this.rows.length + 1, usedAt: null, createdAt: new Date() });
  }
  async findByHash(tokenHash: string): Promise<VerificationTokenWithUser | null> {
    const row = this.rows.find((r) => r.tokenHash === tokenHash);
    return row ? { ...row, user: (await this.users.findById(row.userId))! } : null;
  }
  async consume(tokenId: number, userId: number, companyId: number) {
    this.rows.find((r) => r.id === tokenId)!.usedAt = new Date();
    (await this.users.findById(userId))!.emailVerifiedAt = new Date();
    (await this.companies.findById(companyId))!.status = CompanyStatus.Active;
  }
  async invalidateForUser(userId: number) {
    for (const r of this.rows) if (r.userId === userId && !r.usedAt) r.usedAt = new Date();
  }
}

/** In-memory organization repository. */
export class InMemoryOrganizationRepository implements OrganizationRepositoryContract {
  readonly rows: Organization[] = [];
  constructor(private readonly departments: InMemoryDepartmentRepository) {}

  async list(companyId: number) {
    return this.rows
      .filter((o) => o.companyId === companyId)
      .map((o) => ({ ...o, departmentCount: this.departments.rows.filter((d) => d.organizationId === o.id).length }));
  }
  async findById(companyId: number, id: number) {
    return this.rows.find((o) => o.id === id && o.companyId === companyId) ?? null;
  }
  async findByCode(companyId: number, code: string) {
    return this.rows.find((o) => o.companyId === companyId && o.code === code) ?? null;
  }
  async create(companyId: number, data: { name: string; code: string; createdBy: number }) {
    const row: Organization = { id: this.rows.length + 1, companyId, isActive: true, createdAt: new Date(), ...data };
    this.rows.push(row);
    return row;
  }
  async update(companyId: number, id: number, data: { name?: string; code?: string; isActive?: boolean }) {
    const row = this.rows.find((o) => o.id === id && o.companyId === companyId)!;
    Object.assign(row, data);
    return row;
  }
}

/** In-memory department repository. */
export class InMemoryDepartmentRepository implements DepartmentRepositoryContract {
  readonly rows: Department[] = [];
  constructor(private readonly users: InMemoryUserRepository) {}

  async listByOrganization(companyId: number, organizationId: number): Promise<DepartmentWithHead[]> {
    return this.rows
      .filter((d) => d.companyId === companyId && d.organizationId === organizationId)
      .map((d) => {
        const head = d.headUserId ? this.users.rows.find((u) => u.id === d.headUserId) : undefined;
        return {
          ...d,
          head: head ? { id: head.id, name: head.name, email: head.email } : null,
          memberCount: this.users.rows.filter((u) => u.departmentId === d.id).length,
        };
      });
  }
  async findById(companyId: number, id: number) {
    return this.rows.find((d) => d.id === id && d.companyId === companyId) ?? null;
  }
  async findByCode(organizationId: number, code: string) {
    return this.rows.find((d) => d.organizationId === organizationId && d.code === code) ?? null;
  }
  async create(companyId: number, data: { organizationId: number; name: string; code: string; createdBy: number }) {
    const row: Department = { id: this.rows.length + 1, companyId, headUserId: null, isActive: true, createdAt: new Date(), ...data };
    this.rows.push(row);
    return row;
  }
  async update(companyId: number, id: number, data: { name?: string; code?: string; isActive?: boolean }) {
    const row = this.rows.find((d) => d.id === id && d.companyId === companyId)!;
    Object.assign(row, data);
    return row;
  }
}

/** In-memory invitation repository. */
export class InMemoryInvitationRepository implements InvitationRepositoryContract {
  readonly rows: Invitation[] = [];
  constructor(
    private readonly users: InMemoryUserRepository,
    private readonly companies: InMemoryCompanyRepository,
    private readonly departments: InMemoryDepartmentRepository,
  ) {}

  async create(data: Omit<Invitation, 'id' | 'acceptedAt' | 'revokedAt' | 'createdAt'>) {
    const row: Invitation = { ...data, id: this.rows.length + 1, acceptedAt: null, revokedAt: null, createdAt: new Date() };
    this.rows.push(row);
    return row;
  }
  async findByHash(tokenHash: string): Promise<InvitationWithContext | null> {
    const row = this.rows.find((i) => i.tokenHash === tokenHash);
    if (!row) return null;
    const company = (await this.companies.findById(row.companyId))!;
    const dept = this.departments.rows.find((d) => d.id === row.departmentId)!;
    return {
      ...row,
      company: { id: company.id, name: company.name, slug: company.slug, status: company.status },
      department: { id: dept.id, name: dept.name, headUserId: dept.headUserId },
    };
  }
  async findById(companyId: number, id: number) {
    return this.rows.find((i) => i.id === id && i.companyId === companyId) ?? null;
  }
  async listOpenByDepartments(companyId: number, departmentIds: number[]) {
    return this.rows.filter((i) => i.companyId === companyId && departmentIds.includes(i.departmentId) && !i.acceptedAt && !i.revokedAt);
  }
  async revoke(companyId: number, id: number) {
    const row = this.rows.find((i) => i.id === id && i.companyId === companyId && !i.acceptedAt);
    if (row) row.revokedAt = new Date();
  }
  async revokeOpenFor(companyId: number, departmentId: number, email: string) {
    for (const i of this.rows) {
      if (i.companyId === companyId && i.departmentId === departmentId && i.email === email && !i.acceptedAt && !i.revokedAt) i.revokedAt = new Date();
    }
  }
  async replaceToken(id: number, tokenHash: string, expiresAt: Date) {
    Object.assign(this.rows.find((i) => i.id === id)!, { tokenHash, expiresAt });
  }
  async accept(invitationId: number, user: { name: string; passwordHash: string }) {
    const inv = this.rows.find((i) => i.id === invitationId)!;
    const created = await this.users.create({
      companyId: inv.companyId,
      departmentId: inv.departmentId,
      name: user.name,
      email: inv.email,
      passwordHash: user.passwordHash,
      systemRole: inv.role,
      status: UserStatus.Active,
      emailVerifiedAt: new Date(),
    });
    inv.acceptedAt = new Date();
    if (inv.role === SystemRole.DepartmentHead) {
      this.departments.rows.find((d) => d.id === inv.departmentId)!.headUserId = created.id;
    }
    return created;
  }
}

/** Fake email sender that remembers what was sent. */
export interface SentEmail extends SendEmailInput {}
export function createEmailFake() {
  const sent: SentEmail[] = [];
  const send = vi.fn(async (input: SendEmailInput) => {
    sent.push(input);
    return true;
  });
  const email: EmailSender & { send: typeof send } = { send };
  return { email, sent };
}

/** Pulls the single-use token out of the last email's link. */
export function tokenFromLastEmail(sent: SentEmail[]): string {
  const url = sent[sent.length - 1].link!.url;
  return new URL(url).searchParams.get('token')!;
}

/** Builds the real AuthService on top of in-memory repositories and a fake email sender. */
export function createAuthHarness() {
  const users = new InMemoryUserRepository();
  const refreshTokens = new InMemoryRefreshTokenRepository(users);
  const auditRepo = new InMemoryAuditRepository();
  const { email, sent } = createEmailFake();
  const jwt = createJwtHelper(testConfig.jwtAccessSecret, testConfig.jwtAccessTtl);
  const audit = new AuditService(auditRepo);
  const auth = new AuthService({ users, refreshTokens, audit, email, jwt, config: testConfig });
  return { users, refreshTokens, auditRepo, audit, email, sent, jwt, auth };
}

/** The whole backend (real routes, middleware and services) on in-memory storage. */
export function createWorld() {
  const base = createAuthHarness();
  const companies = new InMemoryCompanyRepository(base.users);
  const verificationTokens = new InMemoryVerificationRepository(base.users, companies);
  const departments = new InMemoryDepartmentRepository(base.users);
  const organizations = new InMemoryOrganizationRepository(departments);
  const invitationRepo = new InMemoryInvitationRepository(base.users, companies, departments);

  const company = new CompanyService({ companies, users: base.users, verificationTokens, audit: base.audit, email: base.email, config: testConfig });
  const structure = new StructureService({ organizations, departments, invitations: invitationRepo, audit: base.audit });
  const invitations = new InvitationService({
    invitations: invitationRepo,
    departments,
    users: base.users,
    audit: base.audit,
    email: base.email,
    auth: base.auth,
    config: testConfig,
  });
  const app = createApp({
    config: testConfig,
    services: { auth: base.auth, jwt: base.jwt, company, structure, invitations },
    users: base.users,
    companies,
    checkDatabase: async () => undefined,
    rateLimiters: noRateLimiters,
  });
  return { ...base, companies, verificationTokens, departments, organizations, invitationRepo, app };
}
