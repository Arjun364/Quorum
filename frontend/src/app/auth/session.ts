import { useSyncExternalStore } from 'react';
import * as authApi from '../../api/auth';
import { refreshSession, setUnauthorizedHandler } from '../../api/client';
import type { AuthResponse, User } from '../../features/auth/types';

export interface SessionState {
  status: 'loading' | 'authenticated' | 'anonymous';
  user: User | null;
}

let state: SessionState = { status: 'loading', user: null };
const listeners = new Set<() => void>();
let timer: number | undefined;

function setState(next: SessionState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

/** Applies a new session (or none) and schedules the silent renewal. */
function apply(session: AuthResponse | null): void {
  window.clearTimeout(timer);
  if (!session) {
    setState({ status: 'anonymous', user: null });
    return;
  }
  setState({ status: 'authenticated', user: session.user });
  const delayMs = Math.max(session.expiresInSeconds - 30, 5) * 1000;
  timer = window.setTimeout(() => {
    refreshSession().then(apply, () => apply(null));
  }, delayMs);
}

setUnauthorizedHandler(() => apply(null));

let initPromise: Promise<void> | null = null;
/** Restores a session from the refresh cookie once at startup. */
export function initSession(): Promise<void> {
  initPromise ??= refreshSession().then(apply, () => apply(null));
  return initPromise;
}

export async function signIn(email: string, password: string): Promise<User> {
  const session = await authApi.login(email, password);
  apply(session);
  return session.user;
}

export async function signOut(): Promise<void> {
  try {
    await authApi.logout();
  } finally {
    apply(null);
  }
}

export async function changePassword(current: string, next: string): Promise<User> {
  const session = await authApi.changePassword(current, next);
  apply(session);
  return session.user;
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = (): SessionState => state;

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSnapshot);
}
