import type { PrismaClient } from '@prisma/client';
import { AuditLogRepository } from './audit-log.repository';
import { EmailLogRepository } from './email-log.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { UserRepository } from './user.repository';

export * from './audit-log.repository';
export * from './email-log.repository';
export * from './refresh-token.repository';
export * from './user.repository';

/** Builds every repository on top of the Prisma client. */
export function createRepositories(db: PrismaClient) {
  return {
    users: new UserRepository(db),
    refreshTokens: new RefreshTokenRepository(db),
    auditLogs: new AuditLogRepository(db),
    emailLogs: new EmailLogRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
