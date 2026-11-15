import { ROLE_LABELS, useSession, useSignOut } from '@/features/auth';
import { BrandMark, useCompanyPublic } from '@/features/company';
import { Avatar, DotWave, Icon } from '@/shared';
import type { IconName, SystemRole } from '@/shared';
import { Link, NavLink, Outlet } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  roles: SystemRole[];
  end?: boolean;
}

/** Navigation of the signed-in shell; each entry lists the roles that see it (the server enforces the same rules). */
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home', roles: ['CompanyHead', 'DepartmentHead', 'Employee'], end: true },
  { to: '/organizations', label: 'Organizations', icon: 'building', roles: ['CompanyHead'] },
  { to: '/people', label: 'People', icon: 'users', roles: ['DepartmentHead', 'Employee'] },
  { to: '/transfers', label: 'Moves', icon: 'clock', roles: ['CompanyHead', 'DepartmentHead'] },
  { to: '/settings/brand', label: 'Brand', icon: 'palette', roles: ['CompanyHead'] },
];

/** Layout of every signed-in page: a sidebar with the company brand, role-based navigation and the account on desktop; a top bar with the same on a phone. */
export function AppShell() {
  const { user } = useSession();
  const { signOut } = useSignOut();
  const { company } = useCompanyPublic();
  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.systemRole));
  const companyName = company?.name ?? 'Quorum';

  const link = (item: NavItem, extra: string) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={`nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink ${extra}`}
    >
      <Icon name={item.icon} className="size-[18px]" />
      {item.label}
    </NavLink>
  );

  return (
    <div className="app-ground min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 lg:left-[17rem]">
        <DotWave spacing={34} intensity={0.8} className="[mask-image:radial-gradient(ellipse_80%_60%_at_60%_0%,#000_20%,transparent_80%)]" />
      </div>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
      >
        Skip to Main Content
      </a>

      <aside className="sticky top-0 z-30 hidden h-dvh flex-col border-r border-line bg-surface/70 p-4 backdrop-blur lg:flex">
        <div className="flex items-center gap-3 px-2 py-3">
          <BrandMark name={companyName} logoUrl={company?.logoUrl ?? null} className="!size-9" />
          <span className="truncate font-display text-lg font-semibold tracking-tight">{companyName}</span>
        </div>
        <nav aria-label="Main" className="mt-6 flex flex-col gap-1">
          {items.map((item) => link(item, ''))}
        </nav>
        <div className="mt-auto">
          <div className="card flex items-center gap-3 p-3">
            <Link to="/profile" aria-label="Your profile" data-cursor-label="Profile" className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={user?.name ?? '?'} url={user?.avatarUrl} className="size-9" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{user?.name}</span>
                <span className="eyebrow block truncate !text-[0.65rem]">{user ? ROLE_LABELS[user.systemRole] : ''}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="press grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
            >
              <Icon name="logout" className="size-[18px]" />
            </button>
          </div>
          {company?.showPoweredBy && <p className="eyebrow mt-3 px-2 !text-[0.65rem]">Powered by Quorum</p>}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="glass sticky top-0 z-30 border-b border-line lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <BrandMark name={companyName} logoUrl={company?.logoUrl ?? null} />
              <span className="truncate font-display text-lg font-semibold tracking-tight">{companyName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Link to="/profile" aria-label="Your profile" className="press grid size-10 place-items-center">
                <Avatar name={user?.name ?? '?'} url={user?.avatarUrl} className="size-8" />
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                aria-label="Sign out"
                className="press grid size-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
              >
                <Icon name="logout" />
              </button>
            </div>
          </div>
          {items.length > 1 && (
            <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-2">
              {items.map((item) => link(item, 'shrink-0'))}
            </nav>
          )}
        </header>
        <main id="main" className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}