import { Router } from 'express';
import type { HealthController } from '../controllers';

/** Routes under /api/health (public, not rate limited). */
export function createHealthRouter(controller: HealthController): Router {
  const router = Router();
  router.get('/', controller.check);
  return router;
}
