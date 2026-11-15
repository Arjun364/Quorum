import { ApiError } from '@/shared';
import { PEOPLE_MESSAGES } from '../constants';

/** Turns a failed request into one plain sentence for the user. */
export function getPeopleError(error: unknown): string {
  if (error instanceof ApiError) return error.errors?.join(' ') ?? error.message;
  return PEOPLE_MESSAGES.unreachable;
}

/** Formats an ISO date as "22 Nov 2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}