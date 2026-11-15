import type { SessionPayload, SessionUser, SystemRole } from '@/shared';

export type { SystemRole };

/** Signed-in user as returned by the API. */
export type User = SessionUser;

/** Session payload returned by login, refresh and change-password. */
export type AuthResponse = SessionPayload;

/** Credentials sent to the login endpoint. */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Passwords sent to the change-password endpoint. */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Inline validation messages of the login form. */
export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

/** Inline validation messages of the change-password form. */
export interface ChangePasswordFieldErrors {
  current?: string;
  next?: string;
  confirm?: string;
}

/** State held by the in-memory session store. */
export interface SessionState {
  status: 'loading' | 'authenticated' | 'anonymous';
  user: User | null;
}

/** One illustrative row in the sign-in page preview card. */
export interface LoginPreviewRow {
  text: string;
  owner: string;
  state: string;
  tone: 'ok' | 'warn';
}

/** Answer of a successful email verification. */
export interface VerifyEmailResult {
  slug: string;
}
