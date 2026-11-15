import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { HttpError } from '../utils';

/** Creates a limiter that answers excess requests with a problem-details 429. */
function limiter(limit: number, windowMs = 60_000): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new HttpError(429, 'Too many requests. Wait a minute, then try again.')),
  });
}

/** Per-minute request limits; credential endpoints are the strictest. */
export function createRateLimiters() {
  return {
    general: limiter(120),
    login: limiter(10),
    refresh: limiter(30),
    changePassword: limiter(10),
  };
}

export type RateLimiters = ReturnType<typeof createRateLimiters>;

/** A set of limiters that never limit (used by tests). */
export const noRateLimiters: RateLimiters = {
  general: (_req, _res, next) => next(),
  login: (_req, _res, next) => next(),
  refresh: (_req, _res, next) => next(),
  changePassword: (_req, _res, next) => next(),
};
