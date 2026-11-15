import { CompanyStatus, ThemePreset, type Company, type User } from '@prisma/client';
import type { AppConfig } from '../config';
import { THEME_ACCENTS, VERIFICATION_TTL_HOURS } from '../constants';
import {
  companyFolder,
  createUploadSignature,
  generateRefreshToken,
  hashPassword,
  hashToken,
  isCloudinaryConfigured,
  isOwnImage,
  type UploadSignature,
} from '../helpers';
import type { CompanyRepositoryContract, UserRepositoryContract, VerificationTokenRepositoryContract } from '../types';
import { badRequest, checkAccentColor, checkPasswordPolicy, checkSlug, companyUrl, conflict, serviceUnavailable } from '../utils';
import type { AuditService } from './audit.service';
import type { EmailSender } from './email.service';

/** What anyone may see of a company before signing in (its sign-in page branding). */
export interface CompanyPublicResponse {
  name: string;
  slug: string;
  logoUrl: string | null;
  themePreset: ThemePreset;
  /** The accent in use: the preset's, or the custom colour. */
  accentColor: string;
  showPoweredBy: boolean;
}

/** What the company head sees of their company. */
export interface CompanyResponse extends CompanyPublicResponse {
  id: number;
  status: CompanyStatus;
  meetingLanguage: Company['meetingLanguage'];
  timeZone: string;
  workingDays: number[];
}

/** Input of the public company registration. */
export interface SignupInput {
  companyName: string;
  slug: string;
  name: string;
  jobTitle?: string;
  email: string;
  password: string;
}

/** Brand settings the company head can change. */
export interface BrandInput {
  name: string;
  themePreset: ThemePreset;
  accentColor?: string;
}

/** Returns the accent colour a company's theme resolves to. */
export function resolveAccent(company: Pick<Company, 'themePreset' | 'accentColor'>): string {
  if (company.themePreset === ThemePreset.Custom && company.accentColor) return company.accentColor;
  return THEME_ACCENTS[company.themePreset === ThemePreset.Custom ? 'Forest' : company.themePreset];
}

/** Maps a company to its public (pre-sign-in) fields. */
export function toCompanyPublic(company: Company): CompanyPublicResponse {
  return {
    name: company.name,
    slug: company.slug,
    logoUrl: company.logoUrl,
    themePreset: company.themePreset,
    accentColor: resolveAccent(company),
    showPoweredBy: company.showPoweredBy,
  };
}

/** Maps a company to the fields its head sees. */
export function toCompanyResponse(company: Company): CompanyResponse {
  return {
    ...toCompanyPublic(company),
    id: company.id,
    status: company.status,
    meetingLanguage: company.meetingLanguage,
    timeZone: company.timeZone,
    workingDays: company.workingDays,
  };
}

/** Dependencies of the company service. */
export interface CompanyServiceDeps {
  companies: CompanyRepositoryContract;
  users: UserRepositoryContract;
  verificationTokens: VerificationTokenRepositoryContract;
  audit: AuditService;
  email: EmailSender;
  config: Pick<AppConfig, 'appBaseUrl' | 'cloudinary'>;
}

/** Business rules of a company account: registration, email verification and branding. */
export class CompanyService {
  constructor(private readonly deps: CompanyServiceDeps) {}

  /** Says whether a company address can be taken, and why not when it cannot. */
  async checkSlugAvailability(slugInput: string): Promise<{ available: boolean; reason?: string }> {
    const slug = slugInput.trim().toLowerCase();
    const problem = checkSlug(slug);
    if (problem) return { available: false, reason: problem };
    if (await this.deps.companies.findBySlug(slug)) return { available: false, reason: 'That address is taken' };
    return { available: true };
  }

