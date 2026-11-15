import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { toProblemDetails } from '../src/common/filters/problem-details.filter';

describe('toProblemDetails', () => {
  it('maps HTTP exceptions', () => {
    const body = toProblemDetails(new NotFoundException('No such thing'), '/api/x');
    expect(body).toMatchObject({ status: 404, title: 'Not Found', detail: 'No such thing', instance: '/api/x' });
  });

  it('lists validation errors', () => {
    const body = toProblemDetails(new BadRequestException({ message: ['a is bad', 'b is bad'] }), '/api/x');
    expect(body.status).toBe(400);
    expect(body.errors).toEqual(['a is bad', 'b is bad']);
  });

  it('keeps machine-readable codes', () => {
    const body = toProblemDetails(
      new ForbiddenException({ message: 'Change it', code: 'PASSWORD_CHANGE_REQUIRED' }),
      '/api/x',
    );
    expect(body.code).toBe('PASSWORD_CHANGE_REQUIRED');
  });

  it('hides internals of unexpected errors', () => {
    const body = toProblemDetails(new Error('db password is hunter2'), '/api/x');
    expect(body.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain('hunter2');
  });
});
