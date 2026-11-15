import { Router } from 'express';
import type { AppConfig } from '../config';
import {
  createAuthController,
  createCompanyController,
  createHealthController,
  createInvitationController,
  createPeopleController,
  createStructureController,
} from '../controllers';
import { createAuthenticate, createResolveCompany, type RateLimiters } from '../middlewares';
import type { Services } from '../services';
import type { CompanyRepositoryContract, UserRepositoryContract } from '../types';
import { createAuthRouter } from './auth.routes';
import { createCompanyHeadRouter, createInvitationRouter, createPublicCompanyRouter } from './company.routes';
import { createHealthRouter } from './health.routes';
import { createPeopleRouter } from './people.routes';

/** Everything the HTTP layer needs; built once at startup (or by tests with fakes). */
export interface AppDependencies {
  config: AppConfig;
  services: Pick<Services, 'auth' | 'jwt' | 'company' | 'structure' | 'invitations' | 'people' | 'transfers' | 'profile'>;
  users: UserRepositoryContract;
  companies: CompanyRepositoryContract;
  checkDatabase: () => Promise<void>;
  rateLimiters: RateLimiters;
}

/** Builds the /api router: public health check, then the company is resolved from the address, then everything else. */
export function createApiRouter(deps: AppDependencies): Router {
  const authenticate = createAuthenticate({ users: deps.users, jwt: deps.services.jwt });
  const company = createCompanyController(deps.services.company, deps.services.auth);
  const structure = createStructureController(deps.services.structure, deps.services.invitations);
  const invitations = createInvitationController(deps.services.invitations, deps.config);
  const people = createPeopleController(deps.services.people, deps.services.invitations, deps.services.transfers, deps.services.profile);

  const router = Router();
  router.use('/health', createHealthRouter(createHealthController(deps.checkDatabase)));
  router.use(deps.rateLimiters.general);
  router.use(createResolveCompany({ companies: deps.companies, rootHost: deps.config.appRootHost }));
  router.use(createPublicCompanyRouter(company, deps.rateLimiters));
  router.use(createInvitationRouter(invitations, deps.rateLimiters));
  router.use('/auth', createAuthRouter(createAuthController(deps.services.auth, deps.services.company, deps.config), authenticate, deps.rateLimiters));
  router.use(createCompanyHeadRouter(company, structure, authenticate));
  router.use(createPeopleRouter(people, structure, authenticate));
  return router;
}