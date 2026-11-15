import { Logo } from '@/shared';
import { LOGIN_PREVIEW_ROWS } from '../constants';

/** Renders the brand panel of the sign-in page: headline, supporting copy and a static product preview. */
export function LoginHero() {
  return (
    <aside className="hidden flex-col justify-between bg-accent p-12 text-accent-ink lg:flex">
      <Logo className="text-accent-ink" />
      <div className="max-w-lg">
        <p className="text-sm font-medium uppercase tracking-widest opacity-75">Monthly department meetings</p>
        <h2 className="mt-4 font-display text-5xl font-semibold leading-[1.08] tracking-tight text-pretty">
          Every point has an owner. Every meeting ends confirmed.
        </h2>
        <p className="mt-5 max-w-md text-lg opacity-85 text-pretty">
          Record the decisions, let each owner confirm their own points, and watch unfinished work carry over by
          itself.
        </p>
        <div aria-hidden="true" className="mt-10 rounded-xl bg-surface p-5 text-ink shadow-lg">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Sales · Monthly meeting</p>
          <ul className="mt-3 divide-y divide-line">
            {LOGIN_PREVIEW_ROWS.map((row) => (
              <li key={row.text} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{row.text}</span>
                  <span className="block text-xs text-muted">{row.owner}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    row.tone === 'ok' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'
                  }`}
                >
                  {row.state}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-sm opacity-70">Minutes stay inside your organization.</p>
    </aside>
  );
}
