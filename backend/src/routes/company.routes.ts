import { SystemRole } from '@prisma/client';
import { Router } from 'express';
import type { CompanyController, InvitationController, StructureController } from '../controllers';
import { requireRoles, validateBody, validateParams, validateQuery, type Authenticate, type RateLimiters } from '../middlewares';
import {
  acceptInvitationSchema,
  brandSchema,
  idParamSchema,
  inviteSchema,
  logoSchema,
  nameAndCodeSchema,
  signupSchema,
  slugQuerySchema,
  structureUpdateSchema,
  tokenQuerySchema,
} from '../validators';

/** Public routes: company registration, the address check, and the branding of a company's sign-in page. */
export function createPublicCompanyRouter(controller: CompanyController, limits: RateLimiters): Router {
  const router = Router();
  router.post('/companies/signup', limits.signup, validateBody(signupSchema), controller.signup);
  router.get('/companies/slug-available', limits.signup, validateQuery(slugQuerySchema), controller.slugAvailable);
  router.get('/company/public', controller.publicInfo);
  return router;
}

/** Routes of the company head: brand settings, organizations, departments and department-head invitations. */
export function createCompanyHeadRouter(
  company: CompanyController,
  structure: StructureController,
  authenticate: Authenticate,
): Router {
  const router = Router();
  const head = [authenticate(), requireRoles(SystemRole.CompanyHead)];
  router.get('/company', ...head, company.current);
  router.put('/company/brand', ...head, validateBody(brandSchema), company.updateBrand);
  router.post('/company/logo/signature', ...head, company.logoSignature);
  router.put('/company/logo', ...head, validateBody(logoSchema), company.setLogo);

  router.get('/organizations', ...head, structure.listOrganizations);
  router.post('/organizations', ...head, validateBody(nameAndCodeSchema), structure.createOrganization);
  router.put('/organizations/:id', ...head, validateParams(idParamSchema), validateBody(structureUpdateSchema), structure.updateOrganization);
  router.get('/organizations/:id/departments', ...head, validateParams(idParamSchema), structure.listDepartments);
  router.post('/organizations/:id/departments', ...head, validateParams(idParamSchema), validateBody(nameAndCodeSchema), structure.createDepartment);
  router.put('/departments/:id', ...head, validateParams(idParamSchema), validateBody(structureUpdateSchema), structure.updateDepartment);
  router.post('/departments/:id/head-invitation', ...head, validateParams(idParamSchema), validateBody(inviteSchema), structure.inviteHead);
  router.post('/invitations/:id/resend', ...head, validateParams(idParamSchema), structure.resendInvitation);
  router.delete('/invitations/:id', ...head, validateParams(idParamSchema), structure.revokeInvitation);
  return router;
}

/** Public routes used by the invited person, who has no account yet. */
export function createInvitationRouter(controller: InvitationController, limits: RateLimiters): Router {
  const router = Router();
  router.get('/invitations/lookup', limits.login, validateQuery(tokenQuerySchema), controller.lookup);
  router.post('/invitations/accept', limits.login, validateBody(acceptInvitationSchema), controller.accept);
  return router;
}