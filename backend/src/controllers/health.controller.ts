import type { RequestHandler } from 'express';
import { serviceUnavailable } from '../utils';

/** Builds the health controller; `checkDatabase` rejects when the database cannot be reached. */
export function createHealthController(checkDatabase: () => Promise<void>) {
  /** GET /health: reports that the API and its database are up. */
  const check: RequestHandler = async (_req, res) => {
    try {
      await checkDatabase();
    } catch {
      throw serviceUnavailable('Database is not reachable');
    }
    res.status(200).json({ status: 'ok', database: 'up', time: new Date().toISOString() });
  };

  return { check };
}

export type HealthController = ReturnType<typeof createHealthController>;
