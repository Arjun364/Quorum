import { Button, DotWave, Logo, WordReveal, stagger } from '@/shared';
import { Link } from 'react-router-dom';
import { AboutSlides, FindCompanyForm } from '../components';
import { SECURITY_FACTS } from '../constants';

/** Public website on the platform's own address: the hero over a living dot grid, the pinned story of a meeting, how data is kept, and the two ways in. */
export function LandingPage() {
  return (
    <div className="app-ground min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
        Skip to Main Content
      </a>
      <header className="relative z-20 mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <Logo />
        <nav aria-label="Website" className="flex items-center gap-2 sm:gap-6">
          <a href="#about" className="link-draw hidden text-sm font-medium text-muted hover:text-ink sm:block">
            About
          </a>
          <a href="#find" className="link-draw hidden text-sm font-medium text-muted hover:text-ink sm:block">
            Sign in
          </a>
          <Link to="/start">
            <Button variant="secondary">Start Your Organization</Button>
          </Link>
        </nav>
      </header>

      <main id="main">
        <section className="relative isolate overflow-hidden">
          <DotWave spacing={30} intensity={1} className="-z-10 [mask-image:radial-gradient(ellipse_90%_80%_at_50%_40%,#000_30%,transparent_85%)]" />
          <div className="mx-auto grid max-w-5xl items-center gap-12 px-5 pb-28 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div>
              <p data-enter className="eyebrow">
                Monthly department meetings
              </p>
              <WordReveal text="Every point has an owner. Every meeting ends confirmed." className="mt-4 max-w-3xl text-5xl font-medium leading-[1.03] sm:text-7xl" delayMs={150} />
              <p data-enter style={stagger(4)} className="mt-6 max-w-xl text-lg text-muted text-pretty">
                Quorum replaces the spreadsheet of minutes. The head runs the meeting, a note-taker compiles it, each owner confirms their own points, and unfinished work carries over by itself.
              </p>
              <div data-enter style={stagger(5)} className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/start" data-cursor-label="Go">
                  <Button>Start Your Organization</Button>
                </Link>
                <a href="#about" className="link-draw px-2 text-sm font-medium text-muted hover:text-ink">
                  See how a meeting runs
                </a>
              </div>
            </div>
            <div aria-hidden="true" data-enter="fade" className="orb mx-auto w-full max-w-sm lg:max-w-none" />
          </div>
        </section>

        <AboutSlides />

        <section aria-labelledby="safe-heading" className="mx-auto max-w-5xl px-5 py-20">
          <p className="eyebrow">Security</p>
          <WordReveal as="h2" onView text="How your data is kept" className="mt-3 text-4xl font-medium leading-[1.05] sm:text-5xl" />
          <span id="safe-heading" className="sr-only">How your data is kept</span>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {SECURITY_FACTS.map((fact, index) => (
              <li key={fact} className="card p-6 text-sm text-pretty">
                <span className="num text-accent">{String(index + 1).padStart(2, '0')}</span>
                <p className="mt-3 text-base">{fact}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="find" aria-labelledby="find-heading" className="border-t border-line bg-surface/60">
          <div className="mx-auto max-w-5xl px-5 py-20">
            <p className="eyebrow">Sign in</p>
            <h2 id="find-heading" className="mt-3 text-4xl font-medium leading-[1.05] sm:text-5xl">
              Find your company
            </h2>
            <p className="mt-3 max-w-lg text-muted">Each company signs in on its own address. Type yours to go there.</p>
            <div className="mt-8 max-w-xl">
              <FindCompanyForm />
            </div>
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-5xl px-5 py-10 text-sm text-muted">Quorum. Minutes that stay inside your company.</footer>
    </div>
  );
}