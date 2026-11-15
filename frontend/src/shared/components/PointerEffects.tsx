import { useRef } from 'react';
import { usePointerEffects } from '../hooks';

/** Mount once at the app root: the trailing cursor ring and the per-card pointer light (see `usePointerEffects`). */
export function PointerEffects() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  usePointerEffects(ring, label);
  return (
    <div ref={ring} aria-hidden="true" className="cursor-ring" data-state="idle" data-visible="false">
      <span className="cursor-ring__shape">
        <span ref={label} className="cursor-ring__label" />
      </span>
    </div>
  );
}