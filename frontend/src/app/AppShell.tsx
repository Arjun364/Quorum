import { useSession, useSignOut } from '@/features/auth';
import { BrandMark, useCompanyPublic } from '@/features/company';
import { Button } from '@/shared';
import type { SystemRole } from '@/shared';
import { NavLink, Outlet } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  roles: SystemRole[];
  end?: boolean;
}

/** Navigation of the signed-in shell; each entry lists the roles that see it (the server enforces the same rules). */
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', roles: ['CompanyHead', 'DepartmentHead', 'Employee'], end: true },
  { to: '/organizations', label: 'Organizations', roles: ['CompanyHead'] },
  { to: '/settings/brand', label: 'Brand', roles: ['CompanyHead'] },
];

/** Layout of every signed-in page: skip link, header with the company brand, role-based navigation, account and sign-out, and the page outlet. */
export function AppShell() {
  const { user } = useSession();
  const { signOut } = useSignOut();
  const { company } = useCompanyPublic();
  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.systemRole));

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
      >
        Skip to Main Content
      </a>
      <header className="glass sticky top-0 z-30 border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandMark name={company?.name ?? 'Quorum'} logoUrl={company?.logoUrl ?? null} />
            <span className="truncate font-display text-lg font-semibold tracking-tight">{company?.name ?? 'Quorum'}</span>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden min-w-0 truncate text-sm text-muted md:block">{user?.email}</span>
            <Button variant="secondary" onClick={() => void signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
        {items.length > 1 && (
          <nav aria-label="Main" className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${isActive ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main id="main" className="mx-auto max-w-5xl px-5 py-10">
        <Outlet />
      </main>
      {company?.showPoweredBy && <footer className="mx-auto max-w-5xl px-5 pb-10 text-xs text-muted">Powered by Quorum</footer>}
    </div>
  );
}