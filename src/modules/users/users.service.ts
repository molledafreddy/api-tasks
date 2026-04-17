import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(params: { email: string; passwordHash: string }): Promise<User> {
    const user = this.repo.create({
      email: params.email.toLowerCase(),
      password: params.passwordHash,
    });
    return this.repo.save(user);
  }
}
