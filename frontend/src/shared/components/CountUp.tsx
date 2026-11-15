import { useCountUp } from '../hooks';
import type { CountUpProps } from '../types';

/** Renders a whole number that rolls up from its previous value, in the mono face. */
export function CountUp({ value, suffix = '', durationMs = 900, className = '' }: CountUpProps) {
  const shown = useCountUp(value, durationMs);
  return (
    <span className={`num ${className}`} aria-label={`${value}${suffix}`}>
      <span aria-hidden="true">
        {shown}
        {suffix}
      </span>
    </span>
  );
}