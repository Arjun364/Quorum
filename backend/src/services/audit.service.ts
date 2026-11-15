import type { AuditEntry, AuditLogRepositoryContract } from '../types';
import { createLogger } from '../utils';

const logger = createLogger('Audit');

/** Records audit entries; a failed write is logged but never breaks the action being audited. */
export class AuditService {
  constructor(private readonly auditLogs: AuditLogRepositoryContract) {}

  /** Writes one audit entry, swallowing (and logging) storage errors. */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.auditLogs.create(entry);
    } catch (error) {
      logger.error('Audit write failed', error);
    }
  }
}
