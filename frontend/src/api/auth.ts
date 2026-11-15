import type { AuthResponse, User } from '../features/auth/types';
import { apiFetch, setAccessToken } from './client';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const session = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  setAccessToken(session.accessToken);
  return session;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST', auth: false });
  } finally {
    setAccessToken(null);
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<AuthResponse> {
  const session = await apiFetch<AuthResponse>('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
  setAccessToken(session.accessToken);
  return session;
}

export const me = (): Promise<User> => apiFetch<User>('/auth/me');
