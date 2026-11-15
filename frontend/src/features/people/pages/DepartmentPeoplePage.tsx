import { Alert, Button, stagger } from '@/shared';
import { Link } from 'react-router-dom';
import { DeactivateDialog, InvitationRow, InviteEmployeeDialog, MoveDialog, PersonRow } from '../components';
import { useDepartmentPeople } from '../hooks';

/** A department's people: members, open invitations, and for its managers inviting, moving and deactivating; all behaviour comes from `useDepartmentPeople`. */
export function DepartmentPeoplePage() {
  const page = useDepartmentPeople();

  if (page.loadFailed) {
    return (
      <Alert tone="error">
        You cannot open this department’s people. <Link to="/" className="link-draw font-semibold">Back to home</Link>
      </Alert>
    );
  }
  if (page.isLoading || !page.data) return <p role="status" className="text-muted">Loading…</p>;
  const { department, canManage, members, invitations } = page.data;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p data-enter className="eyebrow">
            Department · <span className="num">{department.code}</span>
          </p>
          <h1 data-enter style={stagger(1)} className="mt-3 text-4xl font-medium leading-[1.05] sm:text-5xl">
            {department.name}
          </h1>
          <p data-enter style={stagger(2)} className="mt-2 text-muted">
            <span className="num">{members.length}</span> {members.length === 1 ? 'person' : 'people'}
            {invitations.length > 0 && <> · <span className="num">{invitations.length}</span> invited</>}
          </p>
        </div>
        {canManage && (
          <Button onClick={page.openInvite} data-cursor-label="Invite">
            Invite Employee
          </Button>
        )}
      </div>

      {page.notice && (
        <div className="mt-6" role="status">
          <Alert tone="success">
            {page.notice}{' '}
            <button type="button" onClick={page.dismissNotice} className="link-draw font-semibold">
              Dismiss
            </button>
          </Alert>
        </div>
      )}

      <section aria-label="People" data-enter style={stagger(3)} className="card mt-10 overflow-hidden">
        <ul className="divide-y divide-line">
          {members.map((person) => (
            <PersonRow key={person.id} person={person} canManage={canManage} isSelf={person.id === page.selfId} onMove={page.openMove} onDeactivate={page.openDeactivate} />
          ))}
          {invitations.map((invitation) => (
            <InvitationRow key={`i-${invitation.id}`} invitation={invitation} isBusy={page.isBusy} onResend={page.handleResend} onRevoke={page.handleRevoke} />
          ))}
        </ul>
      </section>

      <InviteEmployeeDialog
        open={page.inviteOpen}
        departmentName={department.name}
        isSubmitting={page.isInviting}
        error={page.inviteError}
        onSubmit={page.handleInvite}
        onClose={page.closeInvite}
      />
      <MoveDialog
        key={page.moveTarget?.id ?? 'none'}
        person={page.moveTarget}
        fromDepartmentId={page.departmentId}
        options={page.moveOptions}
        isSubmitting={page.isMoving}
        error={page.moveError}
        onSubmit={page.handleMove}
        onClose={page.closeMove}
      />
      <DeactivateDialog person={page.deactivateTarget} isSubmitting={page.isDeactivating} error={page.deactivateError} onConfirm={page.handleDeactivate} onClose={page.closeDeactivate} />
    </>
  );
}