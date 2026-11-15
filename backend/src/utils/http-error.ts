/** Error with an HTTP status that the error middleware turns into a problem-details response. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly errors?: string[],
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** 400: the request is malformed or violates a rule; pass a list to show several problems at once. */
export const badRequest = (message: string | string[]): HttpError =>
  Array.isArray(message)
    ? new HttpError(400, 'Validation failed', undefined, message)
    : new HttpError(400, message);

/** 401: the caller is not (or no longer) authenticated. */
export const unauthorized = (message: string): HttpError => new HttpError(401, message);

/** 403: the caller is authenticated but not allowed; `code` lets the client react programmatically. */
export const forbidden = (message: string, code?: string): HttpError => new HttpError(403, message, code);

/** 503: a dependency (for example the database) is unavailable. */
export const serviceUnavailable = (message: string): HttpError => new HttpError(503, message);
