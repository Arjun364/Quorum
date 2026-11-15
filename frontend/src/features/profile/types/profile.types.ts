/** A person's own profile. */
export interface Profile {
  id: number;
  name: string;
  email: string;
  jobTitle: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

/** What a person can change about themselves. */
export interface ProfilePayload {
  name: string;
  jobTitle: string | null;
  phone: string | null;
}

/** Inline validation messages of the profile form. */
export interface ProfileErrors {
  name?: string;
  phone?: string;
}