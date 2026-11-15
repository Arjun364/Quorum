import type { Prisma, RefreshToken, User } from '@prisma/client';
import type { AuthUser } from './auth.types';

/** Data access for users. Services depend on this interface, so tests can supply an in-memory version. */
export interface UserRepositoryContract {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  /** Loads only the fields the authentication middleware needs, plus the status. */
  findAuthById(id: number): Promise<(AuthUser & { status: User['status'] }) | null>;
  count(): Promise<number>;
  create(data: Prisma.UserUncheckedCreateInput): Promise<User>;
  update(id: number, data: Prisma.UserUncheckedUpdateInput): Promise<User>;
}

/** A stored refresh token together with its owner. */
export type RefreshTokenWithUser = RefreshToken & { user: User };

/** Data access for refresh tokens (only SHA-256 hashes are ever stored). */
export interface RefreshTokenRepositoryContract {
  create(data: { organizationId: number | null; userId: number; tokenHash: string; expiresAt: Date }): Promise<RefreshToken>;
  findByHash(tokenHash: string): Promise<RefreshTokenWithUser | null>;
  revoke(id: number): Promise<void>;
  revokeActiveByHash(tokenHash: string): Promise<void>;
  revokeAllActiveForUser(userId: number): Promise<void>;
}

/** One audit entry; every create, update, approval, reopen, transfer and role change writes one. */
export interface AuditEntry {
  userId?: number | null;
  organizationId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  details?: Prisma.InputJsonValue;
}

/** Data access for the audit log. */
export interface AuditLogRepositoryContract {
  create(entry: AuditEntry): Promise<void>;
}

/** One logged email attempt. */
export interface EmailLogEntry {
  organizationId: number | null;
  userId: number | null;
  toEmail: string;
  type: string;
  subject: string;
  status: 'Sent' | 'Failed';
  error: string | null;
}

/** Data access for the email log. */
export interface EmailLogRepositoryContract {
  create(entry: EmailLogEntry): Promise<void>;
}
