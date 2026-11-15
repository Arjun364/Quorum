import { companyAddress } from '@/config';
import { isValidSlugFormat } from '@/features/company';
import { useState } from 'react';
import type { FormEvent } from 'react';

/** Owns the "find your company" form: turns the typed company address into a redirect to that company's sign-in page. */
export function useFindCompany() {
  const [error, setError] = useState<string | null>(null);

  /** Validates the typed address and sends the visitor to the company's sign-in page. */
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get('slug') ?? '').trim().toLowerCase();
    if (!isValidSlugFormat(value)) {
      setError('Enter your company address, for example acme.');
      return;
    }
    setError(null);
    window.location.assign(companyAddress(value, '/login'));
  };

  return { error, handleSubmit };
}