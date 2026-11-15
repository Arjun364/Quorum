import { Router } from 'express';
import type { AppConfig } from '../config';
import { createAuthController, createHealthController } from '../controllers';
import { createAuthenticate, type RateLimiters } from '../middlewares';
import type { Services } from '../services';
import type { UserRepositoryContract } from '../types';
import { createAuthRouter } from './auth.routes';
import { createHealthRouter } from './health.routes';

/** Everything the HTTP layer needs; built once at startup (or by tests with fakes). */
export interface AppDependencies {
  config: AppConfig;
  services: Pick<Services, 'auth' | 'jwt'>;
  users: UserRepositoryContract;
  checkDatabase: () => Promise<void>;
  rateLimiters: RateLimiters;
}

/** Builds the /api router: public health check, then everything else behind the general rate limit. */
export function createApiRouter(deps: AppDependencies): Router {
  const authenticate = createAuthenticate({ users: deps.users, jwt: deps.services.jwt });
  const router = Router();
  router.use('/health', createHealthRouter(createHealthController(deps.checkDatabase)));
  router.use(deps.rateLimiters.general);
  router.use('/auth', createAuthRouter(createAuthController(deps.services.auth, deps.config), authenticate, deps.rateLimiters));
  return router;
}
