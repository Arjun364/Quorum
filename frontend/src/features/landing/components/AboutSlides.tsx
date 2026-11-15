import { WordReveal } from '@/shared';
import { SLIDES } from '../constants';
import { usePinnedSlides } from '../hooks';
import type { AboutSlidesProps } from '../types';
import { SlideMock } from './SlideMock';

/** The "about the application" section: a pinned track of four slides that slides sideways as the page scrolls (stacked on phones), one slide per stage of a meeting. */
export function AboutSlides({ className = '' }: AboutSlidesProps) {
  const { sectionRef, trackRef, barRef, active, pinned } = usePinnedSlides(SLIDES.length);

  return (
    <section
      ref={sectionRef}
      id="about"
      aria-labelledby="about-heading"
      className={`relative ${pinned ? 'h-[320vh]' : ''} ${className}`}
    >
      <div className={pinned ? 'sticky top-0 flex h-dvh flex-col justify-center overflow-hidden' : 'py-16'}>
        <div className="mx-auto w-full max-w-5xl px-5">
          <p className="eyebrow">About the application</p>
          <WordReveal as="h2" onView text="One meeting, four stages." className="mt-3 text-4xl font-medium leading-[1.05] sm:text-5xl" />
          <span id="about-heading" className="sr-only">About the application</span>
        </div>

        <div className={pinned ? 'mt-10 overflow-hidden' : 'mt-10'}>
          <div ref={trackRef} className={`flex gap-5 px-5 will-change-transform ${pinned ? 'w-max pl-[max(1.25rem,calc((100vw-64rem)/2+1.25rem))] pr-[20vw]' : 'flex-col'}`}>
            {SLIDES.map((slide, index) => (
              <article
                key={slide.id}
                className={`card flex shrink-0 flex-col gap-6 p-6 transition-[opacity,transform] duration-500 sm:p-8 ${
                  pinned ? 'w-[min(80vw,44rem)] md:flex-row md:items-stretch' : ''
                } ${pinned && index !== active ? 'scale-[0.96] opacity-45' : ''}`}
              >
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-6">
                  <span className="num text-5xl font-medium text-accent">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-2xl font-medium leading-tight">{slide.title}</h3>
                    <p className="mt-3 text-sm text-muted text-pretty">{slide.body}</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1 rounded-lg border border-line bg-surface p-5 shadow-[var(--shadow-2)]">
                  <SlideMock id={slide.id} />
                </div>
              </article>
            ))}
          </div>
        </div>

        {pinned && (
          <div className="mx-auto mt-10 w-full max-w-5xl px-5" aria-hidden="true">
            <div className="h-px overflow-hidden bg-line">
              <div ref={barRef} className="h-full origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />
            </div>
            <p className="num mt-3 text-xs text-muted">
              {String(active + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}