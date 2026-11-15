import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, Ref } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/** Props of the shared button. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Disables the button and shows a spinner while a request is running. */
  loading?: boolean;
}

/** Props of the shared labelled text input. */
export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  /** Element placed inside the right edge of the input (for example a show/hide toggle). */
  trailing?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

/** Props of the shared password input (type and trailing toggle are managed internally). */
export type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing'>;

export type AlertTone = 'error' | 'info';

/** Props of the shared inline message. */
export interface AlertProps {
  tone?: AlertTone;
  children: ReactNode;
}

/** Props of the product logo. */
export interface LogoProps {
  className?: string;
}
