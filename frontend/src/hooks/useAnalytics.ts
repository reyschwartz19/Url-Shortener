import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { LinkAnalyticsResponse } from '../types/api';

// ─── useLinkAnalytics ──────────────────────────────────────────────
// Fetches click analytics for a specific link.

export function useLinkAnalytics(linkId: string | null) {
  return useQuery<LinkAnalyticsResponse, Error>({
    queryKey: ['analytics', linkId],
    queryFn: async () => {
      const { data } = await api.get<LinkAnalyticsResponse>(
        `/api/clicks/${linkId}/stats`
      );
      return data;
    },
    enabled: !!linkId,  // only fetch when a linkId is provided
  });
}
