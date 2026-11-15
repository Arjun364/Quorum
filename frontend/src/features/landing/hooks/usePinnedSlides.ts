import { prefersReducedMotion, useMediaQuery } from '@/shared';
import { useEffect, useRef, useState } from 'react';

/**
 * Pins a tall section and turns the page's vertical scroll into a sideways slide of its track. Gives back the
 * active slide, the 0-1 progress and whether pinning applies (wide screens without a reduced-motion request;
 * otherwise the slides simply stack).
 */
export function usePinnedSlides(count: number) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const wide = useMediaQuery('(min-width: 768px)');
  const calm = useMediaQuery('(prefers-reduced-motion: reduce)');
  const pinned = wide && !calm && !prefersReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const bar = barRef.current;
    if (!section || !track || !bar || !pinned) return;
    let frame = 0;

    const update = (): void => {
      frame = 0;
      const box = section.getBoundingClientRect();
      const span = box.height - window.innerHeight;
      const progress = Math.min(1, Math.max(0, span > 0 ? -box.top / span : 0));
      const travel = Math.max(0, track.scrollWidth - track.parentElement!.clientWidth);
      track.style.transform = `translate3d(${-progress * travel}px, 0, 0)`;
      bar.style.transform = `scaleX(${progress})`;
      setActive(Math.min(count - 1, Math.round(progress * (count - 1))));
    };
    const request = (): void => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      track.style.transform = '';
      bar.style.transform = '';
    };
  }, [pinned, count]);

  return { sectionRef, trackRef, barRef, active, pinned };
}