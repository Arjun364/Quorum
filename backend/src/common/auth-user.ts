import type { SystemRole } from '@prisma/client';
import type { Request } from 'express';

/** The signed-in user, loaded fresh from the database on every request. */
export interface AuthUser {
  id: number;
  organizationId: number | null;
  departmentId: number | null;
  systemRole: SystemRole;
  mustChangePassword: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
