import type { RequestHandler } from 'express';
import { requireCompany } from '../middlewares';
import type { CompanyService } from '../services';
import { toCompanyPublic, toCompanyResponse } from '../services';
import type { AuthService } from '../services';
import { notFound } from '../utils';
import type { BrandBody, LogoBody, SignupBody } from '../validators';

/** Builds the company controller: registration, public branding, and the company head's brand settings. */
export function createCompanyController(company: CompanyService, auth: Pick<AuthService, 'me'>) {
  /** POST /companies/signup: registers a company and its head, then asks them to verify their email. */
  const signup: RequestHandler = async (req, res) => {
    const result = await company.signup(req.body as SignupBody);
    res.status(201).json(result);
  };

  /** GET /companies/slug-available?slug= */
  const slugAvailable: RequestHandler = async (req, res) => {
    res.status(200).json(await company.checkSlugAvailability(String((req.query as { slug: string }).slug)));
  };

  /** GET /company/public: the branding shown on this address's sign-in page. */
  const publicInfo: RequestHandler = (req, res) => {
    if (!req.company) throw notFound('There is no company at this address');
    res.status(200).json(toCompanyPublic(req.company));
  };

  /** GET /company: the company as its head sees it. */
  const current: RequestHandler = (req, res) => {
    res.status(200).json(toCompanyResponse(requireCompany(req)));
  };

  /** PUT /company/brand */
  const updateBrand: RequestHandler = async (req, res) => {
    res.status(200).json(await company.updateBrand(requireCompany(req), req.user!.id, req.body as BrandBody));
  };

  /** POST /company/logo/signature */
  const logoSignature: RequestHandler = (req, res) => {
    res.status(200).json(company.createLogoUploadSignature(requireCompany(req)));
  };

  /** PUT /company/logo */
  const setLogo: RequestHandler = async (req, res) => {
    res.status(200).json(await company.setLogo(requireCompany(req), req.user!.id, req.body as LogoBody));
  };

  void auth;
  return { signup, slugAvailable, publicInfo, current, updateBrand, logoSignature, setLogo };
}

export type CompanyController = ReturnType<typeof createCompanyController>;