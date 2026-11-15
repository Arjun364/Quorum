import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { noRateLimiters } from '../src/middlewares';
import { createWorld, makeCompany, makeUser, ROOT_HOST, testConfig, TEST_PASSWORD } from './helpers/fakes';

const HOST = `acme.${ROOT_HOST}`;

/** Real routes, real middleware and real services; only storage and email are in-memory fakes. */
function buildApp() {
  const w = createWorld();
  w.companies.rows.push(makeCompany());
  w.users.rows.push(makeUser({ mustChangePassword: true }));
  return { app: w.app, w };
}
const login = (app: ReturnType<typeof createWorld>['app']) =>
  request(app).post('/api/auth/login').set('Host', HOST).send({ email: 'user@example.com', password: TEST_PASSWORD });

describe('HTTP: health', () => {
  it('is public and reports the database', async () => {
    const res = await request(createWorld().app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('answers 503 problem-details when the database is down', async () => {
    const w = createWorld();
    const app = createApp({
      config: testConfig,
      services: { auth: w.auth, jwt: w.jwt } as never,
      users: w.users,
      companies: w.companies,
      checkDatabase: vi.fn().mockRejectedValue(new Error('down')),
      rateLimiters: noRateLimiters,
    });
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });
});

describe('HTTP: auth', () => {
  let ctx: ReturnType<typeof buildApp>;
  beforeEach(() => {
    ctx = buildApp();
  });

  it('rejects unauthenticated access to protected routes with problem-details', async () => {
    const res = await request(ctx.app).get('/api/auth/me').set('Host', HOST);
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({ status: 401, title: 'Unauthorized' });
  });

  it('validates the login body (bad email, unknown fields)', async () => {
    const bad = await request(ctx.app).post('/api/auth/login').set('Host', HOST).send({ email: 'nope', password: 'x' });
    expect(bad.status).toBe(400);
    expect(bad.body.errors.length).toBeGreaterThan(0);
    const extra = await request(ctx.app).post('/api/auth/login').set('Host', HOST).send({ email: 'a@b.co', password: 'x', admin: true });
    expect(extra.status).toBe(400);
  });

  it('rejects malformed JSON as a 400, not a 500', async () => {
    const res = await request(ctx.app).post('/api/auth/login').set('Host', HOST).set('Content-Type', 'application/json').send('{"email":');
    expect(res.status).toBe(400);
  });

  it('answers a wrong password with the generic 401', async () => {
    const res = await request(ctx.app).post('/api/auth/login').set('Host', HOST).send({ email: 'user@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.detail).toBe('Invalid email or password');
  });

  it('login sets an httpOnly, SameSite=Lax cookie scoped to /api/auth and keeps the refresh token out of the body', async () => {
    const res = await login(ctx.app);
    expect(res.status).toBe(200);
    expect(res.body.user.mustChangePassword).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain('refresh');
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('refresh_token='))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\/api\/auth/i);
  });

  it('forces a password change: /me works, then the new password is accepted', async () => {
    const session = await login(ctx.app);
    const bearer = `Bearer ${session.body.accessToken}`;
    expect((await request(ctx.app).get('/api/auth/me').set('Host', HOST).set('Authorization', bearer)).status).toBe(200);

    const weak = await request(ctx.app).post('/api/auth/change-password').set('Host', HOST).set('Authorization', bearer)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'weak' });
    expect(weak.status).toBe(400);
    expect(weak.body.errors.join(' ')).toContain('at least 10');

    const ok = await request(ctx.app).post('/api/auth/change-password').set('Host', HOST).set('Authorization', bearer)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'Brand-New-Pass-77' });
    expect(ok.status).toBe(200);
    expect(ok.body.user.mustChangePassword).toBe(false);
    expect(ctx.w.sent).toHaveLength(1);
  });

  it('refresh rotates the cookie; logout ends the session', async () => {
    const agent = request.agent(ctx.app);
    await agent.post('/api/auth/login').set('Host', HOST).send({ email: 'user@example.com', password: TEST_PASSWORD });
    const first = await agent.post('/api/auth/refresh').set('Host', HOST);
    expect(first.status).toBe(200);
    expect(first.body.accessToken).toBeTruthy();
    expect((await agent.post('/api/auth/logout').set('Host', HOST)).status).toBe(204);
    expect((await agent.post('/api/auth/refresh').set('Host', HOST)).status).toBe(401);
  });

  it('answers unknown routes with a problem-details 404', async () => {
    const res = await request(ctx.app).get('/api/nope').set('Host', HOST);
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });

  it('sends security headers and hides the framework', async () => {
    const res = await request(ctx.app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});