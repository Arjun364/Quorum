/** Base path of the backend API; proxied by Vite in development and by a Vercel rewrite in production. */
export const API_BASE_PATH = '/api';

/** Seconds before access-token expiry at which the session is silently renewed. */
export const SESSION_RENEW_MARGIN_SECONDS = 30;

/** Shortest delay, in seconds, between two silent session renewals. */
export const SESSION_RENEW_MIN_SECONDS = 5;

/** Host name companies hang their address on: "quorum.app" in production, "localhost" in development. */
export const ROOT_HOST: string = (import.meta.env.VITE_ROOT_HOST as string | undefined) ?? 'localhost';