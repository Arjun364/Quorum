import { stagger } from '@/shared';
import type { StatTilesProps } from '../types';

/** Renders the home page's figures as a row of tiles: a mono number, its label and a short note. */
export function StatTiles({ tiles }: StatTilesProps) {
  return (
    <ul className="mt-10 grid gap-3 sm:grid-cols-3">
      {tiles.map((tile, index) => (
        <li key={tile.label} data-enter style={stagger(index + 2)} className="card p-5">
          <p className="eyebrow">{tile.label}</p>
          <p className="num mt-3 text-4xl font-medium">{tile.value}</p>
          <p className="mt-1 text-sm text-muted">{tile.note}</p>
        </li>
      ))}
    </ul>
  );
}