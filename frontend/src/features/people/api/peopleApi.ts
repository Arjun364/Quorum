import { apiFetch } from '@/shared';
import type { DepartmentOption, DepartmentPeople, InvitePayload, Person, Transfer, TransferPayload } from '../types';

export const peopleApi = {
  /** Lists a department's people and open invitations. */
  listPeople(departmentId: number): Promise<DepartmentPeople> {
    return apiFetch<DepartmentPeople>(`/departments/${departmentId}/people`);
  },

  /** Invites an employee, by email, to a department. */
  inviteEmployee(departmentId: number, payload: InvitePayload): Promise<unknown> {
    return apiFetch<unknown>(`/departments/${departmentId}/employee-invitation`, { method: 'POST', body: payload });
  },

  /** Sends an open invitation again with a fresh link. */
  resendInvitation(id: number): Promise<unknown> {
    return apiFetch<unknown>(`/invitations/${id}/resend`, { method: 'POST' });
  },

  /** Revokes an open invitation. */
  revokeInvitation(id: number): Promise<void> {
    return apiFetch<void>(`/invitations/${id}`, { method: 'DELETE' });
  },

  /** Deactivates a person (their history stays). */
  deactivate(userId: number): Promise<Person> {
    return apiFetch<Person>(`/users/${userId}/deactivate`, { method: 'POST' });
  },

  /** Lists every department of the company, as destinations for a move. */
  departmentOptions(): Promise<DepartmentOption[]> {
    return apiFetch<DepartmentOption[]>('/departments');
  },

  /** Lists the moves the viewer is concerned with. */
  listTransfers(): Promise<Transfer[]> {
    return apiFetch<Transfer[]>('/transfers');
  },

  /** Starts a move. */
  requestTransfer(payload: TransferPayload): Promise<Transfer> {
    return apiFetch<Transfer>('/transfers', { method: 'POST', body: payload });
  },

  /** Approves a move on the viewer's side. */
  approveTransfer(id: number): Promise<Transfer> {
    return apiFetch<Transfer>(`/transfers/${id}/approve`, { method: 'POST' });
  },

  /** Declines a move, with an optional note. */
  rejectTransfer(id: number, note: string): Promise<Transfer> {
    return apiFetch<Transfer>(`/transfers/${id}/reject`, { method: 'POST', body: note ? { note } : {} });
  },

  /** Withdraws a waiting move. */
  cancelTransfer(id: number): Promise<Transfer> {
    return apiFetch<Transfer>(`/transfers/${id}`, { method: 'DELETE' });
  },
};