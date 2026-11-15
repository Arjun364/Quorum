import { SetupChecklist, WaitingForYou, WelcomeHeader } from '../components';
import { useHome } from '../hooks';

/** Home page: composes the greeting, the company head's setup checklist and the "Waiting for You" section; data comes from `useHome`. */
export function HomePage() {
  const { user, roleLabel, emptyState, setupSteps } = useHome();
  if (!user || !emptyState) return null;

  return (
    <>
      <WelcomeHeader roleLabel={roleLabel} name={user.name} />
      {setupSteps.length > 0 && <SetupChecklist steps={setupSteps} />}
      <WaitingForYou emptyState={emptyState} />
    </>
  );
}