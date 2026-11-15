import { ApiError } from '@/shared';
import { PROFILE_MESSAGES } from '../constants';

/** Turns a failed request into one plain sentence for the user. */
export function getProfileError(error: unknown): string {
  if (error instanceof ApiError) return error.errors?.join(' ') ?? error.message;
  return PROFILE_MESSAGES.unreachable;
}

/** Checks a chosen photo against the allowed types and size; returns a message, or null when it is fine. */
export function checkPhotoFile(file: File, types: readonly string[], maxBytes: number): string | null {
  if (!types.includes(file.type)) return PROFILE_MESSAGES.photoType;
  if (file.size > maxBytes) return PROFILE_MESSAGES.photoSize;
  return null;
}