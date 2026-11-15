import { SystemRole, UserStatus, type PrismaClient, type User } from '@prisma/client';
import type { PeopleRepositoryContract } from '../types';

/** Reads and writes the people of one company; every query is limited to it. */
export class PeopleRepository implements PeopleRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  /** Lists the people of a department, by name. */
  listByDepartment(companyId: number, departmentId: number): Promise<User[]> {
    return this.db.user.findMany({ where: { companyId, departmentId }, orderBy: { name: 'asc' } });
  }

  /** Finds one person of the company, or null. */
  findInCompany(companyId: number, id: number): Promise<User | null> {
    return this.db.user.findFirst({ where: { id, companyId } });
  }

  /** Finds the company head. */
  findCompanyHead(companyId: number): Promise<User | null> {
    return this.db.user.findFirst({ where: { companyId, systemRole: SystemRole.CompanyHead } });
  }

  /** Updates profile fields of a person of the company. */
  async updateProfile(companyId: number, id: number, data: { name?: string; jobTitle?: string | null; phone?: string | null }): Promise<User> {
    await this.db.user.updateMany({ where: { id, companyId }, data });
    return this.db.user.findFirstOrThrow({ where: { id, companyId } });
  }

  /** Sets or clears the profile photo. */
  async setAvatar(companyId: number, id: number, data: { avatarUrl: string | null; avatarPublicId: string | null }): Promise<User> {
    await this.db.user.updateMany({ where: { id, companyId }, data });
    return this.db.user.findFirstOrThrow({ where: { id, companyId } });
  }

  /** Marks a person inactive (never deletes; history stays). */
  async deactivate(companyId: number, id: number): Promise<User> {
    await this.db.user.updateMany({ where: { id, companyId }, data: { status: UserStatus.Inactive } });
    return this.db.user.findFirstOrThrow({ where: { id, companyId } });
  }
}