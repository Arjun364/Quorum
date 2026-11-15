import { startSession } from '@/features/auth';
import { ApiError, evaluatePassword } from '@/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invitationsApi } from '../api';
import type { AcceptErrors } from '../types';

/** Owns the accept-invitation page: looks the invitation up, validates the name and password, creates the account and signs in. */
export function useAcceptInvitation() {
  // Route dependencies.
  const navigate = useNavigate();
  const token = useSearchParams()[0].get('token') ?? '';

  // The invitation behind the link.
  const lookup = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => invitationsApi.lookup(token),
    enabled: token.length > 0,
    retry: false,
  });

  // Form state.
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AcceptErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const rules = evaluatePassword(password);
  const displayName = nameTouched ? name : (lookup.data?.name ?? '');

  // Accept mutation that uses that state.
  const acceptMutation = useMutation({
    mutationFn: () => invitationsApi.accept({ token, name: displayName.trim(), password }),
    onSuccess: (session) => {
      startSession(session);
      navigate('/', { replace: true });
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? (error.errors?.join(' ') ?? error.message) : 'We could not reach the server. Check your connection and try again.'),
  });

  /** Validates the form and creates the account. */
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const found: AcceptErrors = {};
    if (!displayName.trim()) found.name = 'Enter your name.';
    if (rules.some((rule) => !rule.met)) found.password = 'Your password does not meet every requirement yet.';
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;
    acceptMutation.mutate();
  };

  return {
    invitation: lookup.data ?? null,
    isLoading: token.length > 0 && lookup.isPending,
    isInvalid: token.length === 0 || lookup.isError,
    name: displayName,
    errors,
    formError,
    rules,
    isSubmitting: acceptMutation.isPending,
    handleNameChange: (value: string) => {
      setNameTouched(true);
      setName(value);
    },
    handlePasswordChange: setPassword,
    handleSubmit,
  };
}