import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../constants';

/** Returns a list of policy problems; an empty list means the password is acceptable. */
export function checkPasswordPolicy(password: string): string[] {
  const problems: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    problems.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_LENGTH) {
    problems.push(`Password must be at most ${PASSWORD_MAX_LENGTH} bytes`);
  }
  if (!/[a-z]/.test(password)) problems.push('Password needs a lowercase letter');
  if (!/[A-Z]/.test(password)) problems.push('Password needs an uppercase letter');
  if (!/[0-9]/.test(password)) problems.push('Password needs a digit');
  return problems;
}
