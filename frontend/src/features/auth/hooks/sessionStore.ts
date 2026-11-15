import { SESSION_RENEW_MARGIN_SECONDS, SESSION_RENEW_MIN_SECONDS } from '@/config';
import { refreshSession, setAccessToken, setUnauthorizedHandler } from '@/shared';
import type { SessionUser } from '@/shared';
import type { AuthResponse, SessionState } from '../types';

let state: SessionState = { status: 'loading', user: null };
const listeners = new Set<() => void>();
let renewTimer: number | undefined;
let initPromise: Promise<void> | null = null;

/** Replaces the session state and notifies every subscribed component. */
function setState(next: SessionState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

/** Applies a session (or none): updates state and schedules the silent renewal before the token expires. */
function apply(session: AuthResponse | null): void {
  window.clearTimeout(renewTimer);
  if (!session) {
    setAccessToken(null);
    setState({ status: 'anonymous', user: null });
    return;
  }
  setAccessToken(session.accessToken);
  setState({ status: 'authenticated', user: session.user });
  const delayMs = Math.max(session.expiresInSeconds - SESSION_RENEW_MARGIN_SECONDS, SESSION_RENEW_MIN_SECONDS) * 1000;
  renewTimer = window.setTimeout(() => {
    refreshSession().then(apply, () => apply(null));
  }, delayMs);
}

setUnauthorizedHandler(() => apply(null));

/** Restores a session from the refresh cookie once at startup. */
export function initSession(): Promise<void> {
  initPromise ??= refreshSession().then(apply, () => apply(null));
  return initPromise;
}

/** Starts a session returned by login or change-password. */
export function startSession(session: AuthResponse): void {
  apply(session);
}

/** Updates fields of the signed-in user in place (for example after they edit their profile). */
export function patchSessionUser(patch: Partial<SessionUser>): void {
  if (state.status === 'authenticated' && state.user) setState({ ...state, user: { ...state.user, ...patch } });
}

/** Ends the local session (the server-side logout is done by the caller). */
export function clearSession(): void {
  apply(null);
}

/** Subscribes to session changes; returns the unsubscribe function (for `useSyncExternalStore`). */
export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Returns the current session state (for `useSyncExternalStore`). */
export function getSessionSnapshot(): SessionState {
  return state;
}
