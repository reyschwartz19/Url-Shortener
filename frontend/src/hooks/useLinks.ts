import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type {
  LinkResponse,
  CreateLinkRequest,
  CreateLinkResponse,
} from '../types/api';

// ─── useLinks ──────────────────────────────────────────────────────
// Fetches all links for the authenticated user.

export function useLinks() {
  return useQuery<LinkResponse[], Error>({
    queryKey: ['links'],
    queryFn: async () => {
      const { data } = await api.get<LinkResponse[]>('/api/links/userLinks');
      return data;
    },
  });
}

// ─── useCreateLink ─────────────────────────────────────────────────

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation<CreateLinkResponse, Error, CreateLinkRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<CreateLinkResponse>(
        '/api/links/createLink',
        { originalUrl: payload.originalUrl }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
}

// ─── useDeleteLink ─────────────────────────────────────────────────

export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (linkId) => {
      await api.delete(`/api/links/${linkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
}
