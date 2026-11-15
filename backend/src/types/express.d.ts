import type { Company } from '@prisma/client';
import type { AuthUser } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      /** Set by the authenticate middleware on protected routes. */
      user?: AuthUser;
      /** The company whose address the request came in on; null on the platform's own address. Set by resolveCompany. */
      company?: Company | null;
    }
  }
}

export {};
