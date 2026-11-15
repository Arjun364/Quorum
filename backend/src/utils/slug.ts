import { RESERVED_SLUGS, SLUG_MAX_LENGTH, SLUG_MIN_LENGTH } from '../constants';

/** Returns why a company address is not acceptable, or null when it is (availability is checked separately). */
export function checkSlug(slug: string): string | null {
  if (slug.length < SLUG_MIN_LENGTH || slug.length > SLUG_MAX_LENGTH) {
    return `Use ${SLUG_MIN_LENGTH} to ${SLUG_MAX_LENGTH} characters`;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return 'Use lowercase letters, digits and single hyphens between them';
  }
  if (RESERVED_SLUGS.has(slug)) {
    return 'That address is reserved';
  }
  return null;
}

/**
 * Reads the company address from a request's host name: "acme.quorum.app" with root "quorum.app" gives "acme".
 * The root host itself, a reserved or nested subdomain, and any foreign host give null.
 */
export function parseCompanySlug(host: string | undefined, rootHost: string): string | null {
  if (!host) return null;
  const name = host.trim().toLowerCase().replace(/:\d+$/, '');
  const root = rootHost.toLowerCase();
  if (name === root || !name.endsWith(`.${root}`)) return null;
  const label = name.slice(0, -(root.length + 1));
  if (label.includes('.') || checkSlug(label) !== null) return null;
  return label;
}

/** Builds an absolute URL on a company's own address from the app's base URL ("http://localhost:5173" gives "http://acme.localhost:5173/path"). */
export function companyUrl(appBaseUrl: string, slug: string, path: string): string {
  const base = new URL(appBaseUrl);
  return `${base.protocol}//${slug}.${base.host}${path.startsWith('/') ? path : `/${path}`}`;
}
