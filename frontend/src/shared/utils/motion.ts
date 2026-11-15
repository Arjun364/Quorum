import type { CSSProperties } from 'react';

/** Returns the style that places an element at position `index` in a staggered entrance (see `[data-enter]` in tokens.css). */
export function stagger(index: number): CSSProperties {
  return { '--i': index } as CSSProperties;
}
