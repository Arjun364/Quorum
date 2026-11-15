import { apiFetch } from '@/shared';
import type { AuthResponse, ChangePasswordPayload, LoginCredentials, User, VerifyEmailResult } from '../types';

export const authApi = {
  /** Signs in with email and password and returns the new session; the refresh cookie is set by the server. */
  login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: credentials, auth: false });
  },

  /** Ends the current session on the server and clears the refresh cookie. */
  logout(): Promise<void> {
    return apiFetch<void>('/auth/logout', { method: 'POST', auth: false });
  },

  /** Changes the signed-in user's password and returns a fresh session (all older sessions are revoked). */
  changePassword(payload: ChangePasswordPayload): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/change-password', { method: 'POST', body: payload });
  },

  /** Fetches the signed-in user's profile. */
  me(): Promise<User> {
    return apiFetch<User>('/auth/me');
  },

  /** Confirms the emailed verification link of a new company head; the link works once. */
  verifyEmail(token: string): Promise<VerifyEmailResult> {
    return apiFetch<VerifyEmailResult>('/auth/verify-email', { method: 'POST', body: { token }, auth: false });
  },

  /** Asks for a new verification link; the server always answers the same, so it never reveals which emails exist. */
  resendVerification(email: string): Promise<void> {
    return apiFetch<void>('/auth/resend-verification', { method: 'POST', body: { email }, auth: false });
  },
};