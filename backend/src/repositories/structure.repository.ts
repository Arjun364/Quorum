import type { Department, Organization, PrismaClient } from '@prisma/client';
import type { DepartmentRepositoryContract, DepartmentWithHead, DepartmentWithOrganization, OrganizationRepositoryContract } from '../types';

/** Reads and writes organizations; every query is limited to one company. */
export class OrganizationRepository implements OrganizationRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  /** Lists a company's organizations with how many departments each has. */
  async list(companyId: number): Promise<(Organization & { departmentCount: number })[]> {
    const rows = await this.db.organization.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { departments: true } } },
    });
    return rows.map(({ _count, ...org }) => ({ ...org, departmentCount: _count.departments }));
  }

  /** Finds one organization of the company, or null. */
  findById(companyId: number, id: number): Promise<Organization | null> {
    return this.db.organization.findFirst({ where: { id, companyId } });
  }

  /** Finds an organization of the company by its code, or null. */
  findByCode(companyId: number, code: string): Promise<Organization | null> {
    return this.db.organization.findFirst({ where: { companyId, code } });
  }

  /** Creates an organization in the company. */
  create(companyId: number, data: { name: string; code: string; createdBy: number }): Promise<Organization> {
    return this.db.organization.create({ data: { ...data, companyId } });
  }

  /** Updates an organization; the caller has already checked it belongs to the company. */
  async update(companyId: number, id: number, data: { name?: string; code?: string; isActive?: boolean }): Promise<Organization> {
    await this.db.organization.updateMany({ where: { id, companyId }, data });
    return this.db.organization.findFirstOrThrow({ where: { id, companyId } });
  }
}

/** Reads and writes departments; every query is limited to one company. */
export class DepartmentRepository implements DepartmentRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  /** Lists an organization's departments with their head and member count. */
  async listByOrganization(companyId: number, organizationId: number): Promise<DepartmentWithHead[]> {
    const rows = await this.db.department.findMany({
      where: { companyId, organizationId },
      orderBy: { name: 'asc' },
      include: { head: { select: { id: true, name: true, email: true } }, _count: { select: { members: true } } },
    });
    return rows.map(({ _count, ...dept }) => ({ ...dept, memberCount: _count.members }));
  }

  /** Lists every department of the company with its organization and head. */
  listAll(companyId: number): Promise<DepartmentWithOrganization[]> {
    return this.db.department.findMany({
      where: { companyId },
      orderBy: [{ organization: { name: 'asc' } }, { name: 'asc' }],
      include: { organization: { select: { id: true, name: true } }, head: { select: { id: true, name: true } } },
    });
  }

  /** Finds one department of the company, or null. */
  findById(companyId: number, id: number): Promise<Department | null> {
    return this.db.department.findFirst({ where: { id, companyId } });
  }

  /** Finds a department of an organization by its code, or null. */
  findByCode(organizationId: number, code: string): Promise<Department | null> {
    return this.db.department.findFirst({ where: { organizationId, code } });
  }

  /** Creates a department in the company. */
  create(companyId: number, data: { organizationId: number; name: string; code: string; createdBy: number }): Promise<Department> {
    return this.db.department.create({ data: { ...data, companyId } });
  }

  /** Updates a department; the caller has already checked it belongs to the company. */
  async update(companyId: number, id: number, data: { name?: string; code?: string; isActive?: boolean }): Promise<Department> {
    await this.db.department.updateMany({ where: { id, companyId }, data });
    return this.db.department.findFirstOrThrow({ where: { id, companyId } });
  }
}
