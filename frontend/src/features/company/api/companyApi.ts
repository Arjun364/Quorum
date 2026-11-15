import { apiFetch } from '@/shared';
import type {
  BrandPayload,
  Company,
  CompanyPublic,
  LogoPayload,
  SignupPayload,
  SignupResult,
  SlugAvailability,
  UploadSignature,
} from '../types';

export const companyApi = {
  /** Fetches the branding shown on the current address's sign-in page. */
  publicInfo(): Promise<CompanyPublic> {
    return apiFetch<CompanyPublic>('/company/public', { auth: false });
  },

  /** Asks whether a company address can be taken. */
  slugAvailable(slug: string): Promise<SlugAvailability> {
    return apiFetch<SlugAvailability>(`/companies/slug-available?slug=${encodeURIComponent(slug)}`, { auth: false });
  },

  /** Registers a company and its head; the head must then verify their email. */
  signup(payload: SignupPayload): Promise<SignupResult> {
    return apiFetch<SignupResult>('/companies/signup', { method: 'POST', body: payload, auth: false });
  },

  /** Fetches the company as its head sees it. */
  current(): Promise<Company> {
    return apiFetch<Company>('/company');
  },

  /** Saves the company's name and theme. */
  updateBrand(payload: BrandPayload): Promise<Company> {
    return apiFetch<Company>('/company/brand', { method: 'PUT', body: payload });
  },

  /** Gets a short-lived signature for uploading a logo straight to the image service. */
  logoSignature(): Promise<UploadSignature> {
    return apiFetch<UploadSignature>('/company/logo/signature', { method: 'POST' });
  },

  /** Saves the logo the browser just uploaded (the server checks it sits in the company's own folder). */
  setLogo(payload: LogoPayload): Promise<Company> {
    return apiFetch<Company>('/company/logo', { method: 'PUT', body: payload });
  },

  /** Uploads one image file straight to the image service with the server's signature; returns where it now lives. */
  async uploadToImageService(signature: UploadSignature, file: File): Promise<LogoPayload> {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', signature.apiKey);
    form.append('timestamp', String(signature.timestamp));
    form.append('folder', signature.folder);
    form.append('signature', signature.signature);
    const response = await fetch(signature.uploadUrl, { method: 'POST', body: form });
    if (!response.ok) throw new Error(`Image upload failed (${response.status})`);
    const data = (await response.json()) as { public_id: string; secure_url: string };
    return { publicId: data.public_id, url: data.secure_url };
  },
};