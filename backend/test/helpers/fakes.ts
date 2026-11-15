import { SystemRole, UserStatus, type Prisma, type RefreshToken, type User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { vi } from 'vitest';
import type { AppConfig } from '../../src/config';
import { createJwtHelper } from '../../src/helpers';
import { AuditService, AuthService, type EmailSender } from '../../src/services';
import type {
  AuditEntry,
  AuditLogRepositoryContract,
  RefreshTokenRepositoryContract,
  RefreshTokenWithUser,
  UserRepositoryContract,
} from '../../src/types';

export const TEST_PASSWORD = 'Correct-Horse-9';

/** Settings used by tests; never read from the real environment. */
export const testConfig: AppConfig = {
  nodeEnv: 'test',
  port: 0,
  databaseUrl: 'postgresql://unused',
  appBaseUrl: 'http://app.test',
  jwtAccessSecret: 'x'.repeat(40),
  jwtAccessTtl: '15m',
  refreshTtlDays: 30,
  cookieSecure: false,
  trustProxy: false,
  smtp: { host: 'localhost', port: 1025, secure: false },
  mailFrom: 'Quorum <no-reply@localhost>',
};

/** Creates a user record with sensible defaults. */
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    organizationId: 10,
    departmentId: null,
    name: 'Test User',
    email: 'user@example.com',
    passwordHash: bcrypt.hashSync(TEST_PASSWORD, 4),
    systemRole: SystemRole.Employee,
    status: UserStatus.Active,
    mustChangePassword: false,
    failedLoginCount: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** In-memory user repository. */
export class InMemoryUserRepository implements UserRepositoryContract {
  readonly rows: User[] = [];

  async findByEmail(email: string) {
    return this.rows.find((u) => u.email === email) ?? null;
  }
  async findById(id: number) {
    return this.rows.find((u) => u.id === id) ?? null;
  }
  async findAuthById(id: number) {
    const u = this.rows.find((x) => x.id === id);
    return u
      ? {
          id: u.id,
          organizationId: u.organizationId,
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

  async create(data: { organizationId: number | null; userId: number; tokenHash: string; expiresAt: Date }) {
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

/** Builds the real AuthService on top of in-memory repositories and a fake email sender. */
export function createAuthHarness() {
  const users = new InMemoryUserRepository();
  const refreshTokens = new InMemoryRefreshTokenRepository(users);
  const auditRepo = new InMemoryAuditRepository();
  const email: EmailSender & { send: ReturnType<typeof vi.fn> } = { send: vi.fn().mockResolvedValue(true) };
  const jwt = createJwtHelper(testConfig.jwtAccessSecret, testConfig.jwtAccessTtl);
  const auth = new AuthService({
    users,
    refreshTokens,
    audit: new AuditService(auditRepo),
    email,
    jwt,
    config: testConfig,
  });
  return { users, refreshTokens, auditRepo, email, jwt, auth };
}
