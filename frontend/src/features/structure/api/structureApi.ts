import { apiFetch } from '@/shared';
import type { Department, InvitationSummary, InvitePayload, NameAndCode, Organization } from '../types';

export const structureApi = {
  /** Lists the company's organizations. */
  listOrganizations(): Promise<Organization[]> {
    return apiFetch<Organization[]>('/organizations');
  },

  /** Creates an organization. */
  createOrganization(payload: NameAndCode): Promise<Organization> {
    return apiFetch<Organization>('/organizations', { method: 'POST', body: payload });
  },

  /** Lists an organization's departments with their heads and open head invitations. */
  listDepartments(organizationId: number): Promise<Department[]> {
    return apiFetch<Department[]>(`/organizations/${organizationId}/departments`);
  },

  /** Creates a department inside an organization. */
  createDepartment(organizationId: number, payload: NameAndCode): Promise<Department> {
    return apiFetch<Department>(`/organizations/${organizationId}/departments`, { method: 'POST', body: payload });
  },

  /** Invites a person, by email, to lead a department. */
  inviteHead(departmentId: number, payload: InvitePayload): Promise<InvitationSummary> {
    return apiFetch<InvitationSummary>(`/departments/${departmentId}/head-invitation`, { method: 'POST', body: payload });
  },

  /** Sends an open invitation again with a fresh link. */
  resendInvitation(invitationId: number): Promise<InvitationSummary> {
    return apiFetch<InvitationSummary>(`/invitations/${invitationId}/resend`, { method: 'POST' });
  },

  /** Revokes an open invitation. */
  revokeInvitation(invitationId: number): Promise<void> {
    return apiFetch<void>(`/invitations/${invitationId}`, { method: 'DELETE' });
  },
};