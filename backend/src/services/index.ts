import type { AppConfig } from '../config';
import { createJwtHelper } from '../helpers';
import type { Repositories } from '../repositories';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { BootstrapService } from './bootstrap.service';
import { EmailService } from './email.service';

export * from './audit.service';
export * from './auth.service';
export * from './bootstrap.service';
export * from './email.service';

/** Wires every service to its repositories and settings (the composition root for business logic). */
export function createServices(repos: Repositories, config: AppConfig) {
  const jwt = createJwtHelper(config.jwtAccessSecret, config.jwtAccessTtl);
  const audit = new AuditService(repos.auditLogs);
  const email = new EmailService(config, repos.emailLogs);
  const auth = new AuthService({
    users: repos.users,
    refreshTokens: repos.refreshTokens,
    audit,
    email,
    jwt,
    config,
  });
  const bootstrap = new BootstrapService(repos.users, audit, config);
  return { jwt, audit, email, auth, bootstrap };
}

export type Services = ReturnType<typeof createServices>;
