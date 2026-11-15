import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { companyApi } from '../api';
import { COMPANY_MESSAGES, SLUG_CHECK_DELAY_MS } from '../constants';
import type { SlugStatus } from '../types';
import { isValidSlugFormat } from '../utils';

/** Checks a company address as the user types: waits for a pause, validates the shape, then asks the server. */
export function useSlugCheck(slug: string): SlugStatus {
  const [settled, setSettled] = useState(slug);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(slug), SLUG_CHECK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [slug]);

  const shapeOk = isValidSlugFormat(settled);
  const query = useQuery({
    queryKey: ['company', 'slug', settled],
    queryFn: () => companyApi.slugAvailable(settled),
    enabled: shapeOk,
    staleTime: 30_000,
  });

  if (slug.length === 0) return { state: 'idle' };
  if (slug !== settled) return { state: 'checking' };
  if (!shapeOk) return { state: 'unavailable', reason: COMPANY_MESSAGES.slugFormat };
  if (query.isPending) return { state: 'checking' };
  if (query.isError) return { state: 'idle' };
  return query.data.available ? { state: 'available' } : { state: 'unavailable', reason: query.data.reason ?? COMPANY_MESSAGES.addressTaken };
}