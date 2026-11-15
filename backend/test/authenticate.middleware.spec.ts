import { SystemRole, UserStatus } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { createAuthenticate } from '../src/middlewares';
import { tenantStorage } from '../src/prisma';
import { HttpError } from '../src/utils';
import { createAuthHarness, makeUser } from './helpers/fakes';

/** Runs the middleware once and reports what it did. */
async function run(options: { authorization?: string; user?: Partial<ReturnType<typeof makeUser>>; allow?: boolean }) {
  const h = createAuthHarness();
  const user = makeUser(options.user);
  h.users.rows.push(user);
  const authenticate = createAuthenticate({ users: h.users, jwt: h.jwt });
  const req = { headers: { authorization: options.authorization } } as unknown as Request;
  let tenantOrgInsideNext: number | null | undefined;
  const next = vi.fn(() => {
    tenantOrgInsideNext = tenantStorage.getStore()?.organizationId;
  }) as unknown as NextFunction;
  let error: unknown;
  try {
    await authenticate({ allowPasswordChangeRequired: options.allow })(req, {} as Response, next);
  } catch (e) {
    error = e;
  }
  return { req, next, error, tenantOrgInsideNext, h, user };
}

const bearerFor = (userId: number) => `Bearer ${createAuthHarness().jwt.sign(userId).token}`;

describe('authenticate middleware', () => {
  it('rejects a missing token', async () => {
    const { error } = await run({});
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const { error } = await run({ authorization: 'Bearer not-a-token' });
    expect((error as HttpError).status).toBe(401);
  });

  it('rejects a user who was deactivated after the token was issued', async () => {
    const { error } = await run({ authorization: bearerFor(1), user: { status: UserStatus.Inactive } });
    expect((error as HttpError).status).toBe(401);
  });

  it('blocks ordinary routes while a password change is required (with a machine-readable code)', async () => {
    const { error } = await run({ authorization: bearerFor(1), user: { mustChangePassword: true } });
    expect((error as HttpError).status).toBe(403);
    expect((error as HttpError).code).toBe('PASSWORD_CHANGE_REQUIRED');
  });

  it('allows flagged routes while a change is required', async () => {
    const { error, next } = await run({ authorization: bearerFor(1), user: { mustChangePassword: true }, allow: true });
    expect(error).toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });

  it('attaches the user read from the database (not from the token) and runs the request in that tenant', async () => {
    const { req, tenantOrgInsideNext } = await run({
      authorization: bearerFor(1),
      user: { organizationId: 5, systemRole: SystemRole.Admin },
    });
    expect(req.user).toMatchObject({ id: 1, organizationId: 5, systemRole: SystemRole.Admin });
    expect(tenantOrgInsideNext).toBe(5);
  });
});
