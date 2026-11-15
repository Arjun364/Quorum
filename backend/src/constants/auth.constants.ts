/** Name of the httpOnly cookie that carries the refresh token. */
export const REFRESH_COOKIE = 'refresh_token';

/** Path the refresh cookie is scoped to, so it is sent only to the auth endpoints. */
export const REFRESH_COOKIE_PATH = '/api/auth';

/** Failed sign-ins allowed before the account is locked. */
export const MAX_FAILED_LOGINS = 5;

/** Minutes an account stays locked after too many failed sign-ins. */
export const LOCKOUT_MINUTES = 15;

/** bcrypt work factor for password hashes. */
export const BCRYPT_COST = 12;

/** Generic message for every failed sign-in, so responses never reveal which emails exist. */
export const INVALID_LOGIN_MESSAGE = 'Invalid email or password';

/** Machine-readable code sent when a user must change their password first. */
export const PASSWORD_CHANGE_REQUIRED_CODE = 'PASSWORD_CHANGE_REQUIRED';

/** Password policy limits. bcrypt only uses the first 72 bytes, so longer passwords would be truncated silently. */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;
