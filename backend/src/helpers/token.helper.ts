import { createHash, randomBytes } from 'node:crypto';

/** Returns the SHA-256 hex digest stored in place of a refresh token. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Generates an unguessable refresh token (the raw value only ever lives in the httpOnly cookie). */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}
