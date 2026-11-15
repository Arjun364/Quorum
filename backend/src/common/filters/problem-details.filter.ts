import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

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
  423: 'Locked',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

/** Builds a problem-details body from any thrown value (pure, unit-tested). */
export function toProblemDetails(exception: unknown, instance: string): ProblemDetails {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();
    const body: ProblemDetails = {
      type: 'about:blank',
      title: TITLES[status] ?? exception.name,
      status,
      instance,
    };
    if (typeof response === 'string') {
      body.detail = response;
    } else if (response && typeof response === 'object') {
      const r = response as { message?: string | string[]; code?: string };
      if (Array.isArray(r.message)) {
        body.detail = 'Validation failed';
        body.errors = r.message;
      } else if (typeof r.message === 'string') {
        body.detail = r.message;
      }
      if (typeof r.code === 'string') {
        body.code = r.code;
      }
    }
    return body;
  }
  return {
    type: 'about:blank',
    title: TITLES[500],
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    detail: 'An unexpected error occurred.',
    instance,
  };
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const body = toProblemDetails(exception, request.originalUrl);

    if (body.status >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    response.status(body.status).type('application/problem+json').json(body);
  }
}
