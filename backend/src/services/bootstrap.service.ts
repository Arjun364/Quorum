import { SystemRole, UserStatus } from '@prisma/client';
import type { AppConfig } from '../config';
import { hashPassword } from '../helpers';
import type { UserRepositoryContract } from '../types';
import { checkPasswordPolicy, createLogger } from '../utils';
import type { AuditService } from './audit.service';

const logger = createLogger('Bootstrap');

/**
 * One-time bootstrap: creates the PlatformOwner ONLY when no users exist.
 * Credentials come from the environment; nothing is hard-coded.
 */
export class BootstrapService {
  constructor(
    private readonly users: UserRepositoryContract,
    private readonly audit: AuditService,
    private readonly config: Pick<AppConfig, 'bootstrapOwnerEmail' | 'bootstrapOwnerPassword'>,
  ) {}

  /** Creates the platform owner when the users table is empty; does nothing otherwise. */
  async run(): Promise<void> {
    if ((await this.users.count()) > 0) {
      return;
    }
    const { bootstrapOwnerEmail: email, bootstrapOwnerPassword: password } = this.config;
    if (!email || !password) {
      logger.warn(
        'No users exist and BOOTSTRAP_OWNER_EMAIL / BOOTSTRAP_OWNER_PASSWORD are not set; nobody can log in yet.',
      );
      return;
    }
    const problems = checkPasswordPolicy(password);
    if (problems.length > 0) {
      throw new Error(`BOOTSTRAP_OWNER_PASSWORD is too weak: ${problems.join('; ')}`);
    }
    const owner = await this.users.create({
      name: 'Platform Owner',
      email,
      passwordHash: await hashPassword(password),
      systemRole: SystemRole.PlatformOwner,
      status: UserStatus.Active,
      mustChangePassword: true,
      emailVerifiedAt: new Date(),
    });
    await this.audit.log({
      userId: owner.id,
      action: 'BootstrapPlatformOwner',
      entityType: 'User',
      entityId: owner.id,
    });
    logger.info(`Created platform owner ${email}; password change is required at first login.`);
  }
}
