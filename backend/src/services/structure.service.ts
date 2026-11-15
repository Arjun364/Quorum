import type { Department, Organization } from '@prisma/client';
import type { DepartmentRepositoryContract, InvitationRepositoryContract, OrganizationRepositoryContract } from '../types';
import { conflict, notFound } from '../utils';
import type { AuditService } from './audit.service';

/** An organization as returned to clients. */
export interface OrganizationResponse {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  departmentCount: number;
}

/** A department as returned to clients, with its head or the invitation waiting for one. */
export interface DepartmentResponse {
  id: number;
  organizationId: number;
  name: string;
  code: string;
  isActive: boolean;
  memberCount: number;
  head: { id: number; name: string; email: string } | null;
  pendingHeadInvitation: { id: number; name: string; email: string; expiresAt: string } | null;
}

/** Name and code of a new organization or department. */
export interface NameAndCode {
  name: string;
  code: string;
}

/** Fields that can change on an organization or department. */
export interface StructureUpdate {
  name?: string;
  code?: string;
  isActive?: boolean;
}

const normalizeCode = (code: string): string => code.trim().toUpperCase();

const toOrganization = (o: Organization, departmentCount: number): OrganizationResponse => ({
  id: o.id,
  name: o.name,
  code: o.code,
  isActive: o.isActive,
  departmentCount,
});

/** Dependencies of the structure service. */
export interface StructureServiceDeps {
  organizations: OrganizationRepositoryContract;
  departments: DepartmentRepositoryContract;
  invitations: InvitationRepositoryContract;
  audit: AuditService;
}

/** Business rules of a company's structure: organizations and the departments inside them. */
export class StructureService {
  constructor(private readonly deps: StructureServiceDeps) {}

  /** Lists the company's organizations. */
  async listOrganizations(companyId: number): Promise<OrganizationResponse[]> {
    return (await this.deps.organizations.list(companyId)).map((o) => toOrganization(o, o.departmentCount));
  }

  /** Creates an organization; its code must be unique in the company. */
  async createOrganization(companyId: number, userId: number, input: NameAndCode): Promise<OrganizationResponse> {
    const code = normalizeCode(input.code);
    if (await this.deps.organizations.findByCode(companyId, code)) throw conflict(`An organization with the code ${code} already exists`);
    const created = await this.deps.organizations.create(companyId, { name: input.name.trim(), code, createdBy: userId });
    await this.deps.audit.log({ userId, companyId, action: 'OrganizationCreated', entityType: 'Organization', entityId: created.id });
    return toOrganization(created, 0);
  }

  /** Updates an organization of the company. */
  async updateOrganization(companyId: number, userId: number, id: number, input: StructureUpdate): Promise<OrganizationResponse> {
    const existing = await this.requireOrganization(companyId, id);
    const data: StructureUpdate = { ...input };
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.code !== undefined) {
      data.code = normalizeCode(input.code);
      const clash = await this.deps.organizations.findByCode(companyId, data.code);
      if (clash && clash.id !== existing.id) throw conflict(`An organization with the code ${data.code} already exists`);
    }
    const updated = await this.deps.organizations.update(companyId, id, data);
    await this.deps.audit.log({ userId, companyId, action: 'OrganizationUpdated', entityType: 'Organization', entityId: id });
    const count = (await this.deps.departments.listByOrganization(companyId, id)).length;
    return toOrganization(updated, count);
  }

  /** Lists an organization's departments, each with its head or its open head invitation. */
  async listDepartments(companyId: number, organizationId: number): Promise<DepartmentResponse[]> {
    await this.requireOrganization(companyId, organizationId);
    const departments = await this.deps.departments.listByOrganization(companyId, organizationId);
    const invitations = await this.deps.invitations.listOpenByDepartments(companyId, departments.map((d) => d.id));
    const now = new Date();
    return departments.map((d) => {
      const invite = invitations.find((i) => i.departmentId === d.id && i.role === 'DepartmentHead' && i.expiresAt > now);
      return {
        id: d.id,
        organizationId: d.organizationId,
        name: d.name,
        code: d.code,
        isActive: d.isActive,
        memberCount: d.memberCount,
        head: d.head,
        pendingHeadInvitation: invite ? { id: invite.id, name: invite.name, email: invite.email, expiresAt: invite.expiresAt.toISOString() } : null,
      };
    });
  }

  /** Creates a department in an organization; its code must be unique in that organization. */
  async createDepartment(companyId: number, userId: number, organizationId: number, input: NameAndCode): Promise<DepartmentResponse> {
    await this.requireOrganization(companyId, organizationId);
    const code = normalizeCode(input.code);
    if (await this.deps.departments.findByCode(organizationId, code)) throw conflict(`A department with the code ${code} already exists here`);
    const created = await this.deps.departments.create(companyId, { organizationId, name: input.name.trim(), code, createdBy: userId });
    await this.deps.audit.log({ userId, companyId, action: 'DepartmentCreated', entityType: 'Department', entityId: created.id });
    return this.toDepartment(created);
  }

  /** Updates a department of the company. */
  async updateDepartment(companyId: number, userId: number, id: number, input: StructureUpdate): Promise<DepartmentResponse> {
    const existing = await this.deps.departments.findById(companyId, id);
    if (!existing) throw notFound('Department not found');
    const data: StructureUpdate = { ...input };
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.code !== undefined) {
      data.code = normalizeCode(input.code);
      const clash = await this.deps.departments.findByCode(existing.organizationId, data.code);
      if (clash && clash.id !== existing.id) throw conflict(`A department with the code ${data.code} already exists here`);
    }
    const updated = await this.deps.departments.update(companyId, id, data);
    await this.deps.audit.log({ userId, companyId, action: 'DepartmentUpdated', entityType: 'Department', entityId: id });
    return this.toDepartment(updated);
  }

  /** Loads an organization of the company or fails with 404 (another company's organization looks the same as a missing one). */
  private async requireOrganization(companyId: number, id: number): Promise<Organization> {
    const organization = await this.deps.organizations.findById(companyId, id);
    if (!organization) throw notFound('Organization not found');
    return organization;
  }

  /** Maps a freshly written department to its response shape. */
  private toDepartment(d: Department): DepartmentResponse {
    return {
      id: d.id,
      organizationId: d.organizationId,
      name: d.name,
      code: d.code,
      isActive: d.isActive,
      memberCount: 0,
      head: null,
      pendingHeadInvitation: null,
    };
  }
}
