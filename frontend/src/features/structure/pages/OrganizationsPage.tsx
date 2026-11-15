import { Alert, Button, stagger } from '@/shared';
import { NameCodeDialog, OrganizationCard } from '../components';
import { useOrganizations } from '../hooks';

/** Organizations page for the company head: the list and the new-organization dialog; all behaviour comes from `useOrganizations`. */
export function OrganizationsPage() {
  const page = useOrganizations();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p data-enter className="eyebrow">
            Company
          </p>
          <h1 data-enter style={stagger(1)} className="mt-3 text-4xl font-medium leading-[1.05] sm:text-5xl">
            Organizations
          </h1>
          <p data-enter style={stagger(2)} className="mt-2 text-muted">
            Units inside your company. Each holds its departments.
          </p>
        </div>
        <Button onClick={page.openDialog}>New Organization</Button>
      </div>

      <div className="mt-10">
        {page.loadFailed && <Alert tone="error">We could not load your organizations. Reload the page to try again.</Alert>}
        {page.isLoading && <p role="status" className="text-muted">Loading…</p>}
        {!page.isLoading && page.organizations.length === 0 && !page.loadFailed && (
          <div className="card border-dashed px-6 py-16 text-center">
            <p className="font-medium">No organizations yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">Create the first one, then add its departments.</p>
          </div>
        )}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {page.organizations.map((organization, index) => (
            <li key={organization.id} data-enter style={stagger(index + 3)}>
              <OrganizationCard organization={organization} />
            </li>
          ))}
        </ul>
      </div>

      <NameCodeDialog
        open={page.dialogOpen}
        title="New Organization"
        description="A unit inside your company, such as a division or branch."
        nameLabel="Organization Name"
        submitLabel="Create Organization"
        isSubmitting={page.isCreating}
        error={page.error}
        onSubmit={page.handleCreate}
        onClose={page.closeDialog}
      />
    </>
  );
}