import type { Request, RequestHandler, Response } from 'express';
import type { AppConfig } from '../config';
import { REFRESH_COOKIE } from '../constants';
import { clearRefreshCookie, setRefreshCookie } from '../helpers';
import type { AuthService, CompanyService } from '../services';
import type { AuthResponse, IssuedSession } from '../types';
import type { ChangePasswordBody, LoginBody } from '../validators';

/** Reads the refresh token from the request cookies. */
function readRefreshCookie(req: Request): string | undefined {
  return (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
}

/** Builds the auth controller: thin handlers that call the service and shape the HTTP response. */
export function createAuthController(auth: AuthService, company: CompanyService, config: Pick<AppConfig, 'cookieSecure'>) {
  /** Puts the refresh token in its cookie and returns the session body (the token never appears in JSON). */
  const respond = (res: Response, session: IssuedSession): AuthResponse => {
    setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt, config.cookieSecure);
    return { accessToken: session.accessToken, expiresInSeconds: session.expiresInSeconds, user: session.user };
  };

  /** POST /auth/login */
  const login: RequestHandler = async (req, res) => {
    const body = req.body as LoginBody;
    res.status(200).json(respond(res, await auth.login(req.company?.id ?? null, body.email, body.password)));
  };

  /** POST /auth/verify-email : confirms the link from a new company head's inbox. */
  const verifyEmail: RequestHandler = async (req, res) => {
    res.status(200).json(await company.verifyEmail((req.body as { token: string }).token));
  };

  /** POST /auth/resend-verification : always answers 204, so it never reveals which emails exist. */
  const resendVerification: RequestHandler = async (req, res) => {
    if (req.company) await company.resendVerification(req.company, (req.body as { email: string }).email);
    res.status(204).end();
  };

  /** POST /auth/refresh */
  const refresh: RequestHandler = async (req, res) => {
    res.status(200).json(respond(res, await auth.refresh(readRefreshCookie(req))));
  };

  /** POST /auth/logout */
  const logout: RequestHandler = async (req, res) => {
    await auth.logout(readRefreshCookie(req));
    clearRefreshCookie(res);
    res.status(204).end();
  };

  /** POST /auth/change-password */
  const changePassword: RequestHandler = async (req, res) => {
    const body = req.body as ChangePasswordBody;
    const session = await auth.changePassword(req.user!.id, body.currentPassword, body.newPassword);
    res.status(200).json(respond(res, session));
  };

  /** GET /auth/me */
  const me: RequestHandler = async (req, res) => {
    res.status(200).json(await auth.me(req.user!.id));
  };

  return { login, refresh, logout, changePassword, me, verifyEmail, resendVerification };
}

export type AuthController = ReturnType<typeof createAuthController>;
