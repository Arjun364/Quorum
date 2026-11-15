import { SystemRole, TransferStatus, type Company } from '@prisma/client';
import type { AppConfig } from '../config';
import type {
  AuthUser,
  DepartmentRepositoryContract,
  PeopleRepositoryContract,
  TransferRepositoryContract,
  TransferWithContext,
} from '../types';
import { badRequest, companyUrl, conflict, forbidden, notFound } from '../utils';
import type { AuditService } from './audit.service';
import type { EmailSender } from './email.service';
import type { OpenPointsCheck } from './people.service';
import {
  approvalNeeds,
  approvalsAvailableTo,
  canStartTransfer,
  emptyApprovals,
  isFullyApproved,
  missingApprovals,
  transferBlocker,
  withApproval,
  type Approver,
  type ApprovalState,
  type DepartmentFacts,
} from './rules';

/** A transfer as returned to clients, with what is still missing and what the viewer may do. */
export interface TransferResponse {
  id: number;
  status: TransferStatus;
  person: { id: number; name: string };
  from: { id: number; name: string };
  to: { id: number; name: string };
  needs: Approver[];
  approved: Approver[];
  missing: Approver[];
  note: string | null;
  createdAt: string;
  completedAt: string | null;
  canApprove: boolean;
  canCancel: boolean;
}

/** What starts a transfer. */
export interface TransferRequest {
  userId: number;
  toDepartmentId: number;
}

const facts = (d: TransferWithContext['fromDepartment']): DepartmentFacts => ({ id: d.id, organizationId: d.organizationId, headUserId: d.headUserId });

/** Reads the stored approval flags back into the rules' state. */
const stateOf = (t: TransferWithContext): ApprovalState => ({
  needFromHead: t.needFromHead,
  needToHead: t.needToHead,
  needCompanyHead: t.needCompanyHead,
  fromHeadApproved: t.fromHeadApprovedAt !== null,
  toHeadApproved: t.toHeadApprovedAt !== null,
  companyHeadApproved: t.companyHeadApprovedAt !== null,
});

const needsOf = (state: ApprovalState): Approver[] => [
  ...(state.needFromHead ? (['FromHead'] as const) : []),
  ...(state.needToHead ? (['ToHead'] as const) : []),
  ...(state.needCompanyHead ? (['CompanyHead'] as const) : []),
];

const approvedOf = (state: ApprovalState): Approver[] => [
  ...(state.fromHeadApproved ? (['FromHead'] as const) : []),
  ...(state.toHeadApproved ? (['ToHead'] as const) : []),
  ...(state.companyHeadApproved ? (['CompanyHead'] as const) : []),
];

/** Dependencies of the transfer service. */
export interface TransferServiceDeps {
  transfers: TransferRepositoryContract;
  people: PeopleRepositoryContract;
  departments: DepartmentRepositoryContract;
  openPoints: OpenPointsCheck;
  audit: AuditService;
  email: EmailSender;
  config: Pick<AppConfig, 'appBaseUrl'>;
}

/** Moves people between departments: a request that completes only when every needed head has agreed. */
export class TransferService {
  constructor(private readonly deps: TransferServiceDeps) {}

  /** Starts a transfer; the starter's own approval counts at once, and everyone else who must agree is told by email. */
  async request(company: Company, actor: AuthUser, input: TransferRequest): Promise<TransferResponse> {
    const person = await this.deps.people.findInCompany(company.id, input.userId);
    if (!person) throw notFound('Person not found');
    const fromDepartment = person.departmentId ? await this.deps.departments.findById(company.id, person.departmentId) : null;
    const toDepartment = await this.deps.departments.findById(company.id, input.toDepartmentId);
    if (!fromDepartment) throw badRequest('This person is not in a department yet.');
    if (!toDepartment) throw notFound('Destination department not found');

    const blocker = transferBlocker(person, fromDepartment, toDepartment);
    if (blocker) throw badRequest(blocker);
    if (!canStartTransfer(actor, fromDepartment, toDepartment)) throw forbidden('Only the company head or the head of either department can start a move.');
    if (await this.deps.transfers.findPendingForUser(company.id, person.id)) throw conflict('This person already has a move waiting for approval.');
    if ((await this.deps.openPoints.countOpenOwned(company.id, person.id)) > 0) throw conflict('Reassign this person’s open points before moving them.');

    let state = emptyApprovals(approvalNeeds(fromDepartment, toDepartment));
    for (const approver of approvalsAvailableTo(actor, fromDepartment, toDepartment)) state = withApproval(state, approver);

    const created = await this.deps.transfers.create({
      companyId: company.id,
      userId: person.id,
      fromDepartmentId: fromDepartment.id,
      toDepartmentId: toDepartment.id,
      initiatedBy: actor.id,
      ...this.flags(state),
    });
    await this.deps.audit.log({ userId: actor.id, companyId: company.id, action: 'TransferRequested', entityType: 'DepartmentTransfer', entityId: created.id, details: { userId: person.id, from: fromDepartment.id, to: toDepartment.id } });

    const loaded = await this.requireTransfer(company.id, created.id);
    if (isFullyApproved(state)) await this.finish(company, actor, loaded);
    else await this.notifyApprovers(company, loaded, state);
    return this.toResponse(await this.requireTransfer(company.id, created.id), actor);
  }

