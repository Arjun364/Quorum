import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

/** Validates `req.body` against a schema and replaces it with the parsed value; a failure becomes a 400 problem response. */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };
}
