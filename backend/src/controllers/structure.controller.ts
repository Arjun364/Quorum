import type { RequestHandler } from 'express';
import { requireCompany } from '../middlewares';
import type { InvitationService, StructureService } from '../services';
import type { InviteBody, NameAndCodeBody, StructureUpdateBody } from '../validators';

/** Builds the structure controller: organizations, departments and department-head invitations. */
export function createStructureController(structure: StructureService, invitations: InvitationService) {
  const companyId = (req: Parameters<typeof requireCompany>[0]): number => requireCompany(req).id;
  const id = (req: { params: unknown }): number => (req.params as { id: number }).id;

  /** GET /organizations */
  const listOrganizations: RequestHandler = async (req, res) => {
    res.status(200).json(await structure.listOrganizations(companyId(req)));
  };

  /** POST /organizations */
  const createOrganization: RequestHandler = async (req, res) => {
    res.status(201).json(await structure.createOrganization(companyId(req), req.user!.id, req.body as NameAndCodeBody));
  };

  /** PUT /organizations/:id */
  const updateOrganization: RequestHandler = async (req, res) => {
    res.status(200).json(await structure.updateOrganization(companyId(req), req.user!.id, id(req), req.body as StructureUpdateBody));
  };

  /** GET /organizations/:id/departments */
  const listDepartments: RequestHandler = async (req, res) => {
    res.status(200).json(await structure.listDepartments(companyId(req), id(req)));
  };

  /** POST /organizations/:id/departments */
  const createDepartment: RequestHandler = async (req, res) => {
    res.status(201).json(await structure.createDepartment(companyId(req), req.user!.id, id(req), req.body as NameAndCodeBody));
  };

  /** PUT /departments/:id */
  const updateDepartment: RequestHandler = async (req, res) => {
    res.status(200).json(await structure.updateDepartment(companyId(req), req.user!.id, id(req), req.body as StructureUpdateBody));
  };

  /** POST /departments/:id/head-invitation */
  const inviteHead: RequestHandler = async (req, res) => {
    res.status(201).json(await invitations.inviteDepartmentHead(requireCompany(req), req.user!.id, id(req), req.body as InviteBody));
  };

  /** POST /invitations/:id/resend */
  const resendInvitation: RequestHandler = async (req, res) => {
    res.status(200).json(await invitations.resend(requireCompany(req), req.user!.id, id(req)));
  };

  /** DELETE /invitations/:id */
  const revokeInvitation: RequestHandler = async (req, res) => {
    await invitations.revoke(companyId(req), req.user!.id, id(req));
    res.status(204).end();
  };

  return {
    listOrganizations, createOrganization, updateOrganization, listDepartments, createDepartment,
    updateDepartment, inviteHead, resendInvitation, revokeInvitation,
  };
}

export type StructureController = ReturnType<typeof createStructureController>;