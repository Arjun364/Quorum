import { Icon } from '@/shared';
import type { SlideMockProps } from '../types';

const PEOPLE = ['AN', 'RM', 'DS', 'VK', 'SM'];

/** Draws the small product window of one slide: the screen a person would see at that stage of a meeting. */
export function SlideMock({ id }: SlideMockProps) {
  if (id === 'start') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-medium">Sales · Monthly meeting</p>
          <span className="eyebrow">5 present</span>
        </div>
        <div className="flex -space-x-2">
          {PEOPLE.map((person) => (
            <span key={person} className="num grid size-9 place-items-center rounded-full border-2 border-surface bg-accent-soft text-[0.65rem] text-accent">
              {person}
            </span>
          ))}
        </div>
        <div className="rounded-lg border border-line bg-surface-2/60 p-4">
          <p className="eyebrow">Note-taker drawn</p>
          <p className="mt-1 text-lg font-medium">Divya S.</p>
        </div>
        <button type="button" tabIndex={-1} className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-ink">
          Start Meeting
        </button>
      </div>
    );
  }
  if (id === 'compile') {
    return (
      <ul className="space-y-2.5">
        {[
          ['Share ISO audit schedule', 'Anjali N.', '15 Nov'],
          ['Move UAT sign-off, Client Portal', 'Rahul M.', '22 Nov'],
          ['Update the vendor review sheet', 'Divya S.', '30 Nov'],
        ].map(([point, owner, due]) => (
          <li key={point} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2/60 px-4 py-3">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{point}</span>
              <span className="block text-xs text-muted">{owner}</span>
            </span>
            <span className="num shrink-0 text-xs text-muted">{due}</span>
          </li>
        ))}
        <li className="rounded-lg border border-dashed border-line px-4 py-3 text-sm text-muted">+ Add a point</li>
      </ul>
    );
  }
  if (id === 'confirm') {
    return (
      <ul className="space-y-2.5">
        {[
          ['Share ISO audit schedule', 'Confirmed', 'ok'],
          ['Update the vendor review sheet', 'Needs you', 'accent'],
          ['Quote for the Kochi site', 'Waiting', 'warn'],
        ].map(([point, state, tone]) => (
          <li key={point} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2/60 px-4 py-3">
            <span className="truncate text-sm font-medium">{point}</span>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                tone === 'ok' ? 'bg-ok-soft text-ok' : tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-accent-soft text-accent'
              }`}
            >
              {tone === 'ok' ? <Icon name="check" className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
              {state}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-ok-soft text-ok">
          <Icon name="check" className="size-7" />
        </span>
        <div>
          <p className="font-medium">Minutes approved</p>
          <p className="text-sm text-muted">Version 3 · by the head</p>
        </div>
      </div>
      <div className="rounded-lg border border-line bg-surface-2/60 p-4">
        <p className="eyebrow">Carried to next month</p>
        <p className="num mt-1 text-3xl font-medium">3</p>
        <p className="text-sm text-muted">open points, same owners</p>
      </div>
    </div>
  );
}