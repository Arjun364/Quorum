import { contrast, ApiError } from '@/shared';
import { COMPANY_MESSAGES, MIN_ACCENT_CONTRAST, THEME_PAGE_BACKGROUND } from '../constants';

/** Suggests a company address from its name: lowercase words joined by single hyphens, at most 32 characters. */
export function suggestSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
    .replace(/-+$/g, '');
}

/** True when the address has an acceptable shape (availability and reserved names are checked by the server). */
export function isValidSlugFormat(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 32 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/** Returns why a custom accent is unusable, or null when it is readable on the page. */
export function checkAccent(color: string): string | null {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return 'Use a colour in the form #rrggbb.';
  if (contrast(color, THEME_PAGE_BACKGROUND) < MIN_ACCENT_CONTRAST) {
    return 'That colour is too light to see on the page. Choose a darker one.';
  }
  return null;
}

/** Checks a chosen logo file against the type and size limits; returns the problem or null. */
export function checkLogoFile(file: File, types: readonly string[], maxBytes: number): string | null {
  if (!types.includes(file.type)) return COMPANY_MESSAGES.logoType;
  if (file.size > maxBytes) return COMPANY_MESSAGES.logoSize;
  return null;
}

/** Maps a failed registration to a message for the top of the form. */
export function getSignupErrorMessage(error: unknown): { field?: 'slug'; message: string } {
  if (error instanceof ApiError && error.status === 409) return { field: 'slug', message: COMPANY_MESSAGES.addressTaken };
  if (error instanceof ApiError && error.status === 400) return { message: error.errors?.join(' ') ?? error.message };
  if (error instanceof ApiError && error.status === 429) return { message: 'Too many attempts. Wait a minute, then try again.' };
  return { message: COMPANY_MESSAGES.unreachable };
}