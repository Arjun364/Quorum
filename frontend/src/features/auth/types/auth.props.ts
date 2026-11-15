import type { FormEvent, RefObject } from 'react';
import type { ChangePasswordFieldErrors, LoginFieldErrors, PasswordRule } from './auth.types';

/** Props of the sign-in form. */
export interface LoginFormProps {
  emailRef: RefObject<HTMLInputElement | null>;
  passwordRef: RefObject<HTMLInputElement | null>;
  errors: LoginFieldErrors;
  formError: string | null;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Props of the checklist of password requirements. */
export interface PasswordRequirementsProps {
  rules: PasswordRule[];
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
