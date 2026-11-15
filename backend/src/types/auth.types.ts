import type { SystemRole, User } from '@prisma/client';

/** The signed-in user, loaded fresh from the database on every request. */
export interface AuthUser {
  id: number;
  companyId: number | null;
  departmentId: number | null;
  systemRole: SystemRole;
  mustChangePassword: boolean;
}

/** User fields returned to clients. */
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  systemRole: SystemRole;
  companyId: number | null;
  departmentId: number | null;
  jobTitle: string | null;
  phone: string | null;
  avatarUrl: string | null;
  mustChangePassword: boolean;
}

/** Body returned by login, refresh and change-password (the refresh token travels only in the cookie). */
export interface AuthResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: UserResponse;
}

/** A freshly issued session: the response body plus the refresh token to put in the cookie. */
export interface IssuedSession extends AuthResponse {
  refreshToken: string;
  refreshExpiresAt: Date;
}

/** Maps a user record to the fields safe to return to clients. */
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    systemRole: user.systemRole,
    companyId: user.companyId,
    departmentId: user.departmentId,
    jobTitle: user.jobTitle,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    mustChangePassword: user.mustChangePassword,
  };
}
