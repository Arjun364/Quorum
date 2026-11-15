import { apiFetch } from '@/shared';
import type { SessionPayload } from '@/shared';
import type { AcceptPayload, InvitationLookup } from '../types';

export const invitationsApi = {
  /** Shows an invitation to the person holding its link. */
  lookup(token: string): Promise<InvitationLookup> {
    return apiFetch<InvitationLookup>(`/invitations/lookup?token=${encodeURIComponent(token)}`, { auth: false });
  },

  /** Accepts an invitation: creates the account with the invited address and the chosen password, and signs the person in. */
  accept(payload: AcceptPayload): Promise<SessionPayload> {
    return apiFetch<SessionPayload>('/invitations/accept', { method: 'POST', body: payload, auth: false });
  },
};