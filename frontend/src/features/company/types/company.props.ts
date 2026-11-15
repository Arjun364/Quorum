import type { FormEvent } from 'react';
import type { SignupErrors, SignupValues, SlugStatus, ThemePreset } from './company.types';

/** Props of the company registration form. */
export interface SignupFormProps {
  values: SignupValues;
  errors: SignupErrors;
  formError: string | null;
  slugStatus: SlugStatus;
  rootHost: string;
  passwordRules: { label: string; met: boolean }[];
  isSubmitting: boolean;
  onChange: (field: keyof SignupValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Props of the company mark (logo or initials). */
export interface BrandMarkProps {
  name: string;
  logoUrl: string | null;
  className?: string;
}

/** Props of the theme preset picker. */
export interface ThemePickerProps {
  preset: ThemePreset;
  customColor: string;
  customProblem: string | null;
  onPreset: (preset: ThemePreset) => void;
  onCustomColor: (value: string) => void;
}

/** Props of the logo uploader. */
export interface LogoUploaderProps {
  name: string;
  logoUrl: string | null;
  isUploading: boolean;
  error: string | null;
  onFile: (file: File) => void;
}

/** Props of the live brand preview. */
export interface BrandPreviewProps {
  name: string;
  logoUrl: string | null;
  accent: string;
}