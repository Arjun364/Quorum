import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import { SystemRole, UserStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { ALLOW_PASSWORD_CHANGE_KEY, IS_PUBLIC_KEY } from '../src/common/decorators/decorators';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import type { PrismaService } from '../src/common/prisma/prisma.service';

interface Setup {
  metadata?: Record<string, boolean>;
  authorization?: string;
  verifyFails?: boolean;
  dbUser?: Record<string, unknown> | null;
}

function run({ metadata = {}, authorization, verifyFails = false, dbUser }: Setup) {
  const request: Record<string, unknown> = { headers: { authorization } };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  const reflector = { getAllAndOverride: (key: string) => metadata[key] } as unknown as Reflector;
  const jwt = {
    verifyAsync: verifyFails ? vi.fn().mockRejectedValue(new Error('bad')) : vi.fn().mockResolvedValue({ sub: 1 }),
  } as unknown as JwtService;
  const prisma = { user: { findUnique: vi.fn().mockResolvedValue(dbUser ?? null) } } as unknown as PrismaService;
  const guard = new JwtAuthGuard(reflector, jwt, prisma);
  return { result: guard.canActivate(context), request };
}

const activeUser = {
  id: 1,
  organizationId: 5,
  departmentId: null,
  systemRole: SystemRole.Employee,
  status: UserStatus.Active,
  mustChangePassword: false,
};

describe('JwtAuthGuard', () => {
  it('lets public routes through without a token', async () => {
    await expect(run({ metadata: { [IS_PUBLIC_KEY]: true } }).result).resolves.toBe(true);
  });

  it('rejects a missing token', async () => {
    await expect(run({}).result).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid or expired token', async () => {
    await expect(run({ authorization: 'Bearer x', verifyFails: true }).result).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a user who was deactivated after the token was issued', async () => {
    const out = run({ authorization: 'Bearer x', dbUser: { ...activeUser, status: UserStatus.Inactive } });
    await expect(out.result).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('blocks ordinary routes while a password change is required (with a machine-readable code)', async () => {
    const out = run({ authorization: 'Bearer x', dbUser: { ...activeUser, mustChangePassword: true } });
    await expect(out.result).rejects.toBeInstanceOf(ForbiddenException);
    await out.result.catch((e: ForbiddenException) =>
      expect((e.getResponse() as { code: string }).code).toBe('PASSWORD_CHANGE_REQUIRED'),
    );
  });

  it('allows the change-password route while a change is required', async () => {
    const out = run({
      authorization: 'Bearer x',
      metadata: { [ALLOW_PASSWORD_CHANGE_KEY]: true },
      dbUser: { ...activeUser, mustChangePassword: true },
    });
    await expect(out.result).resolves.toBe(true);
  });

  it('attaches the user read from the database (not from the token) to the request', async () => {
    const out = run({ authorization: 'Bearer x', dbUser: activeUser });
    await expect(out.result).resolves.toBe(true);
    expect(out.request.user).toMatchObject({ id: 1, organizationId: 5, systemRole: SystemRole.Employee });
  });
});
