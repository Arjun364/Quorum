import { ZodError } from 'zod';
import { HttpError } from './http-error';

/** Error body returned for every failed request (RFC 7807 problem details). */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance: string;
  code?: string;
  errors?: string[];
}

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

/** Builds a problem-details body from any thrown value; internals of unexpected errors are never exposed. */
export function toProblemDetails(error: unknown, instance: string): ProblemDetails {
  if (error instanceof HttpError) {
    return {
      type: 'about:blank',
      title: TITLES[error.status] ?? 'Error',
      status: error.status,
      detail: error.message,
      instance,
      ...(error.code ? { code: error.code } : {}),
      ...(error.errors ? { errors: error.errors } : {}),
    };
  }
  if (error instanceof ZodError) {
    return {
      type: 'about:blank',
      title: TITLES[400],
      status: 400,
      detail: 'Validation failed',
      instance,
      errors: error.issues.map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message)),
    };
  }
  return {
    type: 'about:blank',
    title: TITLES[500],
    status: 500,
    detail: 'An unexpected error occurred.',
    instance,
  };
}
