import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { AUTH_MESSAGES } from '../constants';
import type { ChangePasswordFieldErrors, ChangePasswordPayload } from '../types';
import { evaluatePassword } from '@/shared';
import { getChangePasswordErrors } from '../utils';
import { startSession } from './sessionStore';
import { useSession } from './useSession';
import { useSignOut } from './useSignOut';

/** Owns the change-password screen: live requirement checks, validation, the mutation and the redirect afterwards. */
export function useChangePassword() {
  // Route and session dependencies.
  const navigate = useNavigate();
  const { user } = useSession();
  const { signOut } = useSignOut();
  const isForced = user?.mustChangePassword ?? false;

  // Form state.
  const currentRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<ChangePasswordFieldErrors>({});
  const [formErrors, setFormErrors] = useState<string[] | null>(null);

  // Derived requirement checklist.
  const rules = evaluatePassword(newPassword);

  // Change-password mutation that uses that state.
  const changeMutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authApi.changePassword(payload),
    onSuccess: (session) => {
      startSession(session);
      navigate('/', { replace: true });
    },
    onError: (error) => {
      setFormErrors(getChangePasswordErrors(error));
      currentRef.current?.focus();
    },
  });

  /** Validates the three fields, focuses the first invalid one, and otherwise saves the new password. */
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const current = String(data.get('current') ?? '');
    const next = String(data.get('next') ?? '');
    const confirm = String(data.get('confirm') ?? '');

    const found: ChangePasswordFieldErrors = {};
    if (!current) found.current = AUTH_MESSAGES.currentRequired;
    if (rules.some((rule) => !rule.met)) found.next = AUTH_MESSAGES.newNotStrong;
    if (next !== confirm) found.confirm = AUTH_MESSAGES.confirmMismatch;
    setErrors(found);
    setFormErrors(null);
    if (found.current) return currentRef.current?.focus();
    if (found.next) return nextRef.current?.focus();
    if (found.confirm) return confirmRef.current?.focus();

    changeMutation.mutate({ currentPassword: current, newPassword: next });
  };

  return {
    currentRef,
    nextRef,
    confirmRef,
    errors,
    formErrors,
    rules,
    isForced,
    isSubmitting: changeMutation.isPending,
    setNewPassword,
    handleSubmit,
    signOut,
  };
}
