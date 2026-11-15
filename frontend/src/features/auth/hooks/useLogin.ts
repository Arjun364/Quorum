import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { AUTH_MESSAGES } from '../constants';
import type { LoginCredentials, LoginFieldErrors } from '../types';
import { getLoginErrorMessage } from '../utils';
import { startSession } from './sessionStore';

/** Owns the sign-in screen: field validation, the login mutation, focus handling and the redirect afterwards. */
export function useLogin() {
  // Route dependencies.
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  // Form state.
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Login mutation that uses that state.
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (session) => {
      startSession(session);
      navigate(redirectTo, { replace: true });
    },
    onError: (error) => {
      setFormError(getLoginErrorMessage(error));
      passwordRef.current?.focus();
    },
  });

  /** Validates the form, focuses the first invalid field, and otherwise signs the user in. */
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    const found: LoginFieldErrors = {};
    if (!email) found.email = AUTH_MESSAGES.emailRequired;
    if (!password) found.password = AUTH_MESSAGES.passwordRequired;
    setErrors(found);
    setFormError(null);
    if (found.email) return emailRef.current?.focus();
    if (found.password) return passwordRef.current?.focus();

    loginMutation.mutate({ email, password });
  };

  return {
    emailRef,
    passwordRef,
    errors,
    formError,
    isSubmitting: loginMutation.isPending,
    handleSubmit,
  };
}
