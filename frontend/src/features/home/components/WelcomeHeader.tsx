import type { WelcomeHeaderProps } from '../types';

/** Renders the role label and the personal greeting at the top of the home page. */
export function WelcomeHeader({ roleLabel, name }: WelcomeHeaderProps) {
  return (
    <>
      <p className="text-sm font-medium uppercase tracking-widest text-muted">{roleLabel}</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Welcome, {name}</h1>
    </>
  );
}
