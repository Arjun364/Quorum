import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { badRequest, forbidden, HttpError, toProblemDetails } from '../src/utils';

describe('toProblemDetails', () => {
  it('maps HTTP errors', () => {
    const body = toProblemDetails(new HttpError(404, 'No such thing'), '/api/x');
    expect(body).toMatchObject({ status: 404, title: 'Not Found', detail: 'No such thing', instance: '/api/x' });
  });

  it('lists several problems at once', () => {
    const body = toProblemDetails(badRequest(['a is bad', 'b is bad']), '/api/x');
    expect(body.status).toBe(400);
    expect(body.errors).toEqual(['a is bad', 'b is bad']);
  });

  it('keeps machine-readable codes', () => {
    const body = toProblemDetails(forbidden('Change it', 'PASSWORD_CHANGE_REQUIRED'), '/api/x');
    expect(body.code).toBe('PASSWORD_CHANGE_REQUIRED');
  });

  it('turns schema validation failures into a 400 with field messages', () => {
    const result = z.object({ email: z.email() }).strict().safeParse({ email: 'nope', extra: 1 });
    const body = toProblemDetails(result.error, '/api/x');
    expect(body.status).toBe(400);
    expect(body.errors?.length).toBeGreaterThan(0);
  });

  it('hides internals of unexpected errors', () => {
    const body = toProblemDetails(new Error('db password is hunter2'), '/api/x');
    expect(body.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain('hunter2');
  });
});
