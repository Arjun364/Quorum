import type { RequestHandler } from 'express';
import { requireCompany } from '../middlewares';
import type { InvitationService, PeopleService, ProfileService, TransferService } from '../services';
import type { InviteBody, LogoBody, ProfileBody, RejectTransferBody, TransferRequestBody } from '../validators';

/** Builds the people controller: department people, employee invitations, deactivation, transfers and the signed-in person's profile. */
export function createPeopleController(people: PeopleService, invitations: InvitationService, transfers: TransferService, profile: ProfileService) {
  const id = (req: { params: unknown }): number => (req.params as { id: number }).id;

  /** GET /departments */
  const listDepartmentOptions: RequestHandler = async (req, res) => {
    res.status(200).json(await people.listDepartmentOptions(requireCompany(req).id));
  };

  /** GET /departments/:id/people */
  const listPeople: RequestHandler = async (req, res) => {
    res.status(200).json(await people.listDepartmentPeople(requireCompany(req).id, req.user!, id(req)));
  };

  /** POST /departments/:id/employee-invitation */
  const inviteEmployee: RequestHandler = async (req, res) => {
    res.status(201).json(await invitations.inviteEmployee(requireCompany(req), req.user!, id(req), req.body as InviteBody));
  };

  /** POST /users/:id/deactivate */
  const deactivate: RequestHandler = async (req, res) => {
    res.status(200).json(await people.deactivate(requireCompany(req).id, req.user!, id(req)));
  };

  /** GET /transfers */
  const listTransfers: RequestHandler = async (req, res) => {
    res.status(200).json(await transfers.list(requireCompany(req).id, req.user!));
  };

  /** POST /transfers */
  const requestTransfer: RequestHandler = async (req, res) => {
    res.status(201).json(await transfers.request(requireCompany(req), req.user!, req.body as TransferRequestBody));
  };

  /** POST /transfers/:id/approve */
  const approveTransfer: RequestHandler = async (req, res) => {
    res.status(200).json(await transfers.approve(requireCompany(req), req.user!, id(req)));
  };

  /** POST /transfers/:id/reject */
  const rejectTransfer: RequestHandler = async (req, res) => {
    res.status(200).json(await transfers.reject(requireCompany(req), req.user!, id(req), (req.body as RejectTransferBody).note ?? null));
  };

  /** DELETE /transfers/:id (withdraws a waiting move) */
  const cancelTransfer: RequestHandler = async (req, res) => {
    res.status(200).json(await transfers.cancel(requireCompany(req), req.user!, id(req)));
  };

  /** GET /profile */
  const getProfile: RequestHandler = async (req, res) => {
    res.status(200).json(await profile.get(requireCompany(req).id, req.user!.id));
  };

  /** PUT /profile */
  const updateProfile: RequestHandler = async (req, res) => {
    const body = req.body as ProfileBody;
    res.status(200).json(await profile.update(requireCompany(req).id, req.user!.id, { name: body.name, jobTitle: body.jobTitle ?? null, phone: body.phone ?? null }));
  };

  /** POST /profile/avatar/signature */
  const avatarSignature: RequestHandler = (req, res) => {
    res.status(200).json(profile.createAvatarSignature(requireCompany(req)));
  };

  /** PUT /profile/avatar */
  const setAvatar: RequestHandler = async (req, res) => {
    res.status(200).json(await profile.setAvatar(requireCompany(req), req.user!.id, req.body as LogoBody));
  };

  /** DELETE /profile/avatar */
  const removeAvatar: RequestHandler = async (req, res) => {
    res.status(200).json(await profile.removeAvatar(requireCompany(req).id, req.user!.id));
  };

  return {
    listDepartmentOptions, listPeople, inviteEmployee, deactivate, listTransfers, requestTransfer, approveTransfer,
    rejectTransfer, cancelTransfer, getProfile, updateProfile, avatarSignature, setAvatar, removeAvatar,
  };
}

export type PeopleController = ReturnType<typeof createPeopleController>;