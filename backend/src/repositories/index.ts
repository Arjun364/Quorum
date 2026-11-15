import type { PrismaClient } from '@prisma/client';
import { AuditLogRepository } from './audit-log.repository';
import { CompanyRepository, VerificationTokenRepository } from './company.repository';
import { EmailLogRepository } from './email-log.repository';
import { InvitationRepository } from './invitation.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { DepartmentRepository, OrganizationRepository } from './structure.repository';
import { UserRepository } from './user.repository';

export * from './audit-log.repository';
export * from './company.repository';
export * from './email-log.repository';
export * from './invitation.repository';
export * from './refresh-token.repository';
export * from './structure.repository';
export * from './user.repository';

/** Builds every repository on top of the Prisma client. */
export function createRepositories(db: PrismaClient) {
  return {
    users: new UserRepository(db),
    refreshTokens: new RefreshTokenRepository(db),
    auditLogs: new AuditLogRepository(db),
    emailLogs: new EmailLogRepository(db),
    companies: new CompanyRepository(db),
    verificationTokens: new VerificationTokenRepository(db),
    organizations: new OrganizationRepository(db),
    departments: new DepartmentRepository(db),
    invitations: new InvitationRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;