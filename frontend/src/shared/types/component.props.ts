import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, Ref } from 'react';
import type { PasswordRule } from './api.types';

/** Props of the checklist of password requirements. */
export interface PasswordRequirementsProps {
  rules: PasswordRule[];
}

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

/** Props of the modal dialog. */
export interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

/** Props of the product logo. */
export type IconName = 'home' | 'building' | 'palette' | 'logout' | 'check' | 'arrow' | 'users' | 'mail' | 'clock';

/** Props of an icon: one of the named line icons, sized by `className`. */
export interface IconProps {
  name: IconName;
  className?: string;
}

/** Props of the logo. */
export interface LogoProps {
  className?: string;
}

/** Props of the dot-grid canvas: dot spacing in px and a 0-1.5 strength for the wave and the pointer reaction. */
export interface DotWaveProps {
  spacing?: number;
  intensity?: number;
  className?: string;
}

/** Props of a number that rolls up to its value. */
export interface CountUpProps {
  value: number;
  suffix?: string;
  durationMs?: number;
  className?: string;
}

/** Props of a headline whose words rise into place one after another. */
export interface WordRevealProps {
  text: string;
  as?: 'h1' | 'h2' | 'p';
  className?: string;
  /** Start the rise when the element scrolls into view instead of on load. */
  onView?: boolean;
  /** Delay before the first word, in milliseconds. */
  delayMs?: number;
}
