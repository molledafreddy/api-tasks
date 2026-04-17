import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppConfigService } from '../../config/app-config.service';
import { UsersService } from '../users/users.service';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './types/auth.types';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly cfg: AppConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.create({ email: dto.email, passwordHash });
    return this.buildAuthResponse(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.buildAuthResponse(user.id, user.email);
  }

  private buildAuthResponse(userId: string, email: string): AuthResponseDto {
    const payload: JwtPayload = { sub: userId, email };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.cfg.get('JWT_EXPIRES_IN'),
      email,
      userId,
    };
  }
}
