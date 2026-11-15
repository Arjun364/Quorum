import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { applyTenantScope, tenantStorage } from '../tenant/tenant-scope';

/**
 * Raw (unscoped) client. Use ONLY for pre-authentication work (login, refresh,
 * bootstrap) and platform-level tasks. Feature code must use `tenant` below.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /** Client that forces every tenant-model query into the signed-in organization. */
  readonly tenant = this.$extends({
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

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
