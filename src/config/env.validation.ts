import { envSchema, type Env } from './env.schema';

/**
 * Validador para `ConfigModule.forRoot({ validate })`.
 * Lanza error temprano con mensaje claro si faltan o son inválidas las envs.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`❌ Variables de entorno inválidas:\n${issues}`);
  }
  return result.data;
}
