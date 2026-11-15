import { WordReveal } from '@/shared';
import type { WelcomeHeaderProps } from '../types';

/** Renders the role and company, and the personal greeting, at the top of the home page. */
export function WelcomeHeader({ roleLabel, name, companyName }: WelcomeHeaderProps) {
  return (
    <header>
      <p data-enter className="eyebrow">
        {roleLabel} · {companyName}
      </p>
      <WordReveal text={`Welcome, ${name.split(' ')[0]}`} className="mt-3 text-4xl font-medium leading-[1.05] sm:text-6xl" delayMs={120} />
    </header>
  );
}