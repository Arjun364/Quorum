import type { ErrorRequestHandler, RequestHandler } from 'express';
import { createLogger, HttpError, toProblemDetails } from '../utils';

const logger = createLogger('Http');

/** Answers requests that matched no route with a problem-details 404. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res
    .status(404)
    .type('application/problem+json')
    .json(toProblemDetails(new HttpError(404, 'Route not found'), req.originalUrl));
};

/** Turns body-parser failures (malformed JSON, oversized body) into client errors instead of 500s. */
function normalize(error: unknown): unknown {
  const candidate = error as { status?: unknown; expose?: unknown } | null;
  if (
    candidate &&
    typeof candidate.status === 'number' &&
    candidate.status >= 400 &&
    candidate.status < 500 &&
    candidate.expose === true
  ) {
    return new HttpError(candidate.status, 'The request body could not be read');
  }
  return error;
}

/** Final error handler: every failure becomes a problem-details body; unexpected errors are logged, never leaked. */
export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const normalized = normalize(error);
  const body = toProblemDetails(normalized, req.originalUrl);
  if (body.status >= 500) {
    logger.error(`${req.method} ${req.originalUrl}`, error);
  }
  res.status(body.status).type('application/problem+json').json(body);
};
