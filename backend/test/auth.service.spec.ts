import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SystemRole, UserStatus, type RefreshToken, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../src/common/prisma/prisma.service';
import type { AuditService } from '../src/modules/audit/audit.service';
import { AuthService, hashToken, LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from '../src/modules/auth/auth.service';
import type { EmailService } from '../src/modules/email/email.service';

const PASSWORD = 'Correct-Horse-9';

/** Minimal in-memory stand-in for the parts of Prisma that AuthService uses. */
function createFakes() {
  const users: User[] = [];
  const tokens: (RefreshToken & { user?: User })[] = [];
  let tokenId = 1;
  const prisma = {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id?: number; email?: string } }) =>
        users.find((u) => (where.id !== undefined ? u.id === where.id : u.email === where.email)) ?? null,
      ),
      update: vi.fn(async ({ where, data }: { where: { id: number }; data: Partial<User> }) => {
        const u = users.find((x) => x.id === where.id)!;
        Object.assign(u, data);
        return u;
      }),
    },
    refreshToken: {
      create: vi.fn(async ({ data }: { data: Omit<RefreshToken, 'id' | 'createdAt' | 'revokedAt'> }) => {
        const t = { ...data, id: tokenId++, createdAt: new Date(), revokedAt: null } as RefreshToken;
        tokens.push(t);
        return t;
      }),
      findUnique: vi.fn(async ({ where }: { where: { tokenHash: string } }) => {
        const t = tokens.find((x) => x.tokenHash === where.tokenHash);
        return t ? { ...t, user: users.find((u) => u.id === t.userId)! } : null;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: number }; data: Partial<RefreshToken> }) =>
        Object.assign(tokens.find((t) => t.id === where.id)!, data),
      ),
      updateMany: vi.fn(
        async ({ where, data }: { where: { userId?: number; tokenHash?: string }; data: Partial<RefreshToken> }) => {
          for (const t of tokens) {
            const match =
              !t.revokedAt &&
              (where.userId === undefined || t.userId === where.userId) &&
              (where.tokenHash === undefined || t.tokenHash === where.tokenHash);
            if (match) Object.assign(t, data);
          }
          return { count: 0 };
        },
      ),
    },
  };
  return { users, tokens, prisma };
}

describe('AuthService', () => {
  let fakes: ReturnType<typeof createFakes>;
  let service: AuthService;
  let audit: { log: ReturnType<typeof vi.fn> };
  let email: { send: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    fakes = createFakes();
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    email = { send: vi.fn().mockResolvedValue(true) };
    const jwt = new JwtService({ secret: 'x'.repeat(40), signOptions: { expiresIn: '15m' } });
    const config = { get: (k: string) => (k === 'REFRESH_TTL_DAYS' ? '30' : undefined) } as unknown as ConfigService;
    service = new AuthService(
      fakes.prisma as unknown as PrismaService,
      jwt,
      config,
      audit as unknown as AuditService,
      email as unknown as EmailService,
    );
    fakes.users.push({
      id: 1,
      organizationId: 10,
      departmentId: null,
      name: 'Test User',
      email: 'user@example.com',
      passwordHash: bcrypt.hashSync(PASSWORD, 4),
      systemRole: SystemRole.Employee,
      status: UserStatus.Active,
      mustChangePassword: false,
      failedLoginCount: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('logs in with correct credentials (email is case-insensitive) and stores only a hash of the refresh token', async () => {
    const s = await service.login('User@Example.com', PASSWORD);
    expect(s.accessToken).toBeTruthy();
    expect(s.expiresInSeconds).toBe(900);
    expect(fakes.tokens).toHaveLength(1);
    expect(fakes.tokens[0].tokenHash).toBe(hashToken(s.refreshToken));
    expect(fakes.tokens[0].tokenHash).not.toBe(s.refreshToken);
  });

  it('gives the same generic error for unknown email and wrong password', async () => {
    const a = await service.login('nobody@example.com', PASSWORD).catch((e: Error) => e);
    const b = await service.login('user@example.com', 'wrong').catch((e: Error) => e);
    expect(a).toBeInstanceOf(UnauthorizedException);
    expect(b).toBeInstanceOf(UnauthorizedException);
    expect((a as Error).message).toBe((b as Error).message);
  });

  it('locks the account after repeated failures, even with the right password', async () => {
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) {
      await service.login('user@example.com', 'wrong').catch(() => undefined);
    }
    const lockedUntil = fakes.users[0].lockedUntil!;
    expect(lockedUntil.getTime()).toBeGreaterThan(Date.now() + (LOCKOUT_MINUTES - 1) * 60_000);
    await expect(service.login('user@example.com', PASSWORD)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects inactive users', async () => {
    fakes.users[0].status = UserStatus.Inactive;
    await expect(service.login('user@example.com', PASSWORD)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates the refresh token and revokes the old one', async () => {
    const first = await service.login('user@example.com', PASSWORD);
    const second = await service.refresh(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect(fakes.tokens[0].revokedAt).not.toBeNull();
  });

  it('treats a reused (rotated) refresh token as theft and ends all sessions', async () => {
    const first = await service.login('user@example.com', PASSWORD);
    const second = await service.refresh(first.refreshToken);
    await expect(service.refresh(first.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.refresh(second.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logout revokes the refresh token', async () => {
    const s = await service.login('user@example.com', PASSWORD);
    await service.logout(s.refreshToken);
    await expect(service.refresh(s.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('change-password clears mustChangePassword, revokes old sessions, and notifies by email', async () => {
    fakes.users[0].mustChangePassword = true;
    const old = await service.login('user@example.com', PASSWORD);
    const s = await service.changePassword(1, PASSWORD, 'Brand-New-Pass-1');
    expect(fakes.users[0].mustChangePassword).toBe(false);
    await expect(service.refresh(old.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(s.user.mustChangePassword).toBe(false);
    expect(email.send).toHaveBeenCalledOnce();
    expect(JSON.stringify(email.send.mock.calls[0][0])).not.toContain('Brand-New-Pass-1');
    await expect(service.login('user@example.com', 'Brand-New-Pass-1')).resolves.toBeTruthy();
  });

  it('change-password rejects a wrong current password, weak passwords, and an unchanged password', async () => {
    await expect(service.changePassword(1, 'nope', 'Brand-New-Pass-1')).rejects.toThrow();
    await expect(service.changePassword(1, PASSWORD, 'weak')).rejects.toThrow();
    await expect(service.changePassword(1, PASSWORD, PASSWORD)).rejects.toThrow();
  });
});
