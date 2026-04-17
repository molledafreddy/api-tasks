import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AppConfigService } from '../../config/app-config.service';

jest.mock('bcrypt');

const USER_ID = '11111111-1111-1111-1111-111111111111';
const EMAIL = 'test@test.com';
const PASSWORD = 'Test1234!';
const HASH = '$2b$10$hashedpassword';

const mockUser = { id: USER_ID, email: EMAIL, password: HASH, createdAt: new Date(), updatedAt: new Date() };

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};
const mockJwtService = { sign: jest.fn().mockReturnValue('jwt-token') };
const mockConfig = { get: jest.fn().mockReturnValue('1h') };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AppConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user and return auth response', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(HASH);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register({ email: EMAIL, password: PASSWORD });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.email).toBe(EMAIL);
      expect(result.tokenType).toBe('Bearer');
    });

    it('should throw ConflictException if email exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      await expect(service.register({ email: EMAIL, password: PASSWORD })).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login and return auth response', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: EMAIL, password: PASSWORD });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.userId).toBe(USER_ID);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: EMAIL, password: PASSWORD })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login({ email: EMAIL, password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
  });
});
