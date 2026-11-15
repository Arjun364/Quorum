import { AsyncLocalStorage } from 'node:async_hooks';

/** Per-request tenant information, set by the authenticate middleware. */
export interface TenantStore {
  companyId: number | null;
}

/** Holds the current request's company so repositories can scope every query to it. */
export const tenantStorage = new AsyncLocalStorage<TenantStore>();

/** Models whose rows belong to exactly one company. */
export const TENANT_MODELS: ReadonlySet<string> = new Set(['Organization', 'Department', 'User', 'Invitation', 'EmailLog', 'AuditLog']);

type Args = Record<string, unknown>;

/** Operations that filter by `where`. Our companyId always wins over caller input. */
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

/** Thrown when a tenant-scoped query runs with no company in context (a programming error, never user input). */
export class TenantContextMissingError extends Error {
  constructor(model: string, operation: string) {
    super(`Tenant-scoped query ${model}.${operation} ran without a company in context`);
    this.name = 'TenantContextMissingError';
  }
}

/** Forces companyId onto one create payload or every row of a createMany payload. */
function withOrganization(data: unknown, companyId: number): unknown {
  if (Array.isArray(data)) {
    return data.map((row) => withOrganization(row, companyId));
  }
  return { ...(data as Args), companyId };
}

/**
 * Pure function: returns query args restricted to one company.
 * - reads/updates/deletes: companyId is forced into `where`
 * - creates: companyId is forced into `data`
 * Queries on tenant models without a company in context throw.
 */
export function applyTenantScope(
  model: string,
  operation: string,
  args: Args | undefined,
  companyId: number | null | undefined,
): Args {
  const scoped: Args = { ...(args ?? {}) };
  if (!TENANT_MODELS.has(model)) {
    return scoped;
  }
  if (companyId === null || companyId === undefined) {
    throw new TenantContextMissingError(model, operation);
  }

  if (WHERE_OPERATIONS.has(operation)) {
    scoped.where = { ...((scoped.where as Args | undefined) ?? {}), companyId };
  }
  if (operation === 'create' || operation === 'createMany' || operation === 'createManyAndReturn') {
    scoped.data = withOrganization(scoped.data, companyId);
  }
  if (operation === 'upsert') {
    scoped.create = withOrganization(scoped.create, companyId);
  }
  return scoped;
}
