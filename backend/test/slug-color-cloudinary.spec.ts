import { describe, expect, it } from 'vitest';
import { companyFolder, createUploadSignature, isOwnImage } from '../src/helpers';
import { checkAccentColor, checkSlug, companyUrl, contrastRatio, parseCompanySlug } from '../src/utils';

describe('checkSlug', () => {
  it.each(['acme', 'northwind-software', 'a1b2c3'])('accepts %s', (s) => expect(checkSlug(s)).toBeNull());
  it.each(['ab', 'Acme', 'ac me', '-acme', 'acme-', 'ac--me', 'a'.repeat(33)])('rejects %s', (s) => expect(checkSlug(s)).not.toBeNull());
  it.each(['www', 'admin', 'api', 'support'])('rejects the reserved name %s', (s) => expect(checkSlug(s)).toMatch(/reserved/));
});

describe('parseCompanySlug', () => {
  it('reads the subdomain of the root host, ignoring the port and the case', () => {
    expect(parseCompanySlug('acme.quorum.app', 'quorum.app')).toBe('acme');
    expect(parseCompanySlug('ACME.quorum.app:443', 'quorum.app')).toBe('acme');
    expect(parseCompanySlug('acme.localhost:5173', 'localhost')).toBe('acme');
  });
  it('gives null for the root host, foreign hosts, nested and reserved subdomains', () => {
    for (const host of ['quorum.app', 'acme.other.com', 'a.b.quorum.app', 'www.quorum.app', 'admin.quorum.app', undefined]) {
      expect(parseCompanySlug(host, 'quorum.app'), String(host)).toBeNull();
    }
  });
  it('does not treat a lookalike suffix as a subdomain', () => {
    expect(parseCompanySlug('acme.evilquorum.app', 'quorum.app')).toBeNull();
  });
});

describe('companyUrl', () => {
  it('puts the company in front of the app host and keeps the port', () => {
    expect(companyUrl('http://localhost:5173', 'acme', '/invite?token=x')).toBe('http://acme.localhost:5173/invite?token=x');
    expect(companyUrl('https://quorum.app', 'acme', 'login')).toBe('https://acme.quorum.app/login');
  });
});

describe('contrast and accent colours', () => {
  it('computes the WCAG ratio', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
    expect(contrastRatio('nope', '#fff')).toBe(0);
  });
  it('accepts the three presets and a dark custom colour', () => {
    for (const c of ['#1f3a34', '#1d4e89', '#2b2f36', '#7a1f3d']) expect(checkAccentColor(c), c).toBeNull();
  });
  it('rejects colours that are malformed or too light to see on the page', () => {
    for (const c of ['red', '#fff', '#f2d94e', '#ffffff']) expect(checkAccentColor(c), c).not.toBeNull();
  });
});

describe('cloudinary helpers', () => {
  const config = { cloudName: 'democloud', apiKey: '123456789012345', apiSecret: 'secret' };

  it('signs an upload with SHA-1 over the sorted parameters plus the secret, and never exposes the secret', () => {
    const sig = createUploadSignature(config, 'quorum/acme/logo', new Date(1_700_000_000_000));
    expect(sig.timestamp).toBe(1_700_000_000);
    expect(sig.signature).toMatch(/^[0-9a-f]{40}$/);
    expect(JSON.stringify(sig)).not.toContain('secret');
    expect(sig.uploadUrl).toBe('https://api.cloudinary.com/v1_1/democloud/image/upload');
  });
  it('keeps each company in its own folder', () => {
    expect(companyFolder('acme', 'logo')).toBe('quorum/acme/logo');
  });
  it('accepts only images inside the company folder and the right account', () => {
    const folder = companyFolder('acme', 'logo');
    const url = 'https://res.cloudinary.com/democloud/image/upload/v1/quorum/acme/logo/abc.png';
    expect(isOwnImage(config, folder, 'quorum/acme/logo/abc', url)).toBe(true);
    expect(isOwnImage(config, folder, 'quorum/other/logo/abc', url.replace('acme', 'other'))).toBe(false);
    expect(isOwnImage(config, folder, 'quorum/acme/logo/../../other/x', url)).toBe(false);
    expect(isOwnImage(config, folder, 'quorum/acme/logo/abc', url.replace('democloud', 'evilcloud'))).toBe(false);
  });
});