import dotenv from 'dotenv';
import path from 'node:path';

/** Typed application settings, read once at startup. */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  appBaseUrl: string;
  jwtAccessSecret: string;
  /** Access-token lifetime in the form accepted by jsonwebtoken (for example "15m"). */
  jwtAccessTtl: string;
  refreshTtlDays: number;
  cookieSecure: boolean;
  /** True when the API runs behind a reverse proxy (Vercel rewrite, nginx) so client IPs are read correctly. */
  trustProxy: boolean;
  bootstrapOwnerEmail?: string;
  bootstrapOwnerPassword?: string;
  smtp: { host: string; port: number; user?: string; pass?: string; secure: boolean };
  mailFrom: string;
}

/** Loads `.env` from the backend folder or the repository root; real environment variables always win. */
export function loadEnvFile(): void {
  dotenv.config({
    path: [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../.env')],
    quiet: true,
  });
}

const requiredKeys = ['DATABASE_URL', 'JWT_ACCESS_SECRET'] as const;

/** Validates the environment and returns typed settings; throws with a clear message when something is missing or unsafe. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const missing = requiredKeys.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if ((env.JWT_ACCESS_SECRET as string).length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
  }
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: Number(env.PORT ?? 3000),
    databaseUrl: env.DATABASE_URL as string,
    appBaseUrl: env.APP_BASE_URL ?? 'http://localhost:5173',
    jwtAccessSecret: env.JWT_ACCESS_SECRET as string,
    jwtAccessTtl: env.JWT_ACCESS_TTL ?? '15m',
    refreshTtlDays: Number(env.REFRESH_TTL_DAYS ?? 30),
    cookieSecure: env.COOKIE_SECURE === 'true',
    trustProxy: env.TRUST_PROXY === 'true',
    bootstrapOwnerEmail: env.BOOTSTRAP_OWNER_EMAIL?.trim().toLowerCase() || undefined,
    bootstrapOwnerPassword: env.BOOTSTRAP_OWNER_PASSWORD || undefined,
    smtp: {
      host: env.SMTP_HOST ?? 'localhost',
      port: Number(env.SMTP_PORT ?? 1025),
      user: env.SMTP_USER || undefined,
      pass: env.SMTP_PASS || undefined,
      secure: env.SMTP_SECURE === 'true',
    },
    mailFrom: env.MAIL_FROM ?? 'Quorum <no-reply@localhost>',
  };
}
