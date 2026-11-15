import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld, ROOT_HOST, tokenFromLastEmail } from './helpers/fakes';

const HOST = (slug: string) => `${slug}.${ROOT_HOST}`;
const STRONG = 'Brand-New-Pass-77';

type World = ReturnType<typeof createWorld>;

/** Small helper: an authenticated request against one company's address. */
const as = (w: World, slug: string, token: string) => ({
  get: (url: string) => request(w.app).get(url).set('Host', HOST(slug)).set('Authorization', token),
  post: (url: string) => request(w.app).post(url).set('Host', HOST(slug)).set('Authorization', token),
  put: (url: string) => request(w.app).put(url).set('Host', HOST(slug)).set('Authorization', token),
  del: (url: string) => request(w.app).delete(url).set('Host', HOST(slug)).set('Authorization', token),
});

async function registerCompany(w: World, slug: string, email: string): Promise<string> {
  expect((await request(w.app).post('/api/companies/signup').send({ companyName: `${slug} Co`, slug, name: 'Meera Joseph', email, password: STRONG })).status).toBe(201);
  expect((await request(w.app).post('/api/auth/verify-email').send({ token: tokenFromLastEmail(w.sent) })).status).toBe(200);
  const login = await request(w.app).post('/api/auth/login').set('Host', HOST(slug)).send({ email, password: STRONG });
  return `Bearer ${login.body.accessToken as string}`;
}

/** Invites a person by email through the given route, accepts the emailed link and returns their bearer token and id. */
async function inviteAndAccept(w: World, slug: string, inviter: string, path: string, name: string, email: string) {
  const sent = await as(w, slug, inviter).post(path).send({ name, email });
  expect(sent.status, JSON.stringify(sent.body)).toBe(201);
  const accepted = await request(w.app).post('/api/invitations/accept').set('Host', HOST(slug)).send({ token: tokenFromLastEmail(w.sent), name, password: STRONG });
  expect(accepted.status, JSON.stringify(accepted.body)).toBe(201);
  return { token: `Bearer ${accepted.body.accessToken as string}`, id: accepted.body.user.id as number };
}

/** One company with two organizations: Plant has QA and Production, Office has Finance; each department has a head. */
async function buildCompany(w: World, slug = 'acme') {
  const ceo = await registerCompany(w, slug, `ceo@${slug}.example`);
  const c = as(w, slug, ceo);
  const plant = (await c.post('/api/organizations').send({ name: 'Plant', code: 'PL' })).body.id as number;
  const office = (await c.post('/api/organizations').send({ name: 'Office', code: 'OF' })).body.id as number;
  const qa = (await c.post(`/api/organizations/${plant}/departments`).send({ name: 'Quality', code: 'QA' })).body.id as number;
  const production = (await c.post(`/api/organizations/${plant}/departments`).send({ name: 'Production', code: 'PR' })).body.id as number;
  const finance = (await c.post(`/api/organizations/${office}/departments`).send({ name: 'Finance', code: 'FN' })).body.id as number;
  const qaHead = await inviteAndAccept(w, slug, ceo, `/api/departments/${qa}/head-invitation`, 'Priya Nair', `priya@${slug}.example`);
  const prHead = await inviteAndAccept(w, slug, ceo, `/api/departments/${production}/head-invitation`, 'Rahul Menon', `rahul@${slug}.example`);
  const fnHead = await inviteAndAccept(w, slug, ceo, `/api/departments/${finance}/head-invitation`, 'Divya Sen', `divya@${slug}.example`);
  return { slug, ceo, qa, production, finance, qaHead, prHead, fnHead };
}

