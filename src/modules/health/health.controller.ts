import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CacheService } from '../cache/cache.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly cache: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check (DB + Redis)' })
  @ApiOkResponse({ description: 'Estado de salud del servicio' })
  async check(): Promise<{
    status: 'ok' | 'degraded';
    db: 'up' | 'down';
    redis: 'up' | 'down';
    timestamp: string;
  }> {
    const [dbOk, redisOk] = await Promise.all([
      this.pingDb(),
      this.cache.ping(),
    ]);
    const allUp = dbOk && redisOk;
    return {
      status: allUp ? 'ok' : 'degraded',
      db: dbOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };
  }

  private async pingDb(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
