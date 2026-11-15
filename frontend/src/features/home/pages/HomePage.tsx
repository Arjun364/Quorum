import { useSession } from '../../../app/auth/session';
import { ROLE_LABELS } from '../../auth/types';
import type { SystemRole } from '../../auth/types';

const EMPTY_COPY: Record<SystemRole, { title: string; body: string }> = {
  PlatformOwner: {
    title: 'No organizations yet',
    body: 'Creating organizations and their administrators arrives in the next milestone.',
  },
  Admin: {
    title: 'Nothing is waiting for you',
    body: 'Departments, people and join requests will appear here once they exist.',
  },
  CompanyHead: {
    title: 'Nothing is waiting for you',
    body: 'You can read every department’s concluded minutes here once meetings start.',
  },
  DepartmentHead: {
    title: 'Nothing is waiting for you',
    body: 'When it is time for your department’s meeting, you will start it from here.',
  },
  Employee: {
    title: 'Nothing is waiting for you',
    body: 'Points that need your confirmation will appear here after a meeting.',
  },
};

export function HomePage() {
  const { user } = useSession();
  if (!user) return null;
  const empty = EMPTY_COPY[user.systemRole];

  return (
    <>
      <p className="text-sm font-medium uppercase tracking-widest text-muted">{ROLE_LABELS[user.systemRole]}</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Welcome, {user.name}</h1>

      <section aria-labelledby="waiting-heading" className="mt-10">
        <h2 id="waiting-heading" className="text-lg font-semibold">
          Waiting for You
        </h2>
        <div className="mt-3 rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center">
          <p className="font-medium">{empty.title}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted text-pretty">{empty.body}</p>
        </div>
      </section>
    </>
  );
}
