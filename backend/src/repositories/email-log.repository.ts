import type { PrismaClient } from '@prisma/client';
import type { EmailLogEntry, EmailLogRepositoryContract } from '../types';

/** Writes one row per email attempt. */
export class EmailLogRepository implements EmailLogRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  /** Stores one email attempt (sent or failed). */
  async create(entry: EmailLogEntry): Promise<void> {
    await this.db.emailLog.create({ data: entry });
  }
}
