import { useSyncExternalStore } from 'react';
import type { SessionState } from '../types';
import { getSessionSnapshot, subscribeToSession } from './sessionStore';

/** Returns the live session state (loading, authenticated or anonymous) and re-renders when it changes. */
export function useSession(): SessionState {
  return useSyncExternalStore(subscribeToSession, getSessionSnapshot);
}
