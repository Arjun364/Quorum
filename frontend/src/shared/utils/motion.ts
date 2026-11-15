import type { CSSProperties } from 'react';

/** Returns the style that places an element at position `index` in a staggered entrance (see `[data-enter]` in tokens.css). */
export function stagger(index: number): CSSProperties {
  return { '--i': index } as CSSProperties;
}

/** True when the visitor asked for less motion; every animation here rests or shows one still frame then. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True on devices with a mouse or trackpad; touch screens get no pointer effects. */
export function hasFinePointer(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
