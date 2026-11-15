import { BrandMark } from '@/features/company';
import { stagger } from '@/shared';
import { LOGIN_PREVIEW_ROWS } from '../constants';
import type { LoginHeroProps } from '../types';

/** Renders the company brand panel of the sign-in page: its logo and name, a headline and a static product preview that enters once on load. */
export function LoginHero({ companyName, logoUrl, showPoweredBy }: LoginHeroProps) {
  return (
    <aside className="hero-ground hidden flex-col justify-between border-r border-line p-12 lg:flex">
      <div data-enter="fade" className="flex items-center gap-3">
        <BrandMark name={companyName} logoUrl={logoUrl} className="!size-10" />
        <span className="font-display text-lg font-semibold tracking-tight">{companyName}</span>
      </div>
      <div className="max-w-lg">
        <p data-enter style={stagger(1)} className="eyebrow">
          Monthly department meetings
        </p>
        <p data-enter style={stagger(2)} className="mt-4 font-display text-5xl font-medium leading-[1.05] text-pretty xl:text-6xl">
          Every point has an owner. Every meeting ends confirmed.
        </p>
        <div aria-hidden="true" data-enter style={stagger(3)} className="card mt-10 p-5 shadow-[var(--shadow-3)] backdrop-blur">
          <p className="eyebrow">Sales · Monthly meeting</p>
          <ul className="mt-3 divide-y divide-line">
            {LOGIN_PREVIEW_ROWS.map((row, index) => (
              <li key={row.text} data-enter="row" style={stagger(index)} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{row.text}</span>
                  <span className="block text-xs text-muted">{row.owner}</span>
                </span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    row.tone === 'ok' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'
                  }`}
                >
                  <span className={`size-1.5 rounded-full bg-current ${row.tone === 'warn' ? 'pulse-dot' : ''}`} />
                  {row.state}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="eyebrow">{showPoweredBy ? 'Powered by Quorum' : 'Minutes stay inside your company.'}</p>
    </aside>
  );
}