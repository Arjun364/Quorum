import { Router } from 'express';
import type { AuthController } from '../controllers';
import type { Authenticate, RateLimiters } from '../middlewares';
import { validateBody } from '../middlewares';
import { changePasswordSchema, loginSchema } from '../validators';

/** Routes under /api/auth. */
export function createAuthRouter(controller: AuthController, authenticate: Authenticate, limits: RateLimiters): Router {
  const router = Router();
  router.post('/login', limits.login, validateBody(loginSchema), controller.login);
  router.post('/refresh', limits.refresh, controller.refresh);
  router.post('/logout', controller.logout);
  router.post(
    '/change-password',
    limits.changePassword,
    authenticate({ allowPasswordChangeRequired: true }),
    validateBody(changePasswordSchema),
    controller.changePassword,
  );
  router.get('/me', authenticate({ allowPasswordChangeRequired: true }), controller.me);
  return router;
}
