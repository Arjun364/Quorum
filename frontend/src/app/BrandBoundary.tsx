import { useCompanyPublic } from '@/features/company';
import { applyBrandTheme } from '@/shared';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SplashScreen } from './guards';

/** On a company's address: applies its brand colours and page title, and shows a plain screen when the address belongs to no company. */
export function BrandBoundary() {
  const { slug, company, isLoading, notFound } = useCompanyPublic();

  useEffect(() => {
    if (company) applyBrandTheme(company.accentColor);
    document.title = company ? `${company.name} · Quorum` : 'Quorum';
  }, [company]);

  if (slug === null) return <Outlet />;
  if (isLoading) return <SplashScreen />;
  if (notFound) {
    return (
      <main id="main" className="mx-auto grid min-h-dvh max-w-md place-content-center px-5 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">No company at this address</h1>
        <p className="mt-3 text-muted text-pretty">Check the address, or ask your company head for the right link.</p>
      </main>
    );
  }
  return <Outlet />;
}