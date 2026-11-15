import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth-user';
import { ALLOW_PASSWORD_CHANGE_KEY, IS_PUBLIC_KEY } from '../decorators/decorators';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../tenant/tenant-scope';

interface AccessTokenPayload {
  sub: number;
}

/**
 * Global guard. Verifies the access token, reloads the user from the database
 * (so deactivation takes effect immediately), enforces `mustChangePassword`,
 * and puts the user's organization into the tenant context.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        organizationId: true,
        departmentId: true,
        systemRole: true,
        status: true,
        mustChangePassword: true,
      },
    });
    if (!user || user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Account is not active');
    }

    if (
      user.mustChangePassword &&
      !this.reflector.getAllAndOverride<boolean>(ALLOW_PASSWORD_CHANGE_KEY, targets)
    ) {
      throw new ForbiddenException({
        message: 'You must change your password before continuing',
        code: 'PASSWORD_CHANGE_REQUIRED',
      });
    }

    request.user = {
      id: user.id,
      organizationId: user.organizationId,
      departmentId: user.departmentId,
      systemRole: user.systemRole,
      mustChangePassword: user.mustChangePassword,
    };
    // Applies to the rest of this request's async chain.
    tenantStorage.enterWith({ organizationId: user.organizationId });
    return true;
  }
}
