import { SystemRole, UserStatus, type Company, type Prisma, type PrismaClient, type User } from '@prisma/client';
import type {
  CompanyRepositoryContract,
  NewCompanyWithHead,
  VerificationTokenRepositoryContract,
  VerificationTokenWithUser,
} from '../types';

/** Reads and writes companies (the tenants). */
export class CompanyRepository implements CompanyRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  /** Finds a company by its address, or null. */
  findBySlug(slug: string): Promise<Company | null> {
    return this.db.company.findUnique({ where: { slug } });
  }

  /** Finds a company by id, or null. */
  findById(id: number): Promise<Company | null> {
    return this.db.company.findUnique({ where: { id } });
  }

  /** Creates the company (pending verification) and its CompanyHead user in one transaction. */
  createWithHead(input: NewCompanyWithHead): Promise<{ company: Company; head: User }> {
    return this.db.$transaction(async (tx) => {
      const company = await tx.company.create({ data: input.company });
      const head = await tx.user.create({
        data: {
          ...input.head,
          companyId: company.id,
          systemRole: SystemRole.CompanyHead,
          status: UserStatus.Active,
        },
      });
      return { company, head };
    });
  }

  /** Updates a company and returns the new record. */
  update(id: number, data: Prisma.CompanyUncheckedUpdateInput): Promise<Company> {
    return this.db.company.update({ where: { id }, data });
  }
}

/** Stores email-verification token hashes. */
export class VerificationTokenRepository implements VerificationTokenRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  /** Stores the hash of a new verification token. */
  async create(data: { userId: number; tokenHash: string; expiresAt: Date }): Promise<void> {
    await this.db.emailVerificationToken.create({ data });
  }

  /** Finds a token by its hash, together with its user. */
  findByHash(tokenHash: string): Promise<VerificationTokenWithUser | null> {
    return this.db.emailVerificationToken.findUnique({ where: { tokenHash }, include: { user: true } });
  }

  /** Marks the token used, the user's email verified and the company active, in one transaction. */
  async consume(tokenId: number, userId: number, companyId: number): Promise<void> {
    const now = new Date();
    await this.db.$transaction([
      this.db.emailVerificationToken.update({ where: { id: tokenId }, data: { usedAt: now } }),
      this.db.user.update({ where: { id: userId }, data: { emailVerifiedAt: now } }),
      this.db.company.update({ where: { id: companyId }, data: { status: 'Active' } }),
    ]);
  }

  /** Invalidates every unused token of a user. */
  async invalidateForUser(userId: number): Promise<void> {
    await this.db.emailVerificationToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
  }
}
