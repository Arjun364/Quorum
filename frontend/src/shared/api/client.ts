import { API_BASE_PATH } from '@/config';
import type { ApiRequestOptions, ProblemBody, SessionPayload } from '../types';
import { ApiError } from './apiError';

// The access token lives in memory only (never localStorage / sessionStorage).
let accessToken: string | null = null;
let onUnauthorized: () => void = () => undefined;
let refreshInflight: Promise<SessionPayload | null> | null = null;

/** Stores (or clears) the in-memory access token used for authenticated requests. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Registers the callback that runs when a session can no longer be renewed. */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

/** Converts a failed response into an `ApiError` using its problem-details body. */
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

/**
 * Exchanges the httpOnly refresh cookie for a new access token; resolves to null when there is no valid session.
 * Single-flight: the server rotates refresh tokens, so two parallel calls with the same cookie would look
 * like token theft and end every session.
 */
export function refreshSession(): Promise<SessionPayload | null> {
  refreshInflight ??= (async () => {
    try {
      const res = await fetch(`${API_BASE_PATH}/auth/refresh`, { method: 'POST', credentials: 'same-origin' });
      if (res.status === 401) {
        accessToken = null;
        return null;
      }
      if (!res.ok) throw await parseError(res);
      const session = (await res.json()) as SessionPayload;
      accessToken = session.accessToken;
      return session;
    } finally {
      refreshInflight = null;
    }
  })();
  return refreshInflight;
}

/** Calls the API, attaching the bearer token and retrying once after a silent session renewal on 401. */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const send = (): Promise<Response> =>
    fetch(`${API_BASE_PATH}${path}`, {
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
