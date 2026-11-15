import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from './auth.service';
import { checkPasswordPolicy } from './password-policy';

/**
 * One-time bootstrap: creates the PlatformOwner ONLY when no users exist.
 * Credentials come from the environment; nothing is hard-coded.
 */
@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if ((await this.prisma.user.count()) > 0) {
      return;
    }
    const email = this.config.get<string>('BOOTSTRAP_OWNER_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('BOOTSTRAP_OWNER_PASSWORD');
    if (!email || !password) {
      this.logger.warn(
        'No users exist and BOOTSTRAP_OWNER_EMAIL / BOOTSTRAP_OWNER_PASSWORD are not set; nobody can log in yet.',
      );
      return;
    }
    const problems = checkPasswordPolicy(password);
    if (problems.length > 0) {
      throw new Error(`BOOTSTRAP_OWNER_PASSWORD is too weak: ${problems.join('; ')}`);
    }
    const owner = await this.prisma.user.create({
      data: {
        name: 'Platform Owner',
        email,
        passwordHash: await this.auth.hashPassword(password),
        systemRole: SystemRole.PlatformOwner,
        status: UserStatus.Active,
        mustChangePassword: true,
      },
    });
    await this.audit.log({
      userId: owner.id,
      action: 'BootstrapPlatformOwner',
      entityType: 'User',
      entityId: owner.id,
    });
    this.logger.log(`Created platform owner ${email}; password change is required at first login.`);
  }
}
