import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/app-config.module';
import { LoggingModule } from './common/logging/logging.module';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './modules/cache/cache.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    DatabaseModule,
    CacheModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    HealthModule,
    UsersModule,
    AuthModule,
    TasksModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
