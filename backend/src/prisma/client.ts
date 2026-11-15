import { PrismaClient } from '@prisma/client';
import { applyTenantScope, tenantStorage } from './tenant-scope';

/** Builds the raw client and the tenant-scoped client that share one connection pool. */
export function createPrismaClients() {
  /** Raw (unscoped) client. Use ONLY for pre-authentication work (login, refresh, bootstrap) and platform-level tasks. */
  const raw = new PrismaClient();

  /** Client that forces every tenant-model query into the signed-in organization. Feature repositories use this one. */
  const tenant = raw.$extends({
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          const scoped = applyTenantScope(
            model,
            operation,
            args as Record<string, unknown>,
            tenantStorage.getStore()?.organizationId,
          );
          return query(scoped);
        },
      },
    },
  });

  return { raw, tenant };
}

export type PrismaClients = ReturnType<typeof createPrismaClients>;
