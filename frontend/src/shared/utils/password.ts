import type { PasswordRule } from '../types';

/**
 * Checks a password against the policy and returns each requirement with its status.
 * Mirrors backend/src/utils/password-policy.ts; the server remains the authority.
 */
export function evaluatePassword(password: string): PasswordRule[] {
  return [
    { label: 'At least 10 characters', met: password.length >= 10 },
    { label: 'A lowercase letter', met: /[a-z]/.test(password) },
    { label: 'An uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'A number', met: /[0-9]/.test(password) },
  ];
}