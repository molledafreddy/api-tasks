import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../../../config/app-config.service';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(cfg: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.get('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return { userId: payload.sub, email: payload.email };
  }
}
