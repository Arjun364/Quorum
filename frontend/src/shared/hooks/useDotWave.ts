import { useEffect } from 'react';
import type { RefObject } from 'react';
import { prefersReducedMotion } from '../utils';

interface Ripple {
  x: number;
  y: number;
  at: number;
}

/**
 * Draws a grid of dots that swell and fade in a slow travelling wave. The dots near the pointer grow and
 * lean away from it, and a click sends a ring across the grid. Pauses when off screen; draws one still frame
 * under reduced motion. The dot colour is the page's `--accent`.
 */
export function useDotWave(canvasRef: RefObject<HTMLCanvasElement | null>, spacing: number, intensity: number): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = prefersReducedMotion();
    const ripples: Ripple[] = [];
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let colour = '90, 185, 252';

    /** Reads the accent as "r, g, b" so alpha can vary per dot; re-read now and then because a brand theme may load late. */
    const readColour = (): void => {
      const value = getComputedStyle(canvas).getPropertyValue('--accent').trim();
      const match = /^#([0-9a-f]{6})$/i.exec(value);
      if (match) {
        const n = parseInt(match[1], 16);
        colour = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
      }
    };

    const resize = (): void => {
      const box = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
      width = box.width;
      height = box.height;
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (now: number): void => {
      const t = reduced ? 0 : now / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.16;
      pointer.y += (pointer.ty - pointer.y) * 0.16;
      ctx.clearRect(0, 0, width, height);

      for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].at > 1800) ripples.splice(i, 1);

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          let x = col * spacing;
          let y = row * spacing;
          const wave = Math.sin(x * 0.011 + t * 0.9) * Math.cos(y * 0.013 - t * 0.7);
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.hypot(dx, dy);
          const near = Math.max(0, 1 - dist / 170) ** 2;
          if (near > 0 && dist > 0.001) {
            x += (dx / dist) * near * 9 * intensity;
            y += (dy / dist) * near * 9 * intensity;
          }
          let ring = 0;
          for (const r of ripples) {
            const age = (now - r.at) / 1000;
            const gap = Math.abs(Math.hypot(x - r.x, y - r.y) - age * 520);
            ring += Math.max(0, 1 - gap / 70) * Math.max(0, 1 - age / 1.7);
          }
          const size = 0.9 + (wave + 1) * 0.55 * intensity + near * 2.4 * intensity + ring * 3.2;
          const alpha = Math.min(1, 0.1 + (wave + 1) * 0.09 * intensity + near * 0.65 * intensity + ring * 0.8);
          ctx.fillStyle = `rgba(${colour}, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = (now: number): void => {
      if (visible) draw(now);
      frame = requestAnimationFrame(loop);
    };

    const onMove = (event: PointerEvent): void => {
      const box = canvas.getBoundingClientRect();
      pointer.tx = event.clientX - box.left;
      pointer.ty = event.clientY - box.top;
    };
    const onLeave = (): void => {
      pointer.tx = -9999;
      pointer.ty = -9999;
    };
    const onClick = (event: PointerEvent): void => {
      const box = canvas.getBoundingClientRect();
      if (event.clientY < box.top || event.clientY > box.bottom) return;
      ripples.push({ x: event.clientX - box.left, y: event.clientY - box.top, at: performance.now() });
    };

    resize();
    readColour();
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    observer.observe(canvas);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const colourTimer = window.setInterval(readColour, 2000);

    if (reduced) {
      draw(0);
    } else {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
      window.addEventListener('pointerdown', onClick, { passive: true });
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      window.clearInterval(colourTimer);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onClick);
    };
  }, [canvasRef, spacing, intensity]);
}