  /** Lists transfers the viewer is concerned with: all for the company head, those touching their department for a head. */
  async list(companyId: number, actor: AuthUser): Promise<TransferResponse[]> {
    if (actor.systemRole === SystemRole.CompanyHead) {
      return (await this.deps.transfers.list(companyId, {})).map((t) => this.toResponse(t, actor));
    }
    const mine = (await this.deps.departments.listAll(companyId)).filter((d) => d.headUserId === actor.id).map((d) => d.id);
    if (mine.length === 0) return [];
    return (await this.deps.transfers.list(companyId, { departmentIds: mine })).map((t) => this.toResponse(t, actor));
  }

  /** Records the viewer's approval; when the last one arrives the person moves. */
  async approve(company: Company, actor: AuthUser, id: number): Promise<TransferResponse> {
    const transfer = await this.requirePending(company.id, id);
    const state = stateOf(transfer);
    const mine = approvalsAvailableTo(actor, facts(transfer.fromDepartment), facts(transfer.toDepartment)).filter((a) => missingApprovals(state).includes(a));
    if (mine.length === 0) throw forbidden('You have no approval to give on this move.');

    let next = state;
    for (const approver of mine) next = withApproval(next, approver);
    await this.deps.transfers.update(company.id, id, this.approvalDates(next, state));
    await this.deps.audit.log({ userId: actor.id, companyId: company.id, action: 'TransferApproved', entityType: 'DepartmentTransfer', entityId: id, details: { as: mine } });

    const reloaded = await this.requireTransfer(company.id, id);
    if (isFullyApproved(next)) await this.finish(company, actor, reloaded);
    return this.toResponse(await this.requireTransfer(company.id, id), actor);
  }

  /** Declines the move; anyone who could approve it may decline it, with an optional note. */
  async reject(company: Company, actor: AuthUser, id: number, note: string | null): Promise<TransferResponse> {
    const transfer = await this.requirePending(company.id, id);
    const entitled = approvalsAvailableTo(actor, facts(transfer.fromDepartment), facts(transfer.toDepartment)).length > 0;
    if (!entitled) throw forbidden('You cannot decline this move.');
    await this.deps.transfers.update(company.id, id, { status: TransferStatus.Rejected, decidedBy: actor.id, decisionNote: note?.trim() || null });
    await this.deps.audit.log({ userId: actor.id, companyId: company.id, action: 'TransferRejected', entityType: 'DepartmentTransfer', entityId: id });
    await this.tell(company, transfer.initiatedBy, 'A move was declined', `The move of ${transfer.user.name} to ${transfer.toDepartment.name} was declined.`);
    return this.toResponse(await this.requireTransfer(company.id, id), actor);
  }

  /** Withdraws a waiting move; the one who started it or the company head may. */
  async cancel(company: Company, actor: AuthUser, id: number): Promise<TransferResponse> {
    const transfer = await this.requirePending(company.id, id);
    if (transfer.initiatedBy !== actor.id && actor.systemRole !== SystemRole.CompanyHead) throw forbidden('Only the one who started this move can withdraw it.');
    await this.deps.transfers.update(company.id, id, { status: TransferStatus.Cancelled, decidedBy: actor.id });
    await this.deps.audit.log({ userId: actor.id, companyId: company.id, action: 'TransferCancelled', entityType: 'DepartmentTransfer', entityId: id });
    return this.toResponse(await this.requireTransfer(company.id, id), actor);
  }

