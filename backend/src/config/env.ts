/** Fails fast at startup when required settings are missing or unsafe. */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const missing: string[] = [];
  for (const key of ['DATABASE_URL', 'JWT_ACCESS_SECRET']) {
    if (typeof config[key] !== 'string' || (config[key] as string).trim() === '') {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if ((config.JWT_ACCESS_SECRET as string).length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
  }
  return config;
}
