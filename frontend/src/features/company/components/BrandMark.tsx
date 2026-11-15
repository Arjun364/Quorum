import { initialsOf } from '@/shared';
import type { BrandMarkProps } from '../types';

/** Renders a company's logo, or a tile with its initials in the brand colour when it has no logo yet. */
export function BrandMark({ name, logoUrl, className = '' }: BrandMarkProps) {
  if (logoUrl) {
    return <img src={logoUrl} alt="" width={32} height={32} className={`size-8 shrink-0 rounded-lg object-contain ${className}`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-xs font-bold tracking-wide text-accent-ink ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}