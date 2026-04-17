import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../modules/auth/types/auth.types';

/**
 * Inyecta el usuario autenticado (cargado por `JwtStrategy.validate`) en el handler.
 * Uso: `@CurrentUser() user: AuthenticatedUser`
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    return req.user;
  },
);
