import { WaitingForYou, WelcomeHeader } from '../components';
import { useHome } from '../hooks';

/** Home page: composes the greeting and the "Waiting for You" section; data comes from `useHome`. */
export function HomePage() {
  const { user, roleLabel, emptyState } = useHome();
  if (!user || !emptyState) return null;

  return (
    <>
      <WelcomeHeader roleLabel={roleLabel} name={user.name} />
      <WaitingForYou emptyState={emptyState} />
    </>
  );
}
