import { useSession, useSignOut } from '@/features/auth';
import { Button, Logo } from '@/shared';
import { Outlet } from 'react-router-dom';

/** Layout of every signed-in page: skip link, header with the account and sign-out, and the page outlet. */
export function AppShell() {
  const { user } = useSession();
  const { signOut } = useSignOut();

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
      >
        Skip to Main Content
      </a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <Logo />
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden min-w-0 truncate text-sm text-muted sm:block">{user?.email}</span>
            <Button variant="secondary" onClick={() => void signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-5 py-10">
        <Outlet />
      </main>
    </div>
  );
}