  /** Moves the person, records the completion and tells them. */
  private async finish(company: Company, actor: AuthUser, transfer: TransferWithContext): Promise<void> {
    await this.deps.transfers.complete(company.id, transfer.id, { decidedBy: actor.id }, transfer.userId, transfer.toDepartmentId);
    await this.deps.audit.log({ userId: actor.id, companyId: company.id, action: 'TransferCompleted', entityType: 'DepartmentTransfer', entityId: transfer.id, details: { userId: transfer.userId, to: transfer.toDepartmentId } });
    await this.tell(company, transfer.userId, 'You have moved departments', `You are now in ${transfer.toDepartment.name}.`);
  }

  /** Emails each person whose approval is still needed, once. */
  private async notifyApprovers(company: Company, transfer: TransferWithContext, state: ApprovalState): Promise<void> {
    const ids = new Set<number>();
    for (const approver of missingApprovals(state)) {
      if (approver === 'FromHead' && transfer.fromDepartment.headUserId) ids.add(transfer.fromDepartment.headUserId);
      if (approver === 'ToHead' && transfer.toDepartment.headUserId) ids.add(transfer.toDepartment.headUserId);
      if (approver === 'CompanyHead') {
        const head = await this.deps.people.findCompanyHead(company.id);
        if (head) ids.add(head.id);
      }
    }
    ids.delete(transfer.initiatedBy);
    for (const id of ids) {
      await this.tell(company, id, 'A move needs your approval', `${transfer.user.name} is proposed to move from ${transfer.fromDepartment.name} to ${transfer.toDepartment.name}.`, '/people/transfers');
    }
  }

  /** Sends one short notification email with a link into the app (never any minutes). */
  private async tell(company: Company, userId: number, heading: string, body: string, path = '/'): Promise<void> {
    const user = await this.deps.people.findInCompany(company.id, userId);
    if (!user) return;
    await this.deps.email.send({
      to: user.email,
      subject: heading,
      heading,
      body,
      link: { url: companyUrl(this.deps.config.appBaseUrl, company.slug, path), label: 'Open Quorum' },
      type: 'Transfer',
      userId: user.id,
      companyId: company.id,
    });
  }

  private flags(state: ApprovalState) {
    const now = new Date();
    return {
      needFromHead: state.needFromHead,
      needToHead: state.needToHead,
      needCompanyHead: state.needCompanyHead,
      fromHeadApprovedAt: state.fromHeadApproved ? now : null,
      toHeadApprovedAt: state.toHeadApproved ? now : null,
      companyHeadApprovedAt: state.companyHeadApproved ? now : null,
    };
  }

  /** Dates only for approvals that are new compared with the earlier state. */
  private approvalDates(next: ApprovalState, before: ApprovalState) {
    const now = new Date();
    return {
      ...(next.fromHeadApproved && !before.fromHeadApproved ? { fromHeadApprovedAt: now } : {}),
      ...(next.toHeadApproved && !before.toHeadApproved ? { toHeadApprovedAt: now } : {}),
      ...(next.companyHeadApproved && !before.companyHeadApproved ? { companyHeadApprovedAt: now } : {}),
    };
  }

  private async requireTransfer(companyId: number, id: number): Promise<TransferWithContext> {
    const transfer = await this.deps.transfers.findById(companyId, id);
    if (!transfer) throw notFound('Transfer not found');
    return transfer;
  }

  private async requirePending(companyId: number, id: number): Promise<TransferWithContext> {
    const transfer = await this.requireTransfer(companyId, id);
    if (transfer.status !== TransferStatus.Pending) throw conflict('This move is no longer waiting for approval.');
    return transfer;
  }

  private toResponse(t: TransferWithContext, actor: AuthUser): TransferResponse {
    const state = stateOf(t);
    const missing = missingApprovals(state);
    const pending = t.status === TransferStatus.Pending;
    const mine = approvalsAvailableTo(actor, facts(t.fromDepartment), facts(t.toDepartment));
    return {
      id: t.id,
      status: t.status,
      person: { id: t.user.id, name: t.user.name },
      from: { id: t.fromDepartment.id, name: t.fromDepartment.name },
      to: { id: t.toDepartment.id, name: t.toDepartment.name },
      needs: needsOf(state),
      approved: approvedOf(state),
      missing,
      note: t.decisionNote,
      createdAt: t.createdAt.toISOString(),
      completedAt: t.completedAt?.toISOString() ?? null,
      canApprove: pending && mine.some((a) => missing.includes(a)),
      canCancel: pending && (t.initiatedBy === actor.id || actor.systemRole === SystemRole.CompanyHead),
    };
  }
}