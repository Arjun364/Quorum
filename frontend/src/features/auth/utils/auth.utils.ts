import { ApiError } from '@/shared';
import { AUTH_MESSAGES } from '../constants';
import type { PasswordRule } from '../types';

/**
 * Checks a password against the policy and returns each requirement with its status.
 * Mirrors backend/src/modules/auth/password-policy.ts; the server remains the authority.
 */
export function evaluatePassword(password: string): PasswordRule[] {
  return [
    { label: 'At least 10 characters', met: password.length >= 10 },
    { label: 'A lowercase letter', met: /[a-z]/.test(password) },
    { label: 'An uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'A number', met: /[0-9]/.test(password) },
  ];
}

/** Maps a failed sign-in request to the message shown above the form. */
export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) return AUTH_MESSAGES.loginRejected;
  if (error instanceof ApiError && error.status === 429) return AUTH_MESSAGES.tooManyAttempts;
  return AUTH_MESSAGES.unreachable;
}

/** Maps a failed change-password request to the list of messages shown above the form. */
export function getChangePasswordErrors(error: unknown): string[] {
  if (error instanceof ApiError && error.status === 400) {
    return error.errors?.length ? error.errors : [error.message];
  }
  return [AUTH_MESSAGES.unreachable];
}
