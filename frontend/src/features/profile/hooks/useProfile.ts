import { patchSessionUser } from '@/features/auth';
import { companyApi } from '@/features/company';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { profileApi } from '../api';
import { AVATAR_MAX_BYTES, AVATAR_TYPES, PROFILE_MESSAGES } from '../constants';
import type { Profile, ProfileErrors } from '../types';
import { checkPhotoFile, getProfileError } from '../utils';

/** Owns the profile screen: loads the person's details, validates and saves them, and uploads or removes the photo. */
export function useProfile() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['profile'], queryFn: profileApi.get });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  /** Stores a fresh profile in the cache and in the signed-in session so the sidebar updates at once. */
  const apply = (profile: Profile): void => {
    queryClient.setQueryData(['profile'], profile);
    patchSessionUser({ name: profile.name, jobTitle: profile.jobTitle, phone: profile.phone, avatarUrl: profile.avatarUrl });
  };

  const save = useMutation({
    mutationFn: profileApi.update,
    onSuccess: (profile) => {
      apply(profile);
      setSaved(true);
    },
    onError: (e) => setFormError(getProfileError(e)),
  });
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const signature = await profileApi.avatarSignature();
      const uploaded = await companyApi.uploadToImageService(signature, file);
      return profileApi.setAvatar(uploaded);
    },
    onSuccess: (profile) => {
      apply(profile);
      setPhotoError(null);
    },
    onError: () => setPhotoError(PROFILE_MESSAGES.photoFailed),
  });
  const remove = useMutation({ mutationFn: profileApi.removeAvatar, onSuccess: apply });

  /** Validates the form and saves it. */
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const jobTitle = String(data.get('jobTitle') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const found: ProfileErrors = {};
    if (!name) found.name = PROFILE_MESSAGES.nameRequired;
    if (!/^[0-9+()\-\s.]*$/.test(phone)) found.phone = PROFILE_MESSAGES.phoneFormat;
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;
    save.mutate({ name, jobTitle: jobTitle || null, phone: phone || null });
  };

  /** Checks the chosen photo locally, then uploads it. */
  const handlePhoto = (file: File): void => {
    const problem = checkPhotoFile(file, AVATAR_TYPES, AVATAR_MAX_BYTES);
    if (problem) return setPhotoError(problem);
    setPhotoError(null);
    upload.mutate(file);
  };

  return {
    profile: query.data ?? null,
    isLoading: query.isPending,
    errors,
    formError,
    saved,
    isSaving: save.isPending,
    isUploading: upload.isPending,
    photoError,
    markEdited: () => setSaved(false),
    handleSubmit,
    handlePhoto,
    handleRemovePhoto: () => remove.mutate(),
  };
}