import { Button, Logo, stagger } from '@/shared';
import { Link } from 'react-router-dom';
import { FindCompanyForm } from '../components';
import { HOW_IT_WORKS, SECURITY_FACTS } from '../constants';

/** Public website on the platform's own address: what Quorum does, how it works, how data is kept, and the two ways in. */
export function LandingPage() {
  return (
    <div className="app-ground min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
        Skip to Main Content
      </a>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <Logo />
        <Link to="/start">
          <Button variant="secondary">Start Your Organization</Button>
        </Link>
      </header>
      <main id="main">
        <section className="mx-auto grid max-w-5xl items-center gap-12 px-5 pb-24 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
          <p data-enter className="eyebrow">
            Monthly department meetings
          </p>
          <h1 data-enter style={stagger(1)} className="mt-4 max-w-3xl text-5xl font-medium leading-[1.03] text-balance sm:text-7xl">
            Every point has an owner. Every meeting ends confirmed.
          </h1>
          <p data-enter style={stagger(2)} className="mt-6 max-w-xl text-lg text-muted text-pretty">
            Quorum replaces the spreadsheet of minutes. The head runs the meeting, a note-taker compiles it, each owner confirms their own points, and unfinished work carries over by itself.
          </p>
          <div data-enter style={stagger(3)} className="mt-8 flex flex-wrap gap-3">
            <Link to="/start">
              <Button>Start Your Organization</Button>
            </Link>
            <a href="#find" className="btn-ghost inline-flex items-center px-4 text-sm font-medium text-muted hover:text-ink">
              Already registered?
            </a>
          </div>
        </div>
          <div aria-hidden="true" data-enter="fade" className="orb mx-auto w-full max-w-sm lg:max-w-none" />
        </section>

        <section aria-labelledby="how-heading" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 id="how-heading" className="text-3xl font-medium leading-tight">
              How it works
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step, index) => (
                <li key={step.title}>
                  <span className="font-display text-4xl font-semibold text-accent tabular-nums">{index + 1}</span>
                  <h3 className="mt-3 font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted text-pretty">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="safe-heading" className="mx-auto max-w-5xl px-5 py-16">
          <h2 id="safe-heading" className="text-3xl font-medium leading-tight">
            How your data is kept
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {SECURITY_FACTS.map((fact) => (
              <li key={fact} className="card p-5 text-sm text-pretty">
                {fact}
              </li>
            ))}
          </ul>
        </section>

        <section id="find" aria-labelledby="find-heading" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 id="find-heading" className="text-3xl font-medium leading-tight">
              Find your company
            </h2>
            <p className="mt-2 max-w-lg text-muted">Each company signs in on its own address. Type yours to go there.</p>
            <div className="mt-6 max-w-xl">
              <FindCompanyForm />
            </div>
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-5xl px-5 py-10 text-sm text-muted">Quorum. Minutes that stay inside your company.</footer>
    </div>
  );
}