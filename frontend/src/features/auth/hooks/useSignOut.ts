import { authApi } from '../api';
import { clearSession } from './sessionStore';

/** Returns the sign-out action: it revokes the session on the server, then always clears the local session. */
export function useSignOut() {
  /** Signs the user out; the local session is cleared even if the server cannot be reached. */
  const signOut = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  };

  return { signOut };
}
