import { SystemRole } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld, ROOT_HOST, tokenFromLastEmail, TEST_PASSWORD } from './helpers/fakes';

const HOST = (slug: string) => `${slug}.${ROOT_HOST}`;
const STRONG = 'Brand-New-Pass-77';

type World = ReturnType<typeof createWorld>;

/** Registers a company through the real route and verifies its head's email. */
async function registerCompany(w: World, slug = 'northwind', email = 'meera@northwind.example') {
  const res = await request(w.app).post('/api/companies/signup').send({
    companyName: 'Northwind Engineering', slug, name: 'Meera Joseph', jobTitle: 'CEO', email, password: STRONG,
  });
  return res;
}
async function registerAndVerify(w: World, slug = 'northwind', email = 'meera@northwind.example') {
  expect((await registerCompany(w, slug, email)).status).toBe(201);
  const token = tokenFromLastEmail(w.sent);
  const verify = await request(w.app).post('/api/auth/verify-email').send({ token });
  expect(verify.status).toBe(200);
}
async function signIn(w: World, slug: string, email: string, password = STRONG) {
  const res = await request(w.app).post('/api/auth/login').set('Host', HOST(slug)).send({ email, password });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return `Bearer ${res.body.accessToken as string}`;
}

describe('company signup', () => {
  let w: World;
  beforeEach(() => {
    w = createWorld();
  });

  it('checks company addresses: bad format, reserved, taken, free', async () => {
    const check = async (slug: string) => (await request(w.app).get('/api/companies/slug-available').query({ slug })).body;
    expect(await check('ab')).toMatchObject({ available: false });
    expect(await check('admin')).toMatchObject({ available: false, reason: 'That address is reserved' });
    expect(await check('northwind')).toEqual({ available: true });
    await registerCompany(w);
    expect(await check('northwind')).toMatchObject({ available: false, reason: 'That address is taken' });
  });

  it('registers a company with a head, inactive until the email link is used, and emails a link on the company address', async () => {
    const res = await registerCompany(w);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ slug: 'northwind', email: 'meera@northwind.example' });
    expect(w.companies.rows[0].status).toBe('PendingVerification');
    expect(w.users.rows[0]).toMatchObject({ systemRole: SystemRole.CompanyHead, emailVerifiedAt: null, jobTitle: 'CEO' });
    const mail = w.sent[0];
    expect(mail.to).toBe('meera@northwind.example');
    expect(mail.link!.url).toMatch(/^http:\/\/northwind\.quorum\.test\/verify-email\?token=/);
    expect(JSON.stringify(mail)).not.toContain(STRONG);
  });

  it('refuses a taken address (409), a weak password (400) and unknown fields (400)', async () => {
    await registerCompany(w);
    expect((await registerCompany(w, 'northwind', 'other@x.example')).status).toBe(409);
    const weak = await request(w.app).post('/api/companies/signup').send({ companyName: 'X Co', slug: 'xco', name: 'A', email: 'a@x.example', password: 'weak' });
    expect(weak.status).toBe(400);
    const extra = await request(w.app).post('/api/companies/signup').send({ companyName: 'X Co', slug: 'xco', name: 'A', email: 'a@x.example', password: STRONG, systemRole: 'Admin' });
    expect(extra.status).toBe(400);
  });

  it('blocks sign-in until the email is verified, then allows it and activates the company', async () => {
    await registerCompany(w);
    const before = await request(w.app).post('/api/auth/login').set('Host', HOST('northwind')).send({ email: 'meera@northwind.example', password: STRONG });
    expect(before.status).toBe(403);
    expect(before.body.code).toBe('EMAIL_NOT_VERIFIED');
    await request(w.app).post('/api/auth/verify-email').send({ token: tokenFromLastEmail(w.sent) });
    expect(w.companies.rows[0].status).toBe('Active');
    await signIn(w, 'northwind', 'meera@northwind.example');
  });

  it('a verification link works once and not when invalid', async () => {
    await registerCompany(w);
    const token = tokenFromLastEmail(w.sent);
    expect((await request(w.app).post('/api/auth/verify-email').send({ token })).status).toBe(200);
    expect((await request(w.app).post('/api/auth/verify-email').send({ token })).status).toBe(400);
    expect((await request(w.app).post('/api/auth/verify-email').send({ token: 'not-a-real-token-at-all' })).status).toBe(400);
  });

  it('resending verification always answers 204 and only emails real unverified users', async () => {
    await registerCompany(w);
    const sentBefore = w.sent.length;
    const real = await request(w.app).post('/api/auth/resend-verification').set('Host', HOST('northwind')).send({ email: 'meera@northwind.example' });
    const fake = await request(w.app).post('/api/auth/resend-verification').set('Host', HOST('northwind')).send({ email: 'nobody@x.example' });
    expect([real.status, fake.status]).toEqual([204, 204]);
    expect(w.sent.length).toBe(sentBefore + 1);
  });
});

