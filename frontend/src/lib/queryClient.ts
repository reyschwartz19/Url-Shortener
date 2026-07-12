import { QueryClient } from '@tanstack/react-query';
import { RateLimitError } from '../types/api';

const NON_RETRYABLE_STATUSES = new Set([401, 403, 429]);

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Don't retry rate-limit errors
          if (error instanceof RateLimitError) return false;

          // Don't retry auth / forbidden errors
          const status = (error as Error & { status?: number }).status;
          if (status && NON_RETRYABLE_STATUSES.has(status)) return false;

          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Singleton for the app
let queryClient: QueryClient | null = null;

export function getQueryClient() {
  if (!queryClient) {
    queryClient = makeQueryClient();

    // Dev-only global error logging
    if (import.meta.env.DEV) {
      const cache = queryClient.getQueryCache();
      cache.subscribe((event) => {
        if (
          event.type === 'updated' &&
          event.query.state.status === 'error'
        ) {
          console.error(
            '[TanStack Query] Query error:',
            event.query.queryKey,
            event.query.state.error
          );
        }
      });
    }
  }
  return queryClient;
}
