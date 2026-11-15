/** Problem-details body returned by the API for every error response. */
export interface ProblemBody {
  title?: string;
  detail?: string;
  code?: string;
  errors?: string[];
}

/** Options accepted by `apiFetch`. */
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Public endpoints (login) skip the bearer header and the refresh-on-401 retry. */
  auth?: boolean;
}

/** Session payload returned by login, refresh and change-password. */
export interface SessionPayload {
  accessToken: string;
  expiresInSeconds: number;
  user: SessionUser;
}

/** User fields the API returns with a session. */
export interface SessionUser {
  id: number;
  name: string;
  email: string;
  systemRole: SystemRole;
  companyId: number | null;
  departmentId: number | null;
  jobTitle: string | null;
  phone: string | null;
  avatarUrl: string | null;
  mustChangePassword: boolean;
}

/** One password requirement and whether the typed password meets it. */
export interface PasswordRule {
  label: string;
  met: boolean;
}

/** Roles stored on the user; the note-taker is per meeting and is not a role. */
export type SystemRole = 'PlatformOwner' | 'CompanyHead' | 'DepartmentHead' | 'Employee';
