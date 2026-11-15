import { UserStatus, type User } from '@prisma/client';
import type { AppConfig } from '../config';
import { INVALID_LOGIN_MESSAGE, LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from '../constants';
import {
  DUMMY_PASSWORD_HASH,
  generateRefreshToken,
  hashPassword,
  hashToken,
  verifyPassword,
  type JwtHelper,
} from '../helpers';
import {
  toUserResponse,
  type IssuedSession,
  type RefreshTokenRepositoryContract,
  type UserRepositoryContract,
  type UserResponse,
} from '../types';
import { badRequest, checkPasswordPolicy, unauthorized } from '../utils';
import type { AuditService } from './audit.service';
import type { EmailSender } from './email.service';

/** Dependencies of the authentication service. */
export interface AuthServiceDeps {
  users: UserRepositoryContract;
  refreshTokens: RefreshTokenRepositoryContract;
  audit: AuditService;
  email: EmailSender;
  jwt: JwtHelper;
  config: Pick<AppConfig, 'refreshTtlDays' | 'appBaseUrl'>;
}

/** Business rules of authentication: sign-in with lockout, rotating refresh tokens, and password changes. */
export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  /** Signs a user in; every failure returns the same generic error, and repeated failures lock the account. */
  async login(emailInput: string, password: string): Promise<IssuedSession> {
    const { users, audit } = this.deps;
    const user = await users.findByEmail(emailInput.trim().toLowerCase());
    const now = new Date();

    if (!user) {
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      throw unauthorized(INVALID_LOGIN_MESSAGE);
    }
    if (user.lockedUntil && user.lockedUntil > now) {
      throw unauthorized(INVALID_LOGIN_MESSAGE);
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk || user.status !== UserStatus.Active) {
      if (!passwordOk) {
        const failed = user.failedLoginCount + 1;
        const lock = failed >= MAX_FAILED_LOGINS;
        await users.update(user.id, {
          failedLoginCount: lock ? 0 : failed,
          lockedUntil: lock ? new Date(now.getTime() + LOCKOUT_MINUTES * 60_000) : null,
        });
        if (lock) {
          await audit.log({
            userId: user.id,
            organizationId: user.organizationId,
            action: 'AccountLocked',
            entityType: 'User',
            entityId: user.id,
          });
        }
      }
      throw unauthorized(INVALID_LOGIN_MESSAGE);
    }

    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await users.update(user.id, { failedLoginCount: 0, lockedUntil: null });
    }
    await audit.log({
      userId: user.id,
      organizationId: user.organizationId,
      action: 'Login',
      entityType: 'User',
      entityId: user.id,
    });
    return this.issueSession(user);
  }

  /** Exchanges a refresh token for a new session and rotates the token; reuse of a rotated token ends every session. */
  async refresh(rawToken: string | undefined): Promise<IssuedSession> {
    const { refreshTokens } = this.deps;
    if (!rawToken) {
      throw unauthorized('Missing refresh token');
    }
    const stored = await refreshTokens.findByHash(hashToken(rawToken));
    if (!stored) {
      throw unauthorized('Invalid refresh token');
    }
    if (stored.revokedAt) {
      // A rotated token was presented again: assume theft and end every session.
      await refreshTokens.revokeAllActiveForUser(stored.userId);
      throw unauthorized('Invalid refresh token');
    }
    if (stored.expiresAt <= new Date() || stored.user.status !== UserStatus.Active) {
      throw unauthorized('Invalid refresh token');
    }
    await refreshTokens.revoke(stored.id);
    return this.issueSession(stored.user);
  }

  /** Revokes the refresh token of the current session; a missing token is not an error. */
  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await this.deps.refreshTokens.revokeActiveByHash(hashToken(rawToken));
  }

  /** Changes a password after checking the current one and the policy, revokes all sessions, and returns a fresh session. */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<IssuedSession> {
    const { users, audit, email, config } = this.deps;
    const user = await users.findById(userId);
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      throw badRequest('Current password is incorrect');
    }
    const problems = checkPasswordPolicy(newPassword);
    if (problems.length > 0) {
      throw badRequest(problems);
    }
    if (newPassword === currentPassword) {
      throw badRequest('New password must be different from the current one');
    }

    const updated = await users.update(userId, {
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false,
      failedLoginCount: 0,
      lockedUntil: null,
    });
    await this.deps.refreshTokens.revokeAllActiveForUser(userId);
    await audit.log({
      userId,
      organizationId: user.organizationId,
      action: 'PasswordChanged',
      entityType: 'User',
      entityId: userId,
    });
    // Fire and forget: email failures never break the flow (and are logged by the email service).
    void email.send({
      to: updated.email,
      subject: 'Your password was changed',
      heading: 'Password changed',
      body: 'Your Quorum password was just changed. If this was not you, contact your administrator.',
      link: { url: `${config.appBaseUrl}/login`, label: 'Open the app' },
      type: 'PasswordChanged',
      userId,
      organizationId: user.organizationId,
    });
    return this.issueSession(updated);
  }

  /** Returns the profile of a signed-in user. */
  async me(userId: number): Promise<UserResponse> {
    const user = await this.deps.users.findById(userId);
    if (!user) throw unauthorized('Account not found');
    return toUserResponse(user);
  }

  /** Creates a new access token and stores a new refresh token (hash only) for the user. */
  private async issueSession(user: User): Promise<IssuedSession> {
    const { jwt, refreshTokens, config } = this.deps;
    const { token: accessToken, expiresInSeconds } = jwt.sign(user.id);
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + config.refreshTtlDays * 86_400_000);
    await refreshTokens.create({
      organizationId: user.organizationId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiresAt,
    });
    return { accessToken, expiresInSeconds, user: toUserResponse(user), refreshToken, refreshExpiresAt };
  }
}
