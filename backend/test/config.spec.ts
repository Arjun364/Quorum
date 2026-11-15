import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';

const valid = { DATABASE_URL: 'postgresql://x', JWT_ACCESS_SECRET: 'x'.repeat(32) };

describe('loadConfig', () => {
  it('applies safe defaults', () => {
    const config = loadConfig(valid);
    expect(config.port).toBe(3000);
    expect(config.jwtAccessTtl).toBe('15m');
    expect(config.refreshTtlDays).toBe(30);
    expect(config.cookieSecure).toBe(false);
  });

  it('fails fast when required settings are missing', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL, JWT_ACCESS_SECRET/);
  });

  it('rejects a short signing secret', () => {
    expect(() => loadConfig({ ...valid, JWT_ACCESS_SECRET: 'short' })).toThrow(/at least 32/);
  });

  it('normalizes the bootstrap email', () => {
    expect(loadConfig({ ...valid, BOOTSTRAP_OWNER_EMAIL: ' Owner@Example.COM ' }).bootstrapOwnerEmail).toBe('owner@example.com');
  });
});
