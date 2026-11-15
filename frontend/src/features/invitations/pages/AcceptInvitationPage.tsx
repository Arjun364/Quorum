import { BrandMark, useCompanyPublic } from '@/features/company';
import { ROLE_LABELS } from '@/features/auth';
import { stagger } from '@/shared';
import { AcceptInvitationForm } from '../components';
import { useAcceptInvitation } from '../hooks';

/** Landing page of an invitation email: the invited person sets their name and password; behaviour comes from `useAcceptInvitation`. */
export function AcceptInvitationPage() {
  const page = useAcceptInvitation();
  const { company } = useCompanyPublic();
  const name = company?.name ?? 'Quorum';

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-xl items-center gap-2.5 px-5 py-6">
        <BrandMark name={name} logoUrl={company?.logoUrl ?? null} />
        <span className="font-display text-lg font-semibold tracking-tight">{name}</span>
      </header>
      <main id="main" className="mx-auto max-w-xl px-5 pb-20">
        {page.isLoading && <p role="status" className="text-muted">Loading your invitation…</p>}
        {page.isInvalid && (
          <>
            <h1 className="text-4xl font-medium leading-[1.05] sm:text-5xl">This invitation does not work</h1>
            <p className="mt-3 text-muted text-pretty">It may have been used, revoked or expired. Ask the person who invited you for a new one.</p>
          </>
        )}
        {page.invitation && (
          <>
            <p data-enter className="eyebrow">
              You are invited
            </p>
            <h1 data-enter style={stagger(1)} className="mt-2 text-4xl font-medium leading-[1.05] sm:text-5xl">
              Welcome, {page.invitation.name.split(' ')[0]}
            </h1>
            <p data-enter style={stagger(2)} className="mt-2 text-muted text-pretty">
              You will be the {ROLE_LABELS[page.invitation.role]} of <strong className="text-ink">{page.invitation.departmentName}</strong> at {page.invitation.companyName}.
            </p>
            <div data-enter style={stagger(3)}>
              <AcceptInvitationForm
                invitation={page.invitation}
                name={page.name}
                errors={page.errors}
                formError={page.formError}
                rules={page.rules}
                isSubmitting={page.isSubmitting}
                onNameChange={page.handleNameChange}
                onPasswordChange={page.handlePasswordChange}
                onSubmit={page.handleSubmit}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}