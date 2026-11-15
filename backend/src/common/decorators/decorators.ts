import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { AuthUser, AuthenticatedRequest } from '../auth-user';

export const IS_PUBLIC_KEY = 'isPublic';
/** Route needs no login. */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

export const ALLOW_PASSWORD_CHANGE_KEY = 'allowWhenPasswordChangeRequired';
/** Route may be used while the user still must change their password. */
export const AllowWhenPasswordChangeRequired = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ALLOW_PASSWORD_CHANGE_KEY, true);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
  },
);
