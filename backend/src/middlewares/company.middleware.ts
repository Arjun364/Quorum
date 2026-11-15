import type { RequestHandler } from 'express';
import type { Company } from '@prisma/client';
import { notFound, parseCompanySlug, unauthorized, forbidden } from '../utils';
import type { SystemRole } from '@prisma/client';
import type { CompanyRepositoryContract } from '../types';

/**
 * Resolves the company from the request's address ("acme.quorum.app" gives the company with slug "acme") and
 * stores it on the request. The platform's own address gives null. An unknown subdomain is a 404.
 */
export function createResolveCompany(deps: { companies: CompanyRepositoryContract; rootHost: string }): RequestHandler {
  return async (req, _res, next) => {
    const slug = parseCompanySlug(req.hostname, deps.rootHost);
    if (slug === null) {
      req.company = null;
      next();
      return;
    }
    const company = await deps.companies.findBySlug(slug);
    if (!company) throw notFound('There is no company at this address');
    req.company = company;
    next();
  };
}

/** Requires the request to come in on a company's address (not the platform's) and returns that company. */
export function requireCompany(req: { company?: Company | null }): Company {
  if (!req.company) throw notFound('Open this from your company’s own address');
  return req.company;
}

/** Allows only users with one of the given roles; the user must already be authenticated. */
export function requireRoles(...roles: SystemRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) throw unauthorized('Sign in first');
    if (!roles.includes(req.user.systemRole)) throw forbidden('You do not have permission to do that');
    next();
  };
}