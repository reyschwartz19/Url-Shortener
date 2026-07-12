import { useMutation } from '@tanstack/react-query';
import api, { setAccessToken } from '../lib/api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/api';

// ─── useLogin ──────────────────────────────────────────────────────

export function useLogin() {
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: async (credentials) => {
      const { data } = await api.post<LoginResponse>(
        '/api/auth/login',
        credentials
      );
      return data;
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
    },
  });
}

// ─── useRegister ───────────────────────────────────────────────────

export function useRegister() {
  return useMutation<RegisterResponse, Error, RegisterRequest>({
    mutationFn: async (credentials) => {
      const { data } = await api.post<RegisterResponse>(
        '/api/auth/register',
        credentials
      );
      return data;
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
    },
  });
}

// ─── useLogout ─────────────────────────────────────────────────────

export function useLogout() {
  return useMutation<{ message: string }, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post('/api/auth/logout');
      return data;
    },
    onSuccess: () => {
      setAccessToken(null);
    },
  });
}
