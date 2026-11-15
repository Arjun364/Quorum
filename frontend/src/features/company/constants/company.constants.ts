import type { ThemePreset } from '../types';

/** The three ready-made themes and their accent colours (the server holds the same list). */
export const THEME_PRESETS: readonly { id: Exclude<ThemePreset, 'Custom'>; label: string; accent: string; soft: string; ground: string }[] = [
  { id: 'Forest', label: 'Forest', accent: '#1f3a34', soft: '#dfe9e3', ground: '#f6f4ef' },
  { id: 'Ocean', label: 'Ocean', accent: '#1d4e89', soft: '#dbe7f5', ground: '#f4f6f9' },
  { id: 'Graphite', label: 'Graphite', accent: '#2b2f36', soft: '#e4e6ea', ground: '#f5f5f4' },
];

/** Page ground the accent must stay visible against (matches the light theme; the server enforces the same 3:1). */
export const THEME_PAGE_BACKGROUND = '#f6f4ef';

/** Smallest contrast an accent needs against the page ground. */
export const MIN_ACCENT_CONTRAST = 3;

/** Logo upload limits. */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** Milliseconds to wait after typing before checking a company address. */
export const SLUG_CHECK_DELAY_MS = 400;

/** User-facing messages of the company screens. */
export const COMPANY_MESSAGES = {
  companyNameRequired: 'Enter your company name.',
  slugRequired: 'Choose a company address.',
  slugFormat: 'Use 3 to 32 lowercase letters, digits or single hyphens.',
  nameRequired: 'Enter your name.',
  emailInvalid: 'Enter a work email with an @.',
  passwordNotStrong: 'Your password does not meet every requirement yet.',
  addressTaken: 'That address is taken. Choose another.',
  unreachable: 'We could not reach the server. Check your connection and try again.',
  logoType: 'Use a PNG, JPG or WebP image.',
  logoSize: 'The logo must be 2 MB or smaller.',
  logoFailed: 'The logo could not be uploaded. Try again.',
  brandSaved: 'Saved. Your people see the new look the next time they open the app.',
} as const;