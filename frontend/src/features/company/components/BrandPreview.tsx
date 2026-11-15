import { themeStyle } from '@/shared';
import type { CSSProperties } from 'react';
import type { BrandPreviewProps } from '../types';
import { BrandMark } from './BrandMark';

/** A small live picture of the app in the chosen brand, so the head sees the result before saving. */
export function BrandPreview({ name, logoUrl, accent }: BrandPreviewProps) {
  return (
    <aside
      aria-label="Preview"
      style={themeStyle(accent) as CSSProperties}
      className="sticky top-24 overflow-hidden rounded-2xl border border-line bg-bg text-ink shadow-[var(--shadow-2)]"
    >
      <div className="flex items-center gap-2.5 border-b border-line bg-surface px-4 py-3">
        <BrandMark name={name || 'Your Company'} logoUrl={logoUrl} />
        <span className="truncate font-display font-semibold">{name || 'Your Company'}</span>
      </div>
      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Department Head</p>
        <p className="mt-1 font-display text-2xl font-semibold tracking-tight">Welcome, Rahul</p>
        <div className="mt-4 rounded-xl border border-line bg-surface p-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-medium">Share ISO audit schedule</span>
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">Confirmed</span>
          </div>
          <p className="mt-0.5 text-xs text-muted">Anjali · due 30 Nov</p>
        </div>
        <div className="mt-4 flex gap-2">
          <span className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink">Start Meeting</span>
          <span className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold">View Minutes</span>
        </div>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-muted">This is how your people will see it.</p>
    </aside>
  );
}