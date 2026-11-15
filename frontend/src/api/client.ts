import type { AuthResponse } from '../features/auth/types';

/** Problem-details error from the API. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly errors?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ProblemBody {
  title?: string;
  detail?: string;
  code?: string;
  errors?: string[];
}

// The access token lives in memory only (never localStorage / sessionStorage).
let accessToken: string | null = null;
let onUnauthorized: () => void = () => undefined;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};
export const setUnauthorizedHandler = (handler: () => void): void => {
  onUnauthorized = handler;
};

async function parseError(res: Response): Promise<ApiError> {
  let body: ProblemBody = {};
  try {
    body = (await res.json()) as ProblemBody;
  } catch {
    // not JSON; fall through to the generic message
  }
  return new ApiError(
    res.status,
    body.detail ?? body.title ?? `Request failed (${res.status})`,
    body.code,
    body.errors,
  );
}

let refreshInflight: Promise<AuthResponse | null> | null = null;

/**
 * Exchanges the httpOnly refresh cookie for a new access token.
 * Single-flight: the server rotates refresh tokens, so two parallel calls with the
 * same cookie would look like token theft and end every session.
 */
export function refreshSession(): Promise<AuthResponse | null> {
  refreshInflight ??= (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' });
      if (res.status === 401) {
        accessToken = null;
        return null;
      }
      if (!res.ok) throw await parseError(res);
      const session = (await res.json()) as AuthResponse;
      accessToken = session.accessToken;
      return session;
    } finally {
      refreshInflight = null;
    }
  })();
  return refreshInflight;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Public endpoints (login) skip the bearer header and the refresh-on-401 retry. */
  auth?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const send = (): Promise<Response> =>
    fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await send();
  if (res.status === 401 && auth) {
    const renewed = await refreshSession();
    if (renewed) {
      res = await send();
    } else {
      onUnauthorized();
    }
  }
  if (!res.ok) throw await parseError(res);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
