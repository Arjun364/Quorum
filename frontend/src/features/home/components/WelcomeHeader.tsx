import { stagger } from '@/shared';
import type { WelcomeHeaderProps } from '../types';

/** Renders the role label and the personal greeting at the top of the home page. */
export function WelcomeHeader({ roleLabel, name }: WelcomeHeaderProps) {
  return (
    <>
      <p data-enter className="text-sm font-medium uppercase tracking-widest text-muted">
        {roleLabel}
      </p>
      <h1 data-enter style={stagger(1)} className="mt-1 font-display text-4xl font-semibold tracking-tight">
        Welcome, {name}
      </h1>
    </>
  );
}