describe('employee invitations and department people', () => {
  let w: World;
  beforeEach(() => {
    w = createWorld();
  });

  it('lets a department head invite an employee to their own department, and nobody else', async () => {
    const co = await buildCompany(w);
    const employee = await inviteAndAccept(w, co.slug, co.qaHead.token, `/api/departments/${co.qa}/employee-invitation`, 'Anjali N', 'anjali@acme.example');
    expect(employee.id).toBeGreaterThan(0);

    const other = await as(w, co.slug, co.prHead.token).post(`/api/departments/${co.qa}/employee-invitation`).send({ name: 'Sneaky', email: 'sneaky@acme.example' });
    expect(other.status).toBe(403);
    const staff = await as(w, co.slug, employee.token).post(`/api/departments/${co.qa}/employee-invitation`).send({ name: 'Peer', email: 'peer@acme.example' });
    expect(staff.status).toBe(403);
  });

  it('shows contact details to the head and hides them from a colleague', async () => {
    const co = await buildCompany(w);
    const employee = await inviteAndAccept(w, co.slug, co.qaHead.token, `/api/departments/${co.qa}/employee-invitation`, 'Anjali N', 'anjali@acme.example');
    const asHead = await as(w, co.slug, co.qaHead.token).get(`/api/departments/${co.qa}/people`);
    expect(asHead.status).toBe(200);
    expect(asHead.body.canManage).toBe(true);
    expect(asHead.body.members.map((m: { name: string }) => m.name)).toEqual(['Anjali N', 'Priya Nair']);
    expect(asHead.body.members[0].email).toBe('anjali@acme.example');

    const asColleague = await as(w, co.slug, employee.token).get(`/api/departments/${co.qa}/people`);
    expect(asColleague.status).toBe(200);
    expect(asColleague.body.canManage).toBe(false);
    expect(asColleague.body.members[0].email).toBeUndefined();
    expect(asColleague.body.invitations).toEqual([]);
  });

  it('keeps another department’s people closed to heads and employees outside it', async () => {
    const co = await buildCompany(w);
    expect((await as(w, co.slug, co.prHead.token).get(`/api/departments/${co.qa}/people`)).status).toBe(403);
    expect((await as(w, co.slug, co.ceo).get(`/api/departments/${co.qa}/people`)).status).toBe(200);
  });

  it('lets the department head resend and revoke only their own department’s employee invitations', async () => {
    const co = await buildCompany(w);
    const sent = await as(w, co.slug, co.qaHead.token).post(`/api/departments/${co.qa}/employee-invitation`).send({ name: 'Later', email: 'later@acme.example' });
    const id = sent.body.id as number;
    expect((await as(w, co.slug, co.prHead.token).post(`/api/invitations/${id}/resend`)).status).toBe(403);
    expect((await as(w, co.slug, co.qaHead.token).post(`/api/invitations/${id}/resend`)).status).toBe(200);
    expect((await as(w, co.slug, co.prHead.token).del(`/api/invitations/${id}`)).status).toBe(403);
    expect((await as(w, co.slug, co.qaHead.token).del(`/api/invitations/${id}`)).status).toBe(204);
  });

  it('never lets a department head touch a department-head invitation', async () => {
    const co = await buildCompany(w);
    const empty = (await as(w, co.slug, co.ceo).post(`/api/organizations/${(await as(w, co.slug, co.ceo).get('/api/organizations')).body[0].id}/departments`).send({ name: 'Stores', code: 'ST' })).body.id as number;
    const invite = await as(w, co.slug, co.ceo).post(`/api/departments/${empty}/head-invitation`).send({ name: 'New Head', email: 'newhead@acme.example' });
    expect((await as(w, co.slug, co.qaHead.token).del(`/api/invitations/${invite.body.id as number}`)).status).toBe(403);
  });
});

describe('deactivating people', () => {
  it('lets the department head deactivate their employee, but not heads, themselves or another department’s people', async () => {
    const w = createWorld();
    const co = await buildCompany(w);
    const employee = await inviteAndAccept(w, co.slug, co.qaHead.token, `/api/departments/${co.qa}/employee-invitation`, 'Anjali N', 'anjali@acme.example');

    expect((await as(w, co.slug, co.prHead.token).post(`/api/users/${employee.id}/deactivate`)).status).toBe(403);
    expect((await as(w, co.slug, co.qaHead.token).post(`/api/users/${co.qaHead.id}/deactivate`)).status).toBe(400);
    expect((await as(w, co.slug, co.ceo).post(`/api/users/${co.prHead.id}/deactivate`)).status).toBe(400);

    const done = await as(w, co.slug, co.qaHead.token).post(`/api/users/${employee.id}/deactivate`);
    expect(done.status).toBe(200);
    expect(done.body.status).toBe('Inactive');
    expect(w.auditRepo.entries.some((e) => e.action === 'UserDeactivated')).toBe(true);
    expect((await as(w, co.slug, co.qaHead.token).post(`/api/users/${employee.id}/deactivate`)).status).toBe(409);
  });
});

describe('transfers', () => {
  let w: World;
  let co: Awaited<ReturnType<typeof buildCompany>>;
  let employee: { token: string; id: number };

  beforeEach(async () => {
    w = createWorld();
    co = await buildCompany(w);
    employee = await inviteAndAccept(w, co.slug, co.qaHead.token, `/api/departments/${co.qa}/employee-invitation`, 'Anjali N', 'anjali@acme.example');
  });

  const move = (token: string, toDepartmentId: number) => as(w, co.slug, token).post('/api/transfers').send({ userId: employee.id, toDepartmentId });
  const memberOf = async (departmentId: number) =>
    ((await as(w, co.slug, co.ceo).get(`/api/departments/${departmentId}/people`)).body.members as { id: number }[]).some((m) => m.id === employee.id);

  it('inside one organization both heads must agree, then the person moves', async () => {
    const started = await move(co.qaHead.token, co.production);
    expect(started.status, JSON.stringify(started.body)).toBe(201);
    expect(started.body.status).toBe('Pending');
    expect(started.body.needs).toEqual(['FromHead', 'ToHead']);
    expect(started.body.approved).toEqual(['FromHead']);
    expect(started.body.missing).toEqual(['ToHead']);
    expect(await memberOf(co.qa)).toBe(true);

    const told = w.sent[w.sent.length - 1];
    expect(told.to).toBe('rahul@acme.example');
    expect(told.body).not.toMatch(/minutes/i);

    const approved = await as(w, co.slug, co.prHead.token).post(`/api/transfers/${started.body.id as number}/approve`);
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe('Completed');
    expect(await memberOf(co.production)).toBe(true);
    expect(await memberOf(co.qa)).toBe(false);
    expect(w.auditRepo.entries.map((e) => e.action)).toEqual(expect.arrayContaining(['TransferRequested', 'TransferApproved', 'TransferCompleted']));
  });

  it('across organizations the company head must agree too', async () => {
    const started = await move(co.qaHead.token, co.finance);
    expect(started.body.needs).toEqual(['FromHead', 'ToHead', 'CompanyHead']);
    const id = started.body.id as number;
    await as(w, co.slug, co.fnHead.token).post(`/api/transfers/${id}/approve`);
    expect(await memberOf(co.qa)).toBe(true);

    const final = await as(w, co.slug, co.ceo).post(`/api/transfers/${id}/approve`);
    expect(final.body.status).toBe('Completed');
    expect(await memberOf(co.finance)).toBe(true);
  });

  it('keeps unrelated heads and employees from starting or approving a move', async () => {
    expect((await move(co.fnHead.token, co.production)).status).toBe(403);
    expect((await move(employee.token, co.production)).status).toBe(403);
    const started = await move(co.qaHead.token, co.production);
    expect((await as(w, co.slug, co.fnHead.token).post(`/api/transfers/${started.body.id as number}/approve`)).status).toBe(403);
    expect((await as(w, co.slug, co.qaHead.token).post(`/api/transfers/${started.body.id as number}/approve`)).status).toBe(403);
  });

  it('a declined move leaves the person where they are', async () => {
    const started = await move(co.qaHead.token, co.production);
    const declined = await as(w, co.slug, co.prHead.token).post(`/api/transfers/${started.body.id as number}/reject`).send({ note: 'No room' });
    expect(declined.body.status).toBe('Rejected');
    expect(declined.body.note).toBe('No room');
    expect(await memberOf(co.qa)).toBe(true);
    expect((await as(w, co.slug, co.prHead.token).post(`/api/transfers/${started.body.id as number}/approve`)).status).toBe(409);
  });

  it('only the starter or the company head can withdraw a waiting move', async () => {
    const started = await move(co.qaHead.token, co.production);
    const id = started.body.id as number;
    expect((await as(w, co.slug, co.prHead.token).del(`/api/transfers/${id}`)).status).toBe(403);
    const cancelled = await as(w, co.slug, co.qaHead.token).del(`/api/transfers/${id}`);
    expect(cancelled.body.status).toBe('Cancelled');
  });

  it('refuses a second waiting move, a move of a department head and a move to the same department', async () => {
    expect((await move(co.qaHead.token, co.production)).status).toBe(201);
    expect((await move(co.qaHead.token, co.finance)).status).toBe(409);
    const headMove = await as(w, co.slug, co.ceo).post('/api/transfers').send({ userId: co.prHead.id, toDepartmentId: co.qa });
    expect(headMove.status).toBe(400);
    expect(headMove.body.detail ?? headMove.body.message ?? JSON.stringify(headMove.body)).toMatch(/replacement/);
    expect((await move(co.qaHead.token, co.qa)).status).toBe(400);
  });

  it('lists each head only the moves that touch their department', async () => {
    await move(co.qaHead.token, co.production);
    expect((await as(w, co.slug, co.prHead.token).get('/api/transfers')).body).toHaveLength(1);
    expect((await as(w, co.slug, co.fnHead.token).get('/api/transfers')).body).toHaveLength(0);
    expect((await as(w, co.slug, co.ceo).get('/api/transfers')).body).toHaveLength(1);
    const forProduction = (await as(w, co.slug, co.prHead.token).get('/api/transfers')).body[0];
    expect(forProduction.canApprove).toBe(true);
    expect((await as(w, co.slug, co.qaHead.token).get('/api/transfers')).body[0].canApprove).toBe(false);
  });
});

describe('another company', () => {
  it('cannot see or move this company’s people or departments', async () => {
    const w = createWorld();
    const co = await buildCompany(w, 'acme');
    const other = await buildCompany(w, 'globex');
    const employee = await inviteAndAccept(w, co.slug, co.qaHead.token, `/api/departments/${co.qa}/employee-invitation`, 'Anjali N', 'anjali@acme.example');

    expect((await as(w, 'globex', other.ceo).get(`/api/departments/${co.qa}/people`)).status).toBe(404);
    expect((await as(w, 'globex', other.ceo).post('/api/transfers').send({ userId: employee.id, toDepartmentId: other.production })).status).toBe(404);
    expect((await as(w, 'globex', other.ceo).post(`/api/users/${employee.id}/deactivate`)).status).toBe(404);
    expect((await as(w, 'globex', other.qaHead.token).post(`/api/departments/${co.qa}/employee-invitation`).send({ name: 'X', email: 'x@globex.example' })).status).toBe(404);
    expect((await as(w, 'acme', other.ceo).get('/api/transfers')).status).toBe(401);
  });
});

describe('profile', () => {
  it('lets a person edit their own details but not their email', async () => {
    const w = createWorld();
    const co = await buildCompany(w);
    const me = as(w, co.slug, co.qaHead.token);
    const saved = await me.put('/api/profile').send({ name: 'Priya N.', jobTitle: 'Head of Quality', phone: '+91 98765 43210' });
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ name: 'Priya N.', jobTitle: 'Head of Quality', phone: '+91 98765 43210', email: 'priya@acme.example' });
    expect((await me.get('/api/profile')).body.jobTitle).toBe('Head of Quality');
    expect((await me.put('/api/profile').send({ name: 'P', phone: 'call me' })).status).toBe(400);
    expect((await me.put('/api/profile').send({ name: 'P', email: 'new@x.example' })).status).toBe(400);
    const cleared = await me.put('/api/profile').send({ name: 'Priya N.', jobTitle: '', phone: '' });
    expect(cleared.body.jobTitle).toBeNull();
    expect(cleared.body.phone).toBeNull();
  });

  it('signs avatar uploads into the company’s own folder and rejects anyone else’s image', async () => {
    const w = createWorld();
    const co = await buildCompany(w);
    const me = as(w, co.slug, co.qaHead.token);
    const signature = await me.post('/api/profile/avatar/signature');
    expect(signature.status).toBe(200);
    expect(signature.body.folder).toBe('quorum/acme/avatars');

    const foreign = await me.put('/api/profile/avatar').send({ publicId: 'quorum/globex/avatars/x', url: 'https://res.cloudinary.com/democloud/image/upload/v1/quorum/globex/avatars/x.jpg' });
    expect(foreign.status).toBe(400);
    const own = await me.put('/api/profile/avatar').send({ publicId: 'quorum/acme/avatars/abc', url: 'https://res.cloudinary.com/democloud/image/upload/v1/quorum/acme/avatars/abc.jpg' });
    expect(own.status).toBe(200);
    expect(own.body.avatarUrl).toContain('/quorum/acme/avatars/abc');
    expect((await me.del('/api/profile/avatar')).body.avatarUrl).toBeNull();
  });
});