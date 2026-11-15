import bcrypt from 'bcryptjs';
import { BCRYPT_COST } from '../constants';

/** Hashes a password with bcrypt. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/** Checks a password against a bcrypt hash. */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** A valid hash of a throwaway password, compared against when an email is unknown so timing does not reveal which emails exist. */
export const DUMMY_PASSWORD_HASH: string = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);
