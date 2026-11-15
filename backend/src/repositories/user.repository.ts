import type { Prisma, PrismaClient, User } from '@prisma/client';
import type { AuthUser, UserRepositoryContract } from '../types';

/** Reads and writes users with the raw client (login and bootstrap run before any organization is known). */
export class UserRepository implements UserRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  /** Finds a user by lowercase email, or null. */
  findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  /** Finds a user by id, or null. */
  findById(id: number): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  /** Loads only the fields the authentication middleware needs, plus the status. */
  findAuthById(id: number): Promise<(AuthUser & { status: User['status'] }) | null> {
    return this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        organizationId: true,
        departmentId: true,
        systemRole: true,
        status: true,
        mustChangePassword: true,
      },
    });
  }

  /** Counts all users (used by the one-time bootstrap). */
  count(): Promise<number> {
    return this.db.user.count();
  }

  /** Creates a user. */
  create(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return this.db.user.create({ data });
  }

  /** Updates a user and returns the new record. */
  update(id: number, data: Prisma.UserUncheckedUpdateInput): Promise<User> {
    return this.db.user.update({ where: { id }, data });
  }
}
