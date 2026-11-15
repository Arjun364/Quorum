import type { SystemRole } from '@prisma/client';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginRequest {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password: string;
}

export class ChangePasswordRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  currentPassword: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  newPassword: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  systemRole: SystemRole;
  organizationId: number | null;
  departmentId: number | null;
  mustChangePassword: boolean;
}

export interface AuthResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: UserResponse;
}