  /** Registers a company with its head (inactive until the email is verified) and sends the verification link. */
  async signup(input: SignupInput): Promise<{ slug: string; email: string }> {
    const slug = input.slug.trim().toLowerCase();
    const availability = await this.checkSlugAvailability(slug);
    if (!availability.available) {
      throw availability.reason === 'That address is taken' ? conflict(availability.reason) : badRequest(`Company address: ${availability.reason}`);
    }
    const problems = checkPasswordPolicy(input.password);
    if (problems.length > 0) throw badRequest(problems);

    const { company, head } = await this.deps.companies.createWithHead({
      company: { name: input.companyName.trim(), slug },
      head: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        passwordHash: await hashPassword(input.password),
        jobTitle: input.jobTitle?.trim() || null,
      },
    });
    await this.deps.audit.log({ userId: head.id, companyId: company.id, action: 'CompanyRegistered', entityType: 'Company', entityId: company.id });
    await this.sendVerification(company, head);
    return { slug: company.slug, email: head.email };
  }

  /** Confirms a verification link: marks the email verified and activates the company. Returns the company address. */
  async verifyEmail(token: string): Promise<{ slug: string }> {
    const stored = await this.deps.verificationTokens.findByHash(hashToken(token));
    if (!stored || stored.usedAt || stored.expiresAt <= new Date() || stored.user.companyId === null) {
      throw badRequest('This link is invalid or has expired. Ask for a new one from the sign-in page.');
    }
    await this.deps.verificationTokens.consume(stored.id, stored.userId, stored.user.companyId);
    const company = await this.deps.companies.findById(stored.user.companyId);
    await this.deps.audit.log({ userId: stored.userId, companyId: stored.user.companyId, action: 'EmailVerified', entityType: 'User', entityId: stored.userId });
    return { slug: company!.slug };
  }

  /** Sends a new verification link when the address belongs to an unverified user; says nothing either way. */
  async resendVerification(company: Company, emailInput: string): Promise<void> {
    const user = await this.deps.users.findByEmail(company.id, emailInput.trim().toLowerCase());
    if (!user || user.emailVerifiedAt) return;
    await this.deps.verificationTokens.invalidateForUser(user.id);
    await this.sendVerification(company, user);
  }

  /** Changes the company's name and theme; a custom accent must be readable on the page. */
  async updateBrand(company: Company, userId: number, input: BrandInput): Promise<CompanyResponse> {
    let accentColor: string | null = null;
    if (input.themePreset === ThemePreset.Custom) {
      if (!input.accentColor) throw badRequest('Choose an accent colour for a custom theme');
      const problem = checkAccentColor(input.accentColor);
      if (problem) throw badRequest(problem);
      accentColor = input.accentColor.toLowerCase();
    }
    const updated = await this.deps.companies.update(company.id, { name: input.name.trim(), themePreset: input.themePreset, accentColor });
    await this.deps.audit.log({ userId, companyId: company.id, action: 'BrandUpdated', entityType: 'Company', entityId: company.id });
    return toCompanyResponse(updated);
  }

  /** Returns a short-lived signature the browser uses to upload a logo straight to the image service. */
  createLogoUploadSignature(company: Company): UploadSignature {
    const cloudinary = this.deps.config.cloudinary;
    if (!isCloudinaryConfigured(cloudinary)) throw serviceUnavailable('Image uploads are not set up yet');
    return createUploadSignature(cloudinary, companyFolder(company.slug, 'logo'));
  }

  /** Saves an uploaded logo after checking it sits in this company's own folder. */
  async setLogo(company: Company, userId: number, input: { publicId: string; url: string }): Promise<CompanyResponse> {
    const cloudinary = this.deps.config.cloudinary;
    if (!isCloudinaryConfigured(cloudinary)) throw serviceUnavailable('Image uploads are not set up yet');
    if (!isOwnImage(cloudinary, companyFolder(company.slug, 'logo'), input.publicId, input.url)) {
      throw badRequest('That image does not belong to this company');
    }
    const updated = await this.deps.companies.update(company.id, { logoPublicId: input.publicId, logoUrl: input.url });
    await this.deps.audit.log({ userId, companyId: company.id, action: 'LogoUpdated', entityType: 'Company', entityId: company.id });
    return toCompanyResponse(updated);
  }

  /** Creates a verification token and emails its single-use link (the link opens the app; it carries no data). */
  private async sendVerification(company: Company, user: User): Promise<void> {
    const token = generateRefreshToken();
    await this.deps.verificationTokens.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_HOURS * 3_600_000),
    });
    await this.deps.email.send({
      to: user.email,
      subject: `Verify your email for ${company.name}`,
      heading: 'Verify your email',
      body: `Open this link to activate ${company.name} on Quorum. It works once and expires in ${VERIFICATION_TTL_HOURS} hours.`,
      link: { url: companyUrl(this.deps.config.appBaseUrl, company.slug, `/verify-email?token=${token}`), label: 'Verify email' },
      type: 'EmailVerification',
      userId: user.id,
      companyId: company.id,
    });
  }
}
