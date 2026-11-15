import type { PrismaClient, RefreshToken } from '@prisma/client';
import type { RefreshTokenRepositoryContract, RefreshTokenWithUser } from '../types';

/** Stores refresh-token hashes and their revocation state. */
export class RefreshTokenRepository implements RefreshTokenRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  /** Stores the hash of a newly issued refresh token. */
  create(data: {
    companyId: number | null;
    userId: number;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.db.refreshToken.create({ data });
  }

  /** Finds a token by its hash, together with its owner. */
  findByHash(tokenHash: string): Promise<RefreshTokenWithUser | null> {
    return this.db.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
  }

  /** Marks one token as revoked. */
  async revoke(id: number): Promise<void> {
    await this.db.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  /** Revokes the token with this hash if it is still active. */
  async revokeActiveByHash(tokenHash: string): Promise<void> {
    await this.db.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  /** Revokes every active token of a user (ends all their sessions). */
  async revokeAllActiveForUser(userId: number): Promise<void> {
    await this.db.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
