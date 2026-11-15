import { apiFetch } from '@/shared';
import type { Profile, ProfilePayload } from '../types';

/** What the browser needs to upload one image straight to the image service. */
export interface AvatarSignature {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export const profileApi = {
  /** Loads the signed-in person's profile. */
  get(): Promise<Profile> {
    return apiFetch<Profile>('/profile');
  },

  /** Saves name, job title and phone. */
  update(payload: ProfilePayload): Promise<Profile> {
    return apiFetch<Profile>('/profile', { method: 'PUT', body: payload });
  },

  /** Asks the server for a signed permission to upload one photo. */
  avatarSignature(): Promise<AvatarSignature> {
    return apiFetch<AvatarSignature>('/profile/avatar/signature', { method: 'POST' });
  },

  /** Saves the photo the browser just uploaded. */
  setAvatar(payload: { publicId: string; url: string }): Promise<Profile> {
    return apiFetch<Profile>('/profile/avatar', { method: 'PUT', body: payload });
  },

  /** Removes the photo. */
  removeAvatar(): Promise<Profile> {
    return apiFetch<Profile>('/profile/avatar', { method: 'DELETE' });
  },
};