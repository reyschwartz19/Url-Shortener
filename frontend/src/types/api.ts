// ─── Generic API Envelope ───────────────────────────────────────────
// The backend doesn't wrap in { success, data } consistently — some
// controllers return the payload directly. These wrappers let us
// normalise at the axios interceptor level.

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;       // errorHandler uses `message` key
  errors?: string[];      // ZodError returns `errors` array
}

// ─── Rate-Limit Error ───────────────────────────────────────────────

export class RateLimitError extends Error {
  retryAfter: number | null;

  constructor(message: string, retryAfter: number | null = null) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// ─── Auth ───────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

/** POST /api/auth/login response body */
export interface LoginResponse {
  accessToken: string;
}

/** POST /api/auth/register response body */
export interface RegisterResponse {
  user: {
    id: string;
    email: string;
  };
  accessToken: string;
}

/** POST /api/auth/refresh response body */
export interface RefreshResponse {
  accessToken: string;
}

/** POST /api/auth/logout response body */
export interface LogoutResponse {
  message: string;
}

// ─── Links ──────────────────────────────────────────────────────────

export interface CreateLinkRequest {
  originalUrl: string;
  customCode?: string;
}

/** Shape returned by getUserLinksController — Prisma Link model */
export interface LinkResponse {
  linkId: string;
  userId: string;
  originalUrl: string;
  shortCode: string;
  createdAt: string;     // ISO 8601 date string
  deletedAt: string | null;
}

/** POST /api/links/createLink response body */
export interface CreateLinkResponse {
  linkId: string;
  shortCode: string;
  originalUrl: string;
}

// ─── Analytics / Click Stats ────────────────────────────────────────

export interface ClicksByCountry {
  country: string | null;
  count: number;
}

export interface ClicksOverTime {
  date: string;
  count: number;
}

/** GET /api/clicks/:linkId/stats response body */
export interface LinkAnalyticsResponse {
  totalCount: number;
  clicksByCountry: ClicksByCountry[];
  clicksOverTime: ClicksOverTime[];
}
