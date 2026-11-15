import { currentCompanySlug } from '@/config';
import { useQuery } from '@tanstack/react-query';
import { companyApi } from '../api';

/** Loads the current address's company branding; stays idle on the platform's own address. */
export function useCompanyPublic() {
  const slug = currentCompanySlug();
  const query = useQuery({
    queryKey: ['company', 'public', slug],
    queryFn: companyApi.publicInfo,
    enabled: slug !== null,
    staleTime: 5 * 60_000,
    retry: false,
  });
  return { slug, company: query.data ?? null, isLoading: slug !== null && query.isPending, notFound: query.isError };
}