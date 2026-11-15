import { UserStatus } from '@prisma/client';
import type { RequestHandler } from 'express';
import { PASSWORD_CHANGE_REQUIRED_CODE } from '../constants';
import type { JwtHelper } from '../helpers';
import { tenantStorage } from '../prisma';
import type { UserRepositoryContract } from '../types';
import { forbidden, unauthorized } from '../utils';

/** Options of one protected route. */
export interface AuthenticateOptions {
  /** Let the route be used while the user still must change their password (change-password, me). */
  allowPasswordChangeRequired?: boolean;
}

/**
 * Builds the authentication middleware factory. The middleware verifies the access token, reloads the user
 * from the database (so deactivation takes effect immediately), enforces `mustChangePassword`, and runs the
 * rest of the request inside that user's tenant context.
 */
export function createAuthenticate(deps: { users: UserRepositoryContract; jwt: JwtHelper }) {
  return (options: AuthenticateOptions = {}): RequestHandler =>
    async (req, _res, next) => {
      const header = req.headers.authorization;
      const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
      if (!token) throw unauthorized('Missing access token');

      const userId = deps.jwt.verify(token);
      if (userId === null) throw unauthorized('Invalid or expired access token');

      const user = await deps.users.findAuthById(userId);
      if (!user || user.status !== UserStatus.Active) throw unauthorized('Account is not active');

      if (user.mustChangePassword && !options.allowPasswordChangeRequired) {
        throw forbidden('You must change your password before continuing', PASSWORD_CHANGE_REQUIRED_CODE);
      }

      req.user = {
        id: user.id,
        organizationId: user.organizationId,
        departmentId: user.departmentId,
        systemRole: user.systemRole,
        mustChangePassword: user.mustChangePassword,
      };
      tenantStorage.run({ organizationId: user.organizationId }, () => next());
    };
}

export type Authenticate = ReturnType<typeof createAuthenticate>;
