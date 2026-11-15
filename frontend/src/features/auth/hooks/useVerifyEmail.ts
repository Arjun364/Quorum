import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authApi } from '../api';

/** Owns the email-verification page: confirms the link once on arrival (the link is single-use, so it never runs twice). */
export function useVerifyEmail() {
  const token = useSearchParams()[0].get('token');
  const started = useRef(false);
  const mutation = useMutation({ mutationFn: (value: string) => authApi.verifyEmail(value) });

  useEffect(() => {
    if (token && !started.current) {
      started.current = true;
      mutation.mutate(token);
    }
  }, [token, mutation]);

  const status = !token ? 'invalid' : mutation.isSuccess ? 'done' : mutation.isError ? 'invalid' : 'verifying';
  return { status } as const;
}