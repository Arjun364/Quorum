/** Subdomains a company can never take, because the platform uses them. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'www', 'admin', 'api', 'app', 'mail', 'email', 'support', 'help', 'status', 'docs', 'blog',
  'login', 'signup', 'start', 'static', 'assets', 'cdn', 'quorum', 'platform', 'root', 'test',
]);

/** Shortest and longest company address. */
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 32;

/** Accent colour of each theme preset ("#rrggbb"). */
export const THEME_ACCENTS = {
  Forest: '#1f3a34',
  Ocean: '#1d4e89',
  Graphite: '#2b2f36',
} as const;

/** Page ground the accent must stay visible against (the light theme's background). */
export const THEME_PAGE_BACKGROUND = '#f6f4ef';

/** Hours a new company's email-verification link stays valid. */
export const VERIFICATION_TTL_HOURS = 24;

/** Days an invitation link stays valid. */
export const INVITATION_TTL_DAYS = 7;

/** Folder prefix of every image the platform stores in Cloudinary. */
export const CLOUDINARY_ROOT_FOLDER = 'quorum';

/** Machine-readable code sent when a correct sign-in is refused because the email is not verified yet. */
export const EMAIL_NOT_VERIFIED_CODE = 'EMAIL_NOT_VERIFIED';
