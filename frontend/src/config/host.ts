import { ROOT_HOST } from './app.config';

/** Reads the company address from a host name ("acme.localhost" gives "acme"); null on the platform's own address. */
export function readCompanySlug(hostname: string, rootHost: string = ROOT_HOST): string | null {
  const name = hostname.toLowerCase();
  if (name === rootHost || !name.endsWith(`.${rootHost}`)) return null;
  const label = name.slice(0, -(rootHost.length + 1));
  return label.includes('.') ? null : label;
}

/** The company address of the page being viewed, or null on the platform's own address. */
export function currentCompanySlug(): string | null {
  return readCompanySlug(window.location.hostname);
}

/** Builds an absolute URL on a company's address, keeping the current protocol and port. */
export function companyAddress(slug: string, path = '/'): string {
  const { protocol, hostname, port } = window.location;
  const root = readCompanySlug(hostname) === null ? hostname : hostname.split('.').slice(1).join('.');
  return `${protocol}//${slug}.${root}${port ? `:${port}` : ''}${path}`;
}

/** Builds an absolute URL on the platform's own address (the public website). */
export function platformAddress(path = '/'): string {
  const { protocol, hostname, port } = window.location;
  const root = readCompanySlug(hostname) === null ? hostname : hostname.split('.').slice(1).join('.');
  return `${protocol}//${root}${port ? `:${port}` : ''}${path}`;
}