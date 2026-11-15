import type { IconName, IconProps } from '../types';

const PATHS: Record<IconName, string> = {
  home: 'M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5.5h4V20',
  building: 'M5 20V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V20M15 9h3.5A1.5 1.5 0 0 1 20 10.5V20M3 20h18M8.5 8h3M8.5 12h3M8.5 16h3',
  palette: 'M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-.9 2-1.8 0-1.4-1.3-1.7-1.3-2.9 0-.9.7-1.5 1.6-1.5H17a3.5 3.5 0 0 0 3.5-3.5C20.5 6.7 16.7 3.5 12 3.5ZM7.8 11.5h.01M10.5 7.8h.01M14.5 7.8h.01',
  logout: 'M14 4.5h4.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H14M10 16.5 14.5 12 10 7.5M14.5 12H4',
  check: 'm5 12.5 4.2 4.2L19 7',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.4-3.3 3-5.5 6.5-5.5s6.1 2.2 6.5 5.5M16 4.4a3.5 3.5 0 0 1 0 6.2M18 14.8c1.9.6 3.2 2.3 3.5 5.2',
  mail: 'M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6',
  clock: 'M12 7.5V12l3 2M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z',
};

/** Renders one of the named line icons in the current text colour; decorative, so it is hidden from screen readers. */
export function Icon({ name, className = 'size-5' }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}