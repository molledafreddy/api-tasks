import { Module } from '@nestjs/common';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfigModule } from '../config/app-config.module';
import { AppConfigService } from '../config/app-config.service';
import { dataSourceOptions } from './data-source';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (cfg: AppConfigService): TypeOrmModuleOptions => ({
        ...dataSourceOptions,
        type: 'postgres',
        url: cfg.get('DATABASE_URL'),
        ssl: cfg.isProduction ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
