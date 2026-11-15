import { useRef } from 'react';
import { useDotWave } from '../hooks';
import type { DotWaveProps } from '../types';

/** A canvas of dots that wave slowly, lean away from the mouse and ripple on click; sits behind content, never takes clicks. */
export function DotWave({ spacing = 30, intensity = 1, className = '' }: DotWaveProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useDotWave(ref, spacing, intensity);
  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 size-full ${className}`} />;
}