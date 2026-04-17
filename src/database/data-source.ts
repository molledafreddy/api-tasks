import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

loadEnv();

const isProduction = process.env.NODE_ENV === 'production';

export const dataSourceOptions: PostgresConnectionOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../modules/**/entities/*.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: !isProduction ? ['error', 'warn', 'migration'] : ['error'],
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
