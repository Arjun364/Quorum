export type ThemePreset = 'Forest' | 'Ocean' | 'Graphite' | 'Custom';

/** What anyone may see of a company before signing in. */
export interface CompanyPublic {
  name: string;
  slug: string;
  logoUrl: string | null;
  themePreset: ThemePreset;
  /** The accent in use: the preset's, or the custom colour. */
  accentColor: string;
  showPoweredBy: boolean;
}

/** The company as its head sees it. */
export interface Company extends CompanyPublic {
  id: number;
  status: 'PendingVerification' | 'Active' | 'Disabled';
  meetingLanguage: 'Malayalam' | 'English' | 'Mixed';
  timeZone: string;
  workingDays: number[];
}

/** Body of the public company registration. */
export interface SignupPayload {
  companyName: string;
  slug: string;
  name: string;
  jobTitle?: string;
  email: string;
  password: string;
}

/** Answer of a successful registration. */
export interface SignupResult {
  slug: string;
  email: string;
}

/** Whether a company address can be taken, and why not. */
export interface SlugAvailability {
  available: boolean;
  reason?: string;
}

/** Brand settings the company head can change. */
export interface BrandPayload {
  name: string;
  themePreset: ThemePreset;
  accentColor?: string;
}

/** Signed permission to upload one image straight to the image service. */
export interface UploadSignature {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/** The image the browser just uploaded, as the image service reports it. */
export interface LogoPayload {
  publicId: string;
  url: string;
}

/** Fields of the signup form. */
export interface SignupValues {
  companyName: string;
  slug: string;
  name: string;
  jobTitle: string;
  email: string;
  password: string;
}

export type SignupErrors = Partial<Record<keyof SignupValues, string>>;

/** State of the live company-address check. */
export type SlugStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'unavailable'; reason: string };