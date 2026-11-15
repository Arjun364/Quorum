import { ApiError } from '@/shared';

/** Suggests a short code from a name: the first letters of its words, or its first letters for one word (upper case, up to 4). */
export function suggestCode(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words.map((w) => w[0]).join('') : (words[0] ?? '').slice(0, 3);
  return letters.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
}

/** Maps a failed create or invite request to a message shown in its dialog. */
export function getStructureError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409 || error.status === 400) return error.errors?.join(' ') ?? error.message;
    if (error.status === 403) return 'Only the company head can do this.';
    if (error.status === 429) return 'Too many attempts. Wait a minute, then try again.';
  }
  return 'We could not reach the server. Check your connection and try again.';
}

/** Formats an ISO date as a short local date ("22 Nov 2026"). */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}