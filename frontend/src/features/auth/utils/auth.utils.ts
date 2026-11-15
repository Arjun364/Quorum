import { ApiError } from '@/shared';
import { AUTH_MESSAGES } from '../constants';

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
