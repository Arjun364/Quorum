import { useRef } from 'react';
import { useHeroScene } from '../hooks/useHeroScene';

/** The hero's 3D blob (Three.js). Shows the plain glowing ring while it loads or when WebGL is not available. */
export function HeroScene() {
  const host = useRef<HTMLDivElement>(null);
  useHeroScene(host);
  return (
    <div ref={host} aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none">
      <div data-fallback className="orb absolute inset-[8%] transition-opacity duration-500" />
    </div>
  );
}