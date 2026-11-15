import { Alert, Button, stagger } from '@/shared';
import { Link } from 'react-router-dom';
import { DepartmentRow, InviteHeadDialog, NameCodeDialog } from '../components';
import { useOrganizationDetail } from '../hooks';

/** One organization's page: its departments and their heads; all behaviour comes from `useOrganizationDetail`. */
export function OrganizationDetailPage() {
  const page = useOrganizationDetail();

  if (page.notFound) {
    return (
      <Alert tone="error">
        This organization does not exist. <Link to="/organizations" className="link-draw font-semibold">Back to organizations</Link>
      </Alert>
    );
  }
  if (page.isLoading || !page.organization) return <p role="status" className="text-muted">Loading…</p>;

  return (
    <>
      <nav aria-label="Breadcrumb" className="eyebrow">
        <Link to="/organizations" className="link-draw hover:text-ink">Organizations</Link> <span aria-hidden="true">›</span> {page.organization.name}
      </nav>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 data-enter className="text-4xl font-medium leading-[1.05] sm:text-5xl">
            {page.organization.name}
          </h1>
          <p data-enter style={stagger(1)} className="mt-2 text-muted">
            <span className="num">{page.organization.code}</span> · {page.departments.length} {page.departments.length === 1 ? 'department' : 'departments'}
          </p>
        </div>
        <Button onClick={page.openDepartmentDialog}>New Department</Button>
      </div>

      <div className="card mt-10 overflow-hidden">
        {page.departments.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-medium">No departments yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">Add a department, then invite its head by email.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {page.departments.map((department) => (
              <DepartmentRow
                key={department.id}
                department={department}
                isBusy={page.isBusy}
                onInvite={page.openInvite}
                onResend={page.handleResend}
                onRevoke={page.handleRevoke}
              />
            ))}
          </ul>
        )}
      </div>

      <NameCodeDialog
        open={page.departmentDialogOpen}
        title="New Department"
        description={`A department inside ${page.organization.name}.`}
        nameLabel="Department Name"
        submitLabel="Create Department"
        isSubmitting={page.isCreatingDepartment}
        error={page.departmentError}
        onSubmit={page.handleCreateDepartment}
        onClose={page.closeDepartmentDialog}
      />
      <InviteHeadDialog
        open={page.inviteTarget !== null}
        departmentName={page.inviteTarget?.name ?? ''}
        isSubmitting={page.isInviting}
        error={page.inviteError}
        onSubmit={page.handleInvite}
        onClose={page.closeInvite}
      />
    </>
  );
}