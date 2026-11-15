import { initialsOf } from '../utils';
import type { AvatarProps } from '../types';

/** Renders a person's photo, or their initials on an accent tile when they have none. */
export function Avatar({ name, url, className = 'size-10' }: AvatarProps) {
  if (url) return <img src={url} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />;
  return (
    <span aria-hidden="true" className={`num grid shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-medium text-accent ${className}`}>
      {initialsOf(name)}
    </span>
  );
}