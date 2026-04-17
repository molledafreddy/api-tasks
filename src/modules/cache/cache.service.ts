import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from './cache.tokens';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`cache.get failed for key=${key}: ${(err as Error).message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`cache.set failed for key=${key}: ${(err as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`cache.del failed for key=${key}: ${(err as Error).message}`);
    }
  }

  async delByPattern(pattern: string): Promise<number> {
    let deleted = 0;
    try {
      const stream = this.redis.scanStream({ match: pattern, count: 100 });
      for await (const keys of stream as AsyncIterable<string[]>) {
        if (keys.length > 0) {
          deleted += await this.redis.del(...keys);
        }
      }
    } catch (err) {
      this.logger.warn(
        `cache.delByPattern failed for pattern=${pattern}: ${(err as Error).message}`,
      );
    }
    return deleted;
  }

  async ping(): Promise<boolean> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}
