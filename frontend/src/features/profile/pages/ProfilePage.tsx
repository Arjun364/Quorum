import { stagger } from '@/shared';
import { AvatarUploader, ProfileForm } from '../components';
import { useProfile } from '../hooks';

/** The signed-in person's own profile: photo and details; all behaviour comes from `useProfile`. */
export function ProfilePage() {
  const page = useProfile();
  if (page.isLoading || !page.profile) return <p role="status" className="text-muted">Loading…</p>;

  return (
    <>
      <p data-enter className="eyebrow">
        Your account
      </p>
      <h1 data-enter style={stagger(1)} className="mt-3 text-4xl font-medium leading-[1.05] sm:text-5xl">
        Profile
      </h1>
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section data-enter style={stagger(2)} className="card p-6">
          <AvatarUploader name={page.profile.name} url={page.profile.avatarUrl} isUploading={page.isUploading} error={page.photoError} onFile={page.handlePhoto} onRemove={page.handleRemovePhoto} />
        </section>
        <section data-enter style={stagger(3)} className="card p-6">
          <ProfileForm profile={page.profile} errors={page.errors} formError={page.formError} saved={page.saved} isSaving={page.isSaving} onEdit={page.markEdited} onSubmit={page.handleSubmit} />
        </section>
      </div>
    </>
  );
}