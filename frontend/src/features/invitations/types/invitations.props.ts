import type { FormEvent } from 'react';
import type { PasswordRule } from '@/shared';
import type { AcceptErrors, InvitationLookup } from './invitations.types';

/** Props of the accept-invitation form. */
export interface AcceptInvitationFormProps {
  invitation: InvitationLookup;
  name: string;
  errors: AcceptErrors;
  formError: string | null;
  rules: PasswordRule[];
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}