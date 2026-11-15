import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../utils';

/** Rolls a number from its previous value to `target` with an ease-out curve; jumps straight there under reduced motion. */
export function useCountUp(target: number, durationMs = 900): number {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion() || from.current === target) {
      from.current = target;
      const jump = requestAnimationFrame(() => setShown(target));
      return () => cancelAnimationFrame(jump);
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(origin + (target - origin) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return shown;
}