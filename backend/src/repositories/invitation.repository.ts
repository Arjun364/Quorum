import { SystemRole, UserStatus, type Invitation, type PrismaClient, type User } from '@prisma/client';
import type { InvitationRepositoryContract, InvitationWithContext } from '../types';

/** Reads and writes invitations (token hashes only). */
export class InvitationRepository implements InvitationRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  /** Stores a new invitation. */
  create(data: {
    companyId: number;
    departmentId: number;
    email: string;
    name: string;
    role: SystemRole;
    tokenHash: string;
    expiresAt: Date;
    invitedBy: number;
  }): Promise<Invitation> {
    return this.db.invitation.create({ data });
  }

  /** Finds an invitation by its token hash, with the company and department it is for. */
  findByHash(tokenHash: string): Promise<InvitationWithContext | null> {
    return this.db.invitation.findUnique({
      where: { tokenHash },
      include: {
        company: { select: { id: true, name: true, slug: true, status: true } },
        department: { select: { id: true, name: true, headUserId: true } },
      },
    });
  }

  /** Finds one invitation of the company, or null. */
  findById(companyId: number, id: number): Promise<Invitation | null> {
    return this.db.invitation.findFirst({ where: { id, companyId } });
  }

  /** Lists invitations that are neither accepted nor revoked, for the given departments. */
  listOpenByDepartments(companyId: number, departmentIds: number[]): Promise<Invitation[]> {
    return this.db.invitation.findMany({
      where: { companyId, departmentId: { in: departmentIds }, acceptedAt: null, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Revokes one invitation of the company. */
  async revoke(companyId: number, id: number): Promise<void> {
    await this.db.invitation.updateMany({ where: { id, companyId, acceptedAt: null }, data: { revokedAt: new Date() } });
  }

  /** Revokes open invitations of the same address to the same department. */
  async revokeOpenFor(companyId: number, departmentId: number, email: string): Promise<void> {
    await this.db.invitation.updateMany({
      where: { companyId, departmentId, email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Replaces an invitation's token and expiry (resend). */
  async replaceToken(id: number, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.db.invitation.update({ where: { id }, data: { tokenHash, expiresAt } });
  }

  /** Creates the invited user, marks the invitation accepted and sets the department head, in one transaction. */
  accept(invitationId: number, user: { name: string; passwordHash: string }): Promise<User> {
    return this.db.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUniqueOrThrow({ where: { id: invitationId } });
      const now = new Date();
      const created = await tx.user.create({
        data: {
          companyId: invitation.companyId,
          departmentId: invitation.departmentId,
          name: user.name,
          email: invitation.email,
          passwordHash: user.passwordHash,
          systemRole: invitation.role,
          status: UserStatus.Active,
          emailVerifiedAt: now,
        },
      });
      await tx.invitation.update({ where: { id: invitationId }, data: { acceptedAt: now } });
      if (invitation.role === SystemRole.DepartmentHead) {
        await tx.department.update({ where: { id: invitation.departmentId }, data: { headUserId: created.id } });
      }
      return created;
    });
  }
}
