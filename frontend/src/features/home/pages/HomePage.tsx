import { SetupChecklist, StatTiles, WaitingForYou, WelcomeHeader } from '../components';
import { useHome } from '../hooks';

/** Home page: composes the greeting, the company head's figures and setup checklist, and the "Waiting for You" section; data comes from `useHome`. */
export function HomePage() {
  const { user, companyName, roleLabel, emptyState, setupSteps, stats } = useHome();
  if (!user || !emptyState) return null;

  return (
    <>
      <WelcomeHeader roleLabel={roleLabel} name={user.name} companyName={companyName} />
      {stats.length > 0 && <StatTiles tiles={stats} />}
      {setupSteps.length > 0 && <SetupChecklist steps={setupSteps} />}
      <WaitingForYou emptyState={emptyState} />
    </>
  );
}