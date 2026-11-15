import { UserStatus } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from '../src/constants';
import { hashToken } from '../src/helpers';
import { HttpError } from '../src/utils';
import { createAuthHarness, makeUser, TEST_PASSWORD } from './helpers/fakes';

const rejectsUnauthorized = (promise: Promise<unknown>) =>
  expect(promise).rejects.toSatisfy((e: unknown) => e instanceof HttpError && e.status === 401);

describe('AuthService', () => {
  let h: ReturnType<typeof createAuthHarness>;

  beforeEach(() => {
    h = createAuthHarness();
    h.users.rows.push(makeUser());
  });

  it('logs in with correct credentials (email is case-insensitive) and stores only a hash of the refresh token', async () => {
    const s = await h.auth.login('User@Example.com', TEST_PASSWORD);
    expect(s.accessToken).toBeTruthy();
    expect(s.expiresInSeconds).toBe(900);
    expect(h.refreshTokens.rows).toHaveLength(1);
    expect(h.refreshTokens.rows[0].tokenHash).toBe(hashToken(s.refreshToken));
    expect(h.refreshTokens.rows[0].tokenHash).not.toBe(s.refreshToken);
  });

  it('gives the same generic error for unknown email and wrong password', async () => {
    const a = await h.auth.login('nobody@example.com', TEST_PASSWORD).catch((e: Error) => e);
    const b = await h.auth.login('user@example.com', 'wrong').catch((e: Error) => e);
    expect(a).toBeInstanceOf(HttpError);
    expect(b).toBeInstanceOf(HttpError);
    expect((a as Error).message).toBe((b as Error).message);
  });

  it('locks the account after repeated failures, even with the right password, and audits the lock', async () => {
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) {
      await h.auth.login('user@example.com', 'wrong').catch(() => undefined);
    }
    const lockedUntil = h.users.rows[0].lockedUntil!;
    expect(lockedUntil.getTime()).toBeGreaterThan(Date.now() + (LOCKOUT_MINUTES - 1) * 60_000);
    await rejectsUnauthorized(h.auth.login('user@example.com', TEST_PASSWORD));
    expect(h.auditRepo.entries.some((e) => e.action === 'AccountLocked')).toBe(true);
  });

  it('rejects inactive users', async () => {
    h.users.rows[0].status = UserStatus.Inactive;
    await rejectsUnauthorized(h.auth.login('user@example.com', TEST_PASSWORD));
  });

  it('rotates the refresh token and revokes the old one', async () => {
    const first = await h.auth.login('user@example.com', TEST_PASSWORD);
    const second = await h.auth.refresh(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect(h.refreshTokens.rows[0].revokedAt).not.toBeNull();
  });

  it('treats a reused (rotated) refresh token as theft and ends all sessions', async () => {
    const first = await h.auth.login('user@example.com', TEST_PASSWORD);
    const second = await h.auth.refresh(first.refreshToken);
    await rejectsUnauthorized(h.auth.refresh(first.refreshToken));
    await rejectsUnauthorized(h.auth.refresh(second.refreshToken));
  });

  it('rejects a missing refresh token', async () => {
    await rejectsUnauthorized(h.auth.refresh(undefined));
  });

  it('logout revokes the refresh token', async () => {
    const s = await h.auth.login('user@example.com', TEST_PASSWORD);
    await h.auth.logout(s.refreshToken);
    await rejectsUnauthorized(h.auth.refresh(s.refreshToken));
  });

  it('change-password clears mustChangePassword, revokes old sessions, audits, and notifies by email', async () => {
    h.users.rows[0].mustChangePassword = true;
    const old = await h.auth.login('user@example.com', TEST_PASSWORD);
    const s = await h.auth.changePassword(1, TEST_PASSWORD, 'Brand-New-Pass-1');
    expect(h.users.rows[0].mustChangePassword).toBe(false);
    await rejectsUnauthorized(h.auth.refresh(old.refreshToken));
    expect(s.user.mustChangePassword).toBe(false);
    expect(h.email.send).toHaveBeenCalledOnce();
    expect(JSON.stringify(h.email.send.mock.calls[0][0])).not.toContain('Brand-New-Pass-1');
    expect(h.auditRepo.entries.some((e) => e.action === 'PasswordChanged')).toBe(true);
    await expect(h.auth.login('user@example.com', 'Brand-New-Pass-1')).resolves.toBeTruthy();
  });

  it('change-password rejects a wrong current password, weak passwords, and an unchanged password', async () => {
    await expect(h.auth.changePassword(1, 'nope', 'Brand-New-Pass-1')).rejects.toThrow();
    await expect(h.auth.changePassword(1, TEST_PASSWORD, 'weak')).rejects.toThrow();
    await expect(h.auth.changePassword(1, TEST_PASSWORD, TEST_PASSWORD)).rejects.toThrow();
  });
});
