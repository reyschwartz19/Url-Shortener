import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { RateLimitError } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// ─── In-memory token store ──────────────────────────────────────────
// Access token lives only in JS memory — never in localStorage/cookies
// that are readable by XSS. The refresh token is an httpOnly cookie
// managed entirely by the browser.

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

let refreshPromise: Promise<{ accessToken: string, email?: string }> | null = null;

export const refreshAuthToken = async (): Promise<{ accessToken: string, email?: string }> => {
  if (!refreshPromise) {
    refreshPromise = axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true })
      .then(res => {
        const token = res.data.accessToken;
        const email = res.data.email;
        setAccessToken(token);
        return { accessToken: token, email };
      })
      .catch(err => {
        setAccessToken(null);
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// ─── Axios instance ────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,              // send httpOnly cookies on every request
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach Bearer token ──────────────────────

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response interceptor: unwrap data ─────────────────────────────

api.interceptors.response.use(
  (response) => {
    // The backend returns raw payloads (not wrapped in { success, data }),
    // so we simply pass through response.data.
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };

    // ── 429 Rate Limit ──────────────────────────────────────────
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : null;
      const body = error.response.data as { message?: string };
      const message = body?.message || 'Too many requests. Please slow down.';
      throw new RateLimitError(message, retrySeconds);
    }

    // ── 401 Unauthorized → try refresh once ─────────────────────
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retried = true;

      try {
        const { accessToken: newToken } = await refreshAuthToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — clear token and let the error propagate
        setAccessToken(null);
      }
    }

    // ── Normalise error message ─────────────────────────────────
    const data = error.response?.data as {
      message?: string;
      error?: string;
      errors?: string[];
    } | undefined;

    const message =
      data?.error ||
      data?.message ||
      data?.errors?.join(', ') ||
      error.message ||
      'An unexpected error occurred';

    const normalised = new Error(message) as Error & {
      status?: number;
    };
    normalised.status = error.response?.status;
    throw normalised;
  }
);

export default api;
