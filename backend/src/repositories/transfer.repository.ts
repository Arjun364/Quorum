import type { DepartmentTransfer, Prisma, PrismaClient, TransferStatus } from '@prisma/client';
import type { TransferRepositoryContract, TransferWithContext } from '../types';

const CONTEXT = {
  user: { select: { id: true, name: true, email: true } },
  fromDepartment: { select: { id: true, name: true, organizationId: true, headUserId: true } },
  toDepartment: { select: { id: true, name: true, organizationId: true, headUserId: true } },
} as const;

/** Reads and writes department transfers; every query is limited to one company. */
export class TransferRepository implements TransferRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  /** Stores a new transfer request. */
  create(data: Prisma.DepartmentTransferUncheckedCreateInput): Promise<DepartmentTransfer> {
    return this.db.departmentTransfer.create({ data });
  }

  /** Finds one transfer of the company with the names needed to show it. */
  findById(companyId: number, id: number): Promise<TransferWithContext | null> {
    return this.db.departmentTransfer.findFirst({ where: { id, companyId }, include: CONTEXT });
  }

  /** Lists transfers, newest first (at most 100). */
  list(companyId: number, filter: { status?: TransferStatus; departmentIds?: number[] }): Promise<TransferWithContext[]> {
    const where: Prisma.DepartmentTransferWhereInput = { companyId };
    if (filter.status) where.status = filter.status;
    if (filter.departmentIds) {
      where.OR = [{ fromDepartmentId: { in: filter.departmentIds } }, { toDepartmentId: { in: filter.departmentIds } }];
    }
    return this.db.departmentTransfer.findMany({ where, include: CONTEXT, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  /** Finds the pending transfer of a person, if any. */
  findPendingForUser(companyId: number, userId: number): Promise<DepartmentTransfer | null> {
    return this.db.departmentTransfer.findFirst({ where: { companyId, userId, status: 'Pending' } });
  }

  /** Updates a transfer of the company. */
  async update(companyId: number, id: number, data: Prisma.DepartmentTransferUncheckedUpdateInput): Promise<DepartmentTransfer> {
    await this.db.departmentTransfer.updateMany({ where: { id, companyId }, data: data as Prisma.DepartmentTransferUpdateManyMutationInput });
    return this.db.departmentTransfer.findFirstOrThrow({ where: { id, companyId } });
  }

  /** Completes the transfer and moves the person in one transaction. */
  async complete(companyId: number, id: number, data: Prisma.DepartmentTransferUncheckedUpdateInput, userId: number, toDepartmentId: number): Promise<void> {
    await this.db.$transaction([
      this.db.departmentTransfer.updateMany({ where: { id, companyId }, data: { ...(data as Prisma.DepartmentTransferUpdateManyMutationInput), status: 'Completed', completedAt: new Date() } }),
      this.db.user.updateMany({ where: { id: userId, companyId }, data: { departmentId: toDepartmentId } }),
    ]);
  }
}