import { AsyncLocalStorage } from 'node:async_hooks';

/** Per-request tenant information, set by the auth guard. */
export interface TenantStore {
  organizationId: number | null;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

/** Models whose rows belong to exactly one organization. */
export const TENANT_MODELS: ReadonlySet<string> = new Set([
  'Department',
  'User',
  'EmailLog',
  'AuditLog',
]);

type Args = Record<string, unknown>;

/** Operations that filter by `where`. Our organizationId always wins over caller input. */
const WHERE_OPERATIONS: ReadonlySet<string> = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'delete',
  'deleteMany',
  'upsert',
]);

export class TenantContextMissingError extends Error {
  constructor(model: string, operation: string) {
    super(
      `Tenant-scoped query ${model}.${operation} ran without an organization in context`,
    );
    this.name = 'TenantContextMissingError';
  }
}

function withOrganization(data: unknown, organizationId: number): unknown {
  if (Array.isArray(data)) {
    return data.map((row) => withOrganization(row, organizationId));
  }
  return { ...(data as Args), organizationId };
}

/**
 * Pure function: returns query args restricted to one organization.
 * - reads/updates/deletes: organizationId is forced into `where`
 * - creates: organizationId is forced into `data`
 * Queries on tenant models without an organization in context throw.
 */
export function applyTenantScope(
  model: string,
  operation: string,
  args: Args | undefined,
  organizationId: number | null | undefined,
): Args {
  const scoped: Args = { ...(args ?? {}) };
  if (!TENANT_MODELS.has(model)) {
    return scoped;
  }
  if (organizationId === null || organizationId === undefined) {
    throw new TenantContextMissingError(model, operation);
  }

  if (WHERE_OPERATIONS.has(operation)) {
    scoped.where = { ...((scoped.where as Args | undefined) ?? {}), organizationId };
  }
  if (operation === 'create' || operation === 'createMany' || operation === 'createManyAndReturn') {
    scoped.data = withOrganization(scoped.data, organizationId);
  }
  if (operation === 'upsert') {
    scoped.create = withOrganization(scoped.create, organizationId);
  }
  return scoped;
}
