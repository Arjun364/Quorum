import type { FormEvent } from 'react';
import type { Profile, ProfileErrors } from './profile.types';

/** Props of the profile form. */
export interface ProfileFormProps {
  profile: Profile;
  errors: ProfileErrors;
  formError: string | null;
  saved: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Props of the photo uploader. */
export interface AvatarUploaderProps {
  name: string;
  url: string | null;
  isUploading: boolean;
  error: string | null;
  onFile: (file: File) => void;
  onRemove: () => void;
}