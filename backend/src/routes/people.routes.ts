import { SystemRole } from '@prisma/client';
import { Router } from 'express';
import type { PeopleController, StructureController } from '../controllers';
import { requireRoles, validateBody, validateParams, type Authenticate } from '../middlewares';
import { idParamSchema, inviteSchema, logoSchema, profileSchema, rejectTransferSchema, transferRequestSchema } from '../validators';

/** Routes for people: department lists, employee invitations, deactivation, transfers and each person's own profile. */
export function createPeopleRouter(people: PeopleController, structure: StructureController, authenticate: Authenticate): Router {
  const router = Router();
  const signedIn = [authenticate()];
  const heads = [authenticate(), requireRoles(SystemRole.CompanyHead, SystemRole.DepartmentHead)];

  router.get('/departments', ...heads, people.listDepartmentOptions);
  router.get('/departments/:id/people', ...signedIn, validateParams(idParamSchema), people.listPeople);
  router.post('/departments/:id/employee-invitation', ...heads, validateParams(idParamSchema), validateBody(inviteSchema), people.inviteEmployee);
  router.post('/users/:id/deactivate', ...heads, validateParams(idParamSchema), people.deactivate);

  // Department heads manage the invitations of their own department; the service checks which.
  router.post('/invitations/:id/resend', ...heads, validateParams(idParamSchema), structure.resendInvitation);
  router.delete('/invitations/:id', ...heads, validateParams(idParamSchema), structure.revokeInvitation);

  router.get('/transfers', ...heads, people.listTransfers);
  router.post('/transfers', ...heads, validateBody(transferRequestSchema), people.requestTransfer);
  router.post('/transfers/:id/approve', ...heads, validateParams(idParamSchema), people.approveTransfer);
  router.post('/transfers/:id/reject', ...heads, validateParams(idParamSchema), validateBody(rejectTransferSchema), people.rejectTransfer);
  router.delete('/transfers/:id', ...heads, validateParams(idParamSchema), people.cancelTransfer);

  router.get('/profile', ...signedIn, people.getProfile);
  router.put('/profile', ...signedIn, validateBody(profileSchema), people.updateProfile);
  router.post('/profile/avatar/signature', ...signedIn, people.avatarSignature);
  router.put('/profile/avatar', ...signedIn, validateBody(logoSchema), people.setAvatar);
  router.delete('/profile/avatar', ...signedIn, people.removeAvatar);
  return router;
}