describe('company address and isolation', () => {
  let w: World;
  beforeEach(async () => {
    w = createWorld();
    await registerAndVerify(w, 'northwind', 'meera@northwind.example');
    await registerAndVerify(w, 'kerala', 'joseph@kerala.example');
  });

  it('serves a company its public branding and 404s an unknown address', async () => {
    const ok = await request(w.app).get('/api/company/public').set('Host', HOST('northwind'));
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ name: 'Northwind Engineering', slug: 'northwind', themePreset: 'Forest', accentColor: '#1f3a34' });
    expect(ok.body).not.toHaveProperty('id');
    expect((await request(w.app).get('/api/company/public').set('Host', HOST('ghost'))).status).toBe(404);
    expect((await request(w.app).get('/api/company/public')).status).toBe(404);
  });

  it('the same email can exist in two companies, and a user cannot sign in on another company’s address', async () => {
    await registerAndVerify(w, 'third', 'meera@northwind.example');
    await signIn(w, 'northwind', 'meera@northwind.example');
    await signIn(w, 'third', 'meera@northwind.example');
    const wrong = await request(w.app).post('/api/auth/login').set('Host', HOST('kerala')).send({ email: 'meera@northwind.example', password: STRONG });
    expect(wrong.status).toBe(401);
  });

  it('a session token from one company is refused on another company’s address', async () => {
    const meera = await signIn(w, 'northwind', 'meera@northwind.example');
    const ok = await request(w.app).get('/api/organizations').set('Host', HOST('northwind')).set('Authorization', meera);
    expect(ok.status).toBe(200);
    const crossed = await request(w.app).get('/api/organizations').set('Host', HOST('kerala')).set('Authorization', meera);
    expect(crossed.status).toBe(401);
  });

  it('company routes need the company head role', async () => {
    const meera = await signIn(w, 'northwind', 'meera@northwind.example');
    void meera;
    w.users.rows.push({ ...w.users.rows[0], id: 99, email: 'emp@northwind.example', systemRole: SystemRole.Employee });
    const token = w.jwt.sign(99).token;
    const res = await request(w.app).get('/api/organizations').set('Host', HOST('northwind')).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('brand', () => {
  let w: World;
  let auth: string;
  beforeEach(async () => {
    w = createWorld();
    await registerAndVerify(w);
    auth = await signIn(w, 'northwind', 'meera@northwind.example');
  });
  const put = (body: object) => request(w.app).put('/api/company/brand').set('Host', HOST('northwind')).set('Authorization', auth).send(body);

  it('changes the name and picks a preset', async () => {
    const res = await put({ name: 'Northwind Group', themePreset: 'Ocean' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Northwind Group', themePreset: 'Ocean', accentColor: '#1d4e89' });
    expect(w.auditRepo.entries.some((e) => e.action === 'BrandUpdated')).toBe(true);
  });

  it('accepts a readable custom accent, and refuses one that is too light or missing', async () => {
    expect((await put({ name: 'N Co', themePreset: 'Custom', accentColor: '#7a1f3d' })).body.accentColor).toBe('#7a1f3d');
    expect((await put({ name: 'N Co', themePreset: 'Custom', accentColor: '#f2d94e' })).status).toBe(400);
    expect((await put({ name: 'N Co', themePreset: 'Custom' })).status).toBe(400);
    expect((await put({ name: 'N Co', themePreset: 'Custom', accentColor: 'red' })).status).toBe(400);
  });

  it('gives a signed logo upload into the company’s own folder, and saves only that folder’s images', async () => {
    const sig = await request(w.app).post('/api/company/logo/signature').set('Host', HOST('northwind')).set('Authorization', auth);
    expect(sig.status).toBe(200);
    expect(sig.body.folder).toBe('quorum/northwind/logo');
    expect(JSON.stringify(sig.body)).not.toContain('secret-for-tests');
    const good = await request(w.app).put('/api/company/logo').set('Host', HOST('northwind')).set('Authorization', auth)
      .send({ publicId: 'quorum/northwind/logo/abc', url: 'https://res.cloudinary.com/democloud/image/upload/v1/quorum/northwind/logo/abc.png' });
    expect(good.status).toBe(200);
    expect(good.body.logoUrl).toContain('quorum/northwind/logo/abc');
    const bad = await request(w.app).put('/api/company/logo').set('Host', HOST('northwind')).set('Authorization', auth)
      .send({ publicId: 'quorum/kerala/logo/abc', url: 'https://res.cloudinary.com/democloud/image/upload/v1/quorum/kerala/logo/abc.png' });
    expect(bad.status).toBe(400);
  });
});

describe('organizations, departments and department-head invitations', () => {
  let w: World;
  let meera: string;
  const api = (method: 'get' | 'post' | 'put' | 'delete', path: string, token = meera, slug = 'northwind') =>
    request(w.app)[method](`/api${path}`).set('Host', HOST(slug)).set('Authorization', token);

  beforeEach(async () => {
    w = createWorld();
    await registerAndVerify(w);
    meera = await signIn(w, 'northwind', 'meera@northwind.example');
  });

  it('creates organizations and departments with unique codes (code is upper-cased)', async () => {
    const org = await api('post', '/organizations').send({ name: 'Northwind Software', code: 'sw' });
    expect(org.status).toBe(201);
    expect(org.body).toMatchObject({ name: 'Northwind Software', code: 'SW', departmentCount: 0 });
    expect((await api('post', '/organizations').send({ name: 'Other', code: 'SW' })).status).toBe(409);

    const dept = await api('post', `/organizations/${org.body.id}/departments`).send({ name: 'Sales', code: 'sal' });
    expect(dept.status).toBe(201);
    expect(dept.body).toMatchObject({ name: 'Sales', code: 'SAL', head: null });
    expect((await api('post', `/organizations/${org.body.id}/departments`).send({ name: 'Sales 2', code: 'SAL' })).status).toBe(409);

    const list = await api('get', '/organizations');
    expect(list.body[0]).toMatchObject({ code: 'SW', departmentCount: 1 });
    expect(w.auditRepo.entries.map((e) => e.action)).toEqual(expect.arrayContaining(['OrganizationCreated', 'DepartmentCreated']));
  });

  it('updates and deactivates, and treats another company’s ids as not found', async () => {
    const org = await api('post', '/organizations').send({ name: 'Northwind Software', code: 'SW' });
    expect((await api('put', `/organizations/${org.body.id}`).send({ name: 'Northwind Systems' })).body.name).toBe('Northwind Systems');
    expect((await api('put', `/organizations/${org.body.id}`).send({ isActive: false })).body.isActive).toBe(false);

    const kerala = await signIn(w, 'kerala', 'joseph@kerala.example').catch(async () => {
      await registerAndVerify(w, 'kerala', 'joseph@kerala.example');
      return signIn(w, 'kerala', 'joseph@kerala.example');
    });
    expect((await api('put', `/organizations/${org.body.id}`, kerala, 'kerala').send({ name: 'Hijack' })).status).toBe(404);
    expect((await api('get', `/organizations/${org.body.id}/departments`, kerala, 'kerala')).status).toBe(404);
    expect((await api('post', `/organizations/${org.body.id}/departments`, kerala, 'kerala').send({ name: 'X', code: 'X' })).status).toBe(404);
  });

  it('invites a department head by email, and the head accepts with exactly that address and sets their own password', async () => {
    const org = await api('post', '/organizations').send({ name: 'Northwind Software', code: 'SW' });
    const dept = await api('post', `/organizations/${org.body.id}/departments`).send({ name: 'HR', code: 'HR' });
    const invite = await api('post', `/departments/${dept.body.id}/head-invitation`).send({ name: 'Leena Kurian', email: 'Leena@Northwind.example' });
    expect(invite.status).toBe(201);
    expect(invite.body).toMatchObject({ email: 'leena@northwind.example', role: 'DepartmentHead' });

    const mail = w.sent[w.sent.length - 1];
    expect(mail.to).toBe('leena@northwind.example');
    expect(mail.link!.url).toMatch(/^http:\/\/northwind\.quorum\.test\/invite\?token=/);
    const token = tokenFromLastEmail(w.sent);

    const listed = await api('get', `/organizations/${org.body.id}/departments`);
    expect(listed.body[0].pendingHeadInvitation).toMatchObject({ email: 'leena@northwind.example' });

    const lookup = await request(w.app).get('/api/invitations/lookup').query({ token }).set('Host', HOST('northwind'));
    expect(lookup.body).toEqual({ companyName: 'Northwind Engineering', departmentName: 'HR', name: 'Leena Kurian', email: 'leena@northwind.example', role: 'DepartmentHead' });

    const weak = await request(w.app).post('/api/invitations/accept').set('Host', HOST('northwind')).send({ token, name: 'Leena Kurian', password: 'weak' });
    expect(weak.status).toBe(400);
    const accepted = await request(w.app).post('/api/invitations/accept').set('Host', HOST('northwind')).send({ token, name: 'Leena Kurian', password: STRONG });
    expect(accepted.status).toBe(201);
    expect(accepted.body.user).toMatchObject({ email: 'leena@northwind.example', systemRole: 'DepartmentHead', mustChangePassword: false });
    expect((accepted.headers['set-cookie'] as unknown as string[]).some((c) => c.startsWith('refresh_token='))).toBe(true);

    const after = await api('get', `/organizations/${org.body.id}/departments`);
    expect(after.body[0].head).toMatchObject({ name: 'Leena Kurian', email: 'leena@northwind.example' });
    expect(after.body[0].pendingHeadInvitation).toBeNull();
    await signIn(w, 'northwind', 'leena@northwind.example');
  });

  it('an invitation works once, can be revoked, resent with a new link, and is refused on another address', async () => {
    const org = await api('post', '/organizations').send({ name: 'Northwind Software', code: 'SW' });
    const dept = await api('post', `/organizations/${org.body.id}/departments`).send({ name: 'HR', code: 'HR' });
    const first = await api('post', `/departments/${dept.body.id}/head-invitation`).send({ name: 'Leena Kurian', email: 'leena@northwind.example' });
    const token1 = tokenFromLastEmail(w.sent);

    const resent = await api('post', `/invitations/${first.body.id}/resend`);
    expect(resent.status).toBe(200);
    const token2 = tokenFromLastEmail(w.sent);
    expect(token2).not.toBe(token1);
    expect((await request(w.app).get('/api/invitations/lookup').query({ token: token1 }).set('Host', HOST('northwind'))).status).toBe(400);
    expect((await request(w.app).get('/api/invitations/lookup').query({ token: token2 }).set('Host', HOST('kerala'))).status).toBe(404);

    expect((await api('delete', `/invitations/${first.body.id}`)).status).toBe(204);
    expect((await request(w.app).get('/api/invitations/lookup').query({ token: token2 }).set('Host', HOST('northwind'))).status).toBe(400);

    const again = await api('post', `/departments/${dept.body.id}/head-invitation`).send({ name: 'Leena Kurian', email: 'leena@northwind.example' });
    expect(again.status).toBe(201);
    const token3 = tokenFromLastEmail(w.sent);
    expect((await request(w.app).post('/api/invitations/accept').set('Host', HOST('northwind')).send({ token: token3, name: 'Leena', password: STRONG })).status).toBe(201);
    expect((await request(w.app).post('/api/invitations/accept').set('Host', HOST('northwind')).send({ token: token3, name: 'Leena', password: STRONG })).status).toBe(400);
  });

  it('refuses a second head for a department and an email already used in the company', async () => {
    const org = await api('post', '/organizations').send({ name: 'Northwind Software', code: 'SW' });
    const dept = await api('post', `/organizations/${org.body.id}/departments`).send({ name: 'HR', code: 'HR' });
    expect((await api('post', `/departments/${dept.body.id}/head-invitation`).send({ name: 'Meera Again', email: 'meera@northwind.example' })).status).toBe(409);
    await api('post', `/departments/${dept.body.id}/head-invitation`).send({ name: 'Leena Kurian', email: 'leena@northwind.example' });
    await request(w.app).post('/api/invitations/accept').set('Host', HOST('northwind')).send({ token: tokenFromLastEmail(w.sent), name: 'Leena', password: STRONG });
    expect((await api('post', `/departments/${dept.body.id}/head-invitation`).send({ name: 'Someone', email: 'someone@northwind.example' })).status).toBe(409);
  });
});

void TEST_PASSWORD;