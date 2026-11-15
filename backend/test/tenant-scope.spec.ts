import { describe, expect, it } from 'vitest';
import { applyTenantScope, TenantContextMissingError } from '../src/prisma';

describe('applyTenantScope', () => {
  it('forces organizationId into where for reads', () => {
    const out = applyTenantScope('Department', 'findMany', { where: { name: 'Sales' } }, 7);
    expect(out.where).toEqual({ name: 'Sales', organizationId: 7 });
  });

  it('adds a where when none was given', () => {
    expect(applyTenantScope('User', 'findMany', undefined, 7).where).toEqual({ organizationId: 7 });
  });

  it('overrides an organizationId supplied by the caller (cross-tenant attempt)', () => {
    const out = applyTenantScope('Department', 'findFirst', { where: { organizationId: 99 } }, 7);
    expect(out.where).toEqual({ organizationId: 7 });
  });

  it('scopes unique lookups, updates and deletes too', () => {
    for (const op of ['findUnique', 'findUniqueOrThrow', 'update', 'delete', 'updateMany', 'deleteMany', 'count']) {
      const out = applyTenantScope('Department', op, { where: { id: 3 } }, 7);
      expect(out.where, op).toEqual({ id: 3, organizationId: 7 });
    }
  });

  it('forces organizationId into data on create, overriding caller input', () => {
    const out = applyTenantScope('Department', 'create', { data: { name: 'X', organizationId: 99 } }, 7);
    expect(out.data).toEqual({ name: 'X', organizationId: 7 });
  });

  it('forces organizationId on every row of createMany', () => {
    const out = applyTenantScope('AuditLog', 'createMany', { data: [{ action: 'a' }, { action: 'b', organizationId: 5 }] }, 7);
    expect(out.data).toEqual([
      { action: 'a', organizationId: 7 },
      { action: 'b', organizationId: 7 },
    ]);
  });

  it('scopes both where and create on upsert', () => {
    const out = applyTenantScope('Department', 'upsert', { where: { id: 1 }, create: { name: 'N' }, update: {} }, 7);
    expect(out.where).toEqual({ id: 1, organizationId: 7 });
    expect(out.create).toEqual({ name: 'N', organizationId: 7 });
  });

  it('throws when a tenant model is queried with no organization in context', () => {
    expect(() => applyTenantScope('Department', 'findMany', {}, null)).toThrow(TenantContextMissingError);
    expect(() => applyTenantScope('User', 'findMany', {}, undefined)).toThrow(TenantContextMissingError);
  });

  it('leaves non-tenant models untouched', () => {
    const args = { where: { id: 1 } };
    expect(applyTenantScope('Organization', 'findMany', args, null)).toEqual(args);
    expect(applyTenantScope('RefreshToken', 'findMany', args, null)).toEqual(args);
  });

  it('does not mutate the caller args', () => {
    const args = { where: { id: 1 } };
    applyTenantScope('Department', 'findMany', args, 7);
    expect(args).toEqual({ where: { id: 1 } });
  });
});
