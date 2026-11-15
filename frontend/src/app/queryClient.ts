import { QueryClient } from '@tanstack/react-query';

/** Shared TanStack Query client with the application's default caching behaviour. */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});
