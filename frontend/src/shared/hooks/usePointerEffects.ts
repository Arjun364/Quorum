import { useEffect } from 'react';
import type { RefObject } from 'react';
import { hasFinePointer, prefersReducedMotion } from '../utils';

const INTERACTIVE = 'a[href], button, [role="button"], summary, select, label[for], [data-cursor]';
const TEXT_INPUT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea';

/**
 * Pointer effects for the whole app, mounted once: a ring that trails the mouse and swells over anything clickable
 * (with an optional `data-cursor-label`), shrinks on press and steps aside over text fields; and the position
 * of the pointer inside the card under it (`--mx`, `--my`) so cards can light up where the mouse is.
 * Does nothing on touch screens or under reduced motion.
 */
export function usePointerEffects(ringRef: RefObject<HTMLDivElement | null>, labelRef: RefObject<HTMLSpanElement | null>): void {
  useEffect(() => {
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!ring || !label || !hasFinePointer() || prefersReducedMotion()) return;

    let tx = -100;
    let ty = -100;
    let x = tx;
    let y = ty;
    let frame = 0;
    let seen = false;

    const tick = (): void => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    const setState = (state: string): void => {
      if (ring.dataset.state !== state) ring.dataset.state = state;
    };

    const onMove = (event: PointerEvent): void => {
      tx = event.clientX;
      ty = event.clientY;
      if (!seen) {
        seen = true;
        x = tx;
        y = ty;
        ring.dataset.visible = 'true';
      }
      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest<HTMLElement>(INTERACTIVE) ?? null;
      if (target?.closest(TEXT_INPUT)) setState('text');
      else if (interactive) {
        setState('hover');
        label.textContent = interactive.closest<HTMLElement>('[data-cursor-label]')?.dataset.cursorLabel ?? '';
      } else setState('idle');

      const nextCard = target?.closest<HTMLElement>('.card');
      if (nextCard) {
        const box = nextCard.getBoundingClientRect();
        nextCard.style.setProperty('--mx', `${event.clientX - box.left}px`);
        nextCard.style.setProperty('--my', `${event.clientY - box.top}px`);
      }
    };
    const onDown = (): void => ring.setAttribute('data-pressed', 'true');
    const onUp = (): void => ring.removeAttribute('data-pressed');
    const onLeave = (): void => {
      ring.dataset.visible = 'false';
      seen = false;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [ringRef, labelRef]);
}