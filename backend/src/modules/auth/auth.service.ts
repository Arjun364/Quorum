import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { AuthResponse, UserResponse } from './dto/auth.dto';
import { checkPasswordPolicy } from './password-policy';

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;
const BCRYPT_COST = 12;
const INVALID_LOGIN = 'Invalid email or password';

export interface IssuedSession extends AuthResponse {
  refreshToken: string;
  refreshExpiresAt: Date;
}

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const toUserResponse = (u: User): UserResponse => ({
  id: u.id,
  name: u.name,
  email: u.email,
  systemRole: u.systemRole,
  organizationId: u.organizationId,
  departmentId: u.departmentId,
  mustChangePassword: u.mustChangePassword,
});

@Injectable()
export class AuthService {
  // Compared against when the email is unknown, so timing does not reveal which emails exist.
  private readonly dummyHash = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
  ) {}

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  }

  async login(emailInput: string, password: string): Promise<IssuedSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: emailInput.trim().toLowerCase() },
    });
    const now = new Date();

    if (!user) {
      await bcrypt.compare(password, this.dummyHash);
      throw new UnauthorizedException(INVALID_LOGIN);
    }
    if (user.lockedUntil && user.lockedUntil > now) {
      throw new UnauthorizedException(INVALID_LOGIN);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok || user.status !== UserStatus.Active) {
      if (!ok) {
        const failed = user.failedLoginCount + 1;
        const lock = failed >= MAX_FAILED_LOGINS;
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: lock ? 0 : failed,
            lockedUntil: lock ? new Date(now.getTime() + LOCKOUT_MINUTES * 60_000) : null,
          },
        });
        if (lock) {
          await this.audit.log({
            userId: user.id,
            organizationId: user.organizationId,
            action: 'AccountLocked',
            entityType: 'User',
            entityId: user.id,
          });
        }
      }
      throw new UnauthorizedException(INVALID_LOGIN);
    }

    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    }
    await this.audit.log({
      userId: user.id,
      organizationId: user.organizationId,
      action: 'Login',
      entityType: 'User',
      entityId: user.id,
    });
    return this.issueSession(user);
  }

  async refresh(rawToken: string | undefined): Promise<IssuedSession> {
    if (!rawToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { user: true },
    });
    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (stored.revokedAt) {
      // A rotated token was presented again: assume theft and end every session.
      await this.revokeAllSessions(stored.userId);
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (stored.expiresAt <= new Date() || stored.user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueSession(stored.user);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<IssuedSession> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    const problems = checkPasswordPolicy(newPassword);
    if (problems.length > 0) {
      throw new BadRequestException({ message: problems });
    }
    if (newPassword === currentPassword) {
      throw new BadRequestException('New password must be different from the current one');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await this.hashPassword(newPassword),
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    await this.revokeAllSessions(userId);
    await this.audit.log({
      userId,
      organizationId: user.organizationId,
      action: 'PasswordChanged',
      entityType: 'User',
      entityId: userId,
    });
    const appUrl = this.config.get<string>('APP_BASE_URL') ?? 'http://localhost:5173';
    // Fire and forget: email failures never break the flow (and are logged).
    void this.email.send({
      to: updated.email,
      subject: 'Your password was changed',
      heading: 'Password changed',
      body: 'Your Department App password was just changed. If this was not you, contact your administrator.',
      link: { url: `${appUrl}/login`, label: 'Open the app' },
      type: 'PasswordChanged',
      userId,
      organizationId: user.organizationId,
    });
    return this.issueSession(updated);
  }

  async me(userId: number): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Account not found');
    return toUserResponse(user);
  }

  private revokeAllSessions(userId: number): Promise<unknown> {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueSession(user: User): Promise<IssuedSession> {
    const accessToken = await this.jwt.signAsync({ sub: user.id });
    const decoded = this.jwt.decode<{ exp: number; iat: number }>(accessToken);
    const refreshToken = randomBytes(48).toString('base64url');
    const days = Number(this.config.get<string>('REFRESH_TTL_DAYS') ?? 30);
    const refreshExpiresAt = new Date(Date.now() + days * 86_400_000);
    await this.prisma.refreshToken.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
      },
    });
    return {
      accessToken,
      expiresInSeconds: decoded.exp - decoded.iat,
      user: toUserResponse(user),
      refreshToken,
      refreshExpiresAt,
    };
  }
}
