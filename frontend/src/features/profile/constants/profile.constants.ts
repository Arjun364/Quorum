/** Photo upload limits (the same as the company logo). */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** User-facing messages of the profile screen. */
export const PROFILE_MESSAGES = {
  nameRequired: 'Enter your name.',
  phoneFormat: 'Use digits, spaces and + - ( ) only.',
  photoType: 'Use a PNG, JPG or WebP image.',
  photoSize: 'The photo must be 2 MB or smaller.',
  photoFailed: 'The photo could not be uploaded. Try again.',
  unreachable: 'We could not reach the server. Check your connection and try again.',
} as const;