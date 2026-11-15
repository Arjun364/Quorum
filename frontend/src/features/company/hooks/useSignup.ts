import { evaluatePassword } from '@/shared';
import { ROOT_HOST } from '@/config';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyApi } from '../api';
import { COMPANY_MESSAGES } from '../constants';
import type { SignupErrors, SignupValues } from '../types';
import { getSignupErrorMessage, isValidSlugFormat, suggestSlug } from '../utils';
import { useSlugCheck } from './useSlugCheck';

const EMPTY: SignupValues = { companyName: '', slug: '', name: '', jobTitle: '', email: '', password: '' };

/** Owns the company registration screen: form state, address suggestion and check, validation, and the signup mutation. */
export function useSignup() {
  // Route dependency.
  const navigate = useNavigate();

  // Form state; the address follows the company name until the user edits it themselves.
  const [values, setValues] = useState<SignupValues>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Live checks that use that state.
  const slugStatus = useSlugCheck(values.slug);
  const passwordRules = evaluatePassword(values.password);

  // Signup mutation.
  const signupMutation = useMutation({
    mutationFn: companyApi.signup,
    onSuccess: (result) => navigate('/start/check-email', { state: { email: result.email, slug: result.slug } }),
    onError: (error) => {
      const { field, message } = getSignupErrorMessage(error);
      if (field) setErrors((current) => ({ ...current, [field]: message }));
      else setFormError(message);
    },
  });

  /** Updates one field; typing the company name suggests an address until the address is edited by hand. */
  const handleChange = (field: keyof SignupValues, value: string): void => {
    setValues((current) => {
      const next = { ...current, [field]: field === 'slug' ? value.toLowerCase().replace(/[^a-z0-9-]/g, '') : value };
      if (field === 'companyName' && !slugTouched) next.slug = suggestSlug(value);
      return next;
    });
    if (field === 'slug') setSlugTouched(true);
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  /** Validates the form, focuses the first problem, and otherwise registers the company. */
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const form = event.currentTarget;
    const found: SignupErrors = {};
    if (!values.companyName.trim()) found.companyName = COMPANY_MESSAGES.companyNameRequired;
    if (!values.slug) found.slug = COMPANY_MESSAGES.slugRequired;
    else if (!isValidSlugFormat(values.slug)) found.slug = COMPANY_MESSAGES.slugFormat;
    else if (slugStatus.state === 'unavailable') found.slug = slugStatus.reason;
    if (!values.name.trim()) found.name = COMPANY_MESSAGES.nameRequired;
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) found.email = COMPANY_MESSAGES.emailInvalid;
    if (passwordRules.some((rule) => !rule.met)) found.password = COMPANY_MESSAGES.passwordNotStrong;
    setErrors(found);
    setFormError(null);

    const firstProblem = (['companyName', 'slug', 'name', 'email', 'password'] as const).find((field) => found[field]);
    if (firstProblem) {
      (form.elements.namedItem(firstProblem) as HTMLInputElement | null)?.focus();
      return;
    }
    signupMutation.mutate({
      companyName: values.companyName.trim(),
      slug: values.slug,
      name: values.name.trim(),
      jobTitle: values.jobTitle.trim() || undefined,
      email: values.email.trim(),
      password: values.password,
    });
  };

  return {
    values,
    errors,
    formError,
    slugStatus,
    rootHost: ROOT_HOST,
    passwordRules,
    isSubmitting: signupMutation.isPending,
    handleChange,
    handleSubmit,
  };
}