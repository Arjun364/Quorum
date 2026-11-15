import type { AppConfig } from '../config';
import { createJwtHelper } from '../helpers';
import type { Repositories } from '../repositories';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { BootstrapService } from './bootstrap.service';
import { CompanyService } from './company.service';
import { EmailService } from './email.service';
import { InvitationService } from './invitation.service';
import { StructureService } from './structure.service';

export * from './audit.service';
export * from './auth.service';
export * from './bootstrap.service';
export * from './company.service';
export * from './email.service';
export * from './invitation.service';
export * from './structure.service';

/** Wires every service to its repositories and settings (the composition root for business logic). */
export function createServices(repos: Repositories, config: AppConfig) {
  const jwt = createJwtHelper(config.jwtAccessSecret, config.jwtAccessTtl);
  const audit = new AuditService(repos.auditLogs);
  const email = new EmailService(config, repos.emailLogs);
  const auth = new AuthService({ users: repos.users, refreshTokens: repos.refreshTokens, audit, email, jwt, config });
  const bootstrap = new BootstrapService(repos.users, audit, config);
  const company = new CompanyService({
    companies: repos.companies,
    users: repos.users,
    verificationTokens: repos.verificationTokens,
    audit,
    email,
    config,
  });
  const structure = new StructureService({
    organizations: repos.organizations,
    departments: repos.departments,
    invitations: repos.invitations,
    audit,
  });
  const invitations = new InvitationService({
    invitations: repos.invitations,
    departments: repos.departments,
    users: repos.users,
    audit,
    email,
    auth,
    config,
  });
  return { jwt, audit, email, auth, bootstrap, company, structure, invitations };
}

export type Services = ReturnType<typeof createServices>;
