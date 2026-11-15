import type { RequestHandler } from 'express';
import type { AppConfig } from '../config';
import { setRefreshCookie } from '../helpers';
import { requireCompany } from '../middlewares';
import type { InvitationService } from '../services';
import type { AuthResponse } from '../types';
import type { AcceptInvitationBody } from '../validators';

/** Builds the public invitation controller (used by the invited person, who has no account yet). */
export function createInvitationController(invitations: InvitationService, config: Pick<AppConfig, 'cookieSecure'>) {
  /** GET /invitations/lookup?token= : shows the invitation to the person holding the link. */
  const lookup: RequestHandler = async (req, res) => {
    const { token } = req.query as { token: string };
    res.status(200).json(await invitations.lookup(token, requireCompany(req).id));
  };

  /** POST /invitations/accept : creates the account and signs the person in. */
  const accept: RequestHandler = async (req, res) => {
    const body = req.body as AcceptInvitationBody;
    const session = await invitations.accept(body.token, requireCompany(req).id, { name: body.name, password: body.password });
    setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt, config.cookieSecure);
    const response: AuthResponse = { accessToken: session.accessToken, expiresInSeconds: session.expiresInSeconds, user: session.user };
    res.status(201).json(response);
  };

  return { lookup, accept };
}

export type InvitationController = ReturnType<typeof createInvitationController>;