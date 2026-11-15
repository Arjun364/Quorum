import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

/** Validates `req.query` against a schema and replaces it with the parsed value; a failure becomes a 400 problem response. */
export function validateQuery(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    Object.defineProperty(req, 'query', { value: schema.parse(req.query), writable: true, configurable: true });
    next();
  };
}

/** Validates `req.params` against a schema and replaces it with the parsed value (so ids arrive as numbers). */
export function validateParams(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    Object.defineProperty(req, 'params', { value: schema.parse(req.params), writable: true, configurable: true });
    next();
  };
}

/** Validates `req.body` against a schema and replaces it with the parsed value; a failure becomes a 400 problem response. */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };
}