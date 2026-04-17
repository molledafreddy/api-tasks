import { z } from 'zod';

/**
 * Schema de variables de entorno validado en arranque.
 * El tipo `Env` se infiere automáticamente (TypeScript-first).
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('1h'),

  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  CORS_ORIGIN: z.string().default('*'),
});

export type Env = z.infer<typeof envSchema>;
