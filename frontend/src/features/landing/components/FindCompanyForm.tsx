import { ROOT_HOST } from '@/config';
import { Button, TextField } from '@/shared';
import { useFindCompany } from '../hooks';

/** Renders the "find your company" form of the public website: a company address in, a redirect to its sign-in page out. */
export function FindCompanyForm() {
  const { error, handleSubmit } = useFindCompany();
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <TextField
          label="Company Address"
          name="slug"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          placeholder="acme…"
          hint={`Your address ends with .${ROOT_HOST}`}
          error={error ?? undefined}
        />
      </div>
      <Button type="submit" variant="secondary" className="sm:mt-7">
        Go to Sign In
      </Button>
    </form>
  );
}