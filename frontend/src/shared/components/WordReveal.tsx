import { useInView } from '../hooks';
import type { WordRevealProps } from '../types';

/** Renders a headline whose words rise out of a clip one after another, on load or when scrolled into view; the full text stays readable to screen readers. */
export function WordReveal({ text, as = 'h1', className = '', onView = false, delayMs = 0 }: WordRevealProps) {
  const { ref, seen } = useInView<HTMLElement>(0.4);
  const Tag = as;
  const running = !onView || seen;
  return (
    <Tag ref={ref as never} aria-label={text} className={className}>
      {text.split(' ').map((word, index) => (
        <span key={`${word}-${index}`} aria-hidden="true" className="word-clip">
          <span className="word-rise" data-run={running} style={{ animationDelay: `${delayMs + index * 70}ms` }}>
            {word}
          </span>
          {index < text.split(' ').length - 1 ? '\u00a0' : ''}
        </span>
      ))}
    </Tag>
  );
}