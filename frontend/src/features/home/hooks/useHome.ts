import { ROLE_LABELS, useSession } from '@/features/auth';
import { EMPTY_STATE_COPY } from '../constants';

/** Owns the home page data: the signed-in user's greeting and the role-specific empty state. */
export function useHome() {
  // Session dependency.
  const { user } = useSession();

  // Derived page data.
  const roleLabel = user ? ROLE_LABELS[user.systemRole] : '';
  const emptyState = user ? EMPTY_STATE_COPY[user.systemRole] : null;

  return { user, roleLabel, emptyState };
}
