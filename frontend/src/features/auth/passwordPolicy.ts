/** Mirrors backend/src/modules/auth/password-policy.ts (the server is the authority). */
export interface PasswordRule {
  label: string;
  met: boolean;
}

export function evaluatePassword(password: string): PasswordRule[] {
  return [
    { label: 'At least 10 characters', met: password.length >= 10 },
    { label: 'A lowercase letter', met: /[a-z]/.test(password) },
    { label: 'An uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'A number', met: /[0-9]/.test(password) },
  ];
}
