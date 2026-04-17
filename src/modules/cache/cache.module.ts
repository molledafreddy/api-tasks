import { Global, Module } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { CacheService } from './cache.service';
import { REDIS_CLIENT } from './cache.tokens';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [AppConfigService],
      useFactory: (cfg: AppConfigService): Redis =>
        new Redis(cfg.get('REDIS_URL'), {
          lazyConnect: false,
          maxRetriesPerRequest: 3,
        }),
    },
    CacheService,
  ],
  exports: [REDIS_CLIENT, CacheService],
})
export class CacheModule {}
