import type { Response } from 'express';
import { REFRESH_COOKIE, REFRESH_COOKIE_PATH } from '../constants';

/** Sets the refresh-token cookie: httpOnly (unreadable by scripts), SameSite=Lax, scoped to the auth endpoints. */
export function setRefreshCookie(res: Response, token: string, expires: Date, secure: boolean): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    expires,
  });
}

/** Removes the refresh-token cookie. */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
}
