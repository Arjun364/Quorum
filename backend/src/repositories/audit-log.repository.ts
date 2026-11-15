import type { PrismaClient } from '@prisma/client';
import type { AuditEntry, AuditLogRepositoryContract } from '../types';

/** Writes audit entries. */
export class AuditLogRepository implements AuditLogRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  /** Stores one audit entry. */
  async create(entry: AuditEntry): Promise<void> {
    await this.db.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        organizationId: entry.organizationId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId === undefined || entry.entityId === null ? null : String(entry.entityId),
        details: entry.details,
      },
    });
  }
}
