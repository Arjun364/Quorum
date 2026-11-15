import { describe, expect, it } from 'vitest';
import { applyTenantScope, TenantContextMissingError } from '../src/prisma';

describe('applyTenantScope', () => {
  it('forces companyId into where for reads', () => {
    const out = applyTenantScope('Department', 'findMany', { where: { name: 'Sales' } }, 7);
    expect(out.where).toEqual({ name: 'Sales', companyId: 7 });
  });

  it('adds a where when none was given', () => {
    expect(applyTenantScope('User', 'findMany', undefined, 7).where).toEqual({ companyId: 7 });
  });

  it('overrides an companyId supplied by the caller (cross-tenant attempt)', () => {
    const out = applyTenantScope('Department', 'findFirst', { where: { companyId: 99 } }, 7);
    expect(out.where).toEqual({ companyId: 7 });
  });

  it('scopes unique lookups, updates and deletes too', () => {
    for (const op of ['findUnique', 'findUniqueOrThrow', 'update', 'delete', 'updateMany', 'deleteMany', 'count']) {
      const out = applyTenantScope('Department', op, { where: { id: 3 } }, 7);
      expect(out.where, op).toEqual({ id: 3, companyId: 7 });
    }
  });

  it('forces companyId into data on create, overriding caller input', () => {
    const out = applyTenantScope('Department', 'create', { data: { name: 'X', companyId: 99 } }, 7);
    expect(out.data).toEqual({ name: 'X', companyId: 7 });
  });

  it('forces companyId on every row of createMany', () => {
    const out = applyTenantScope('AuditLog', 'createMany', { data: [{ action: 'a' }, { action: 'b', companyId: 5 }] }, 7);
    expect(out.data).toEqual([
      { action: 'a', companyId: 7 },
      { action: 'b', companyId: 7 },
    ]);
  });

  it('scopes both where and create on upsert', () => {
    const out = applyTenantScope('Department', 'upsert', { where: { id: 1 }, create: { name: 'N' }, update: {} }, 7);
    expect(out.where).toEqual({ id: 1, companyId: 7 });
    expect(out.create).toEqual({ name: 'N', companyId: 7 });
  });

  it('throws when a tenant model is queried with no organization in context', () => {
    expect(() => applyTenantScope('Department', 'findMany', {}, null)).toThrow(TenantContextMissingError);
    expect(() => applyTenantScope('User', 'findMany', {}, undefined)).toThrow(TenantContextMissingError);
  });

  it('leaves non-tenant models untouched', () => {
    const args = { where: { id: 1 } };
    expect(applyTenantScope('Company', 'findMany', args, null)).toEqual(args);
    expect(applyTenantScope('RefreshToken', 'findMany', args, null)).toEqual(args);
  });

  it('does not mutate the caller args', () => {
    const args = { where: { id: 1 } };
    applyTenantScope('Department', 'findMany', args, 7);
    expect(args).toEqual({ where: { id: 1 } });
  });
});
