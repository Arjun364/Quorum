import { stagger } from '@/shared';
import type { WelcomeHeaderProps } from '../types';

/** Renders the role and company, and the personal greeting, at the top of the home page. */
export function WelcomeHeader({ roleLabel, name, companyName }: WelcomeHeaderProps) {
  return (
    <header>
      <p data-enter className="eyebrow">
        {roleLabel} · {companyName}
      </p>
      <h1 data-enter style={stagger(1)} className="mt-3 text-4xl font-medium leading-[1.05] sm:text-5xl">
        Welcome, {name.split(' ')[0]}
      </h1>
    </header>
  );
}