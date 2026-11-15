import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface AuditEntry {
  userId?: number | null;
  organizationId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  details?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          organizationId: entry.organizationId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId === undefined || entry.entityId === null ? null : String(entry.entityId),
          details: entry.details,
        },
      });
    } catch (e) {
      this.logger.error(`Audit write failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
