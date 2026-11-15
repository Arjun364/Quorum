import type { FormEvent, RefObject } from 'react';
import type { PasswordRule } from '@/shared';
import type { ChangePasswordFieldErrors, LoginFieldErrors } from './auth.types';

/** Props of the sign-in form. */
export interface LoginFormProps {
  emailRef: RefObject<HTMLInputElement | null>;
  passwordRef: RefObject<HTMLInputElement | null>;
  errors: LoginFieldErrors;
  formError: string | null;
  isSubmitting: boolean;
  /** True when the account exists but its email is not verified yet. */
  needsVerification: boolean;
  resendStatus: 'idle' | 'sending' | 'sent';
  onResend: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Props of the company brand panel of the sign-in page. */
export interface LoginHeroProps {
  companyName: string;
  logoUrl: string | null;
  showPoweredBy: boolean;
}

/** Props of the change-password form. */
export interface ChangePasswordFormProps {
  currentRef: RefObject<HTMLInputElement | null>;
  nextRef: RefObject<HTMLInputElement | null>;
  confirmRef: RefObject<HTMLInputElement | null>;
  errors: ChangePasswordFieldErrors;
  formErrors: string[] | null;
  rules: PasswordRule[];
  isForced: boolean;
  isSubmitting: boolean;
  onNewPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}