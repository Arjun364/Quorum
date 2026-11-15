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
  organizationId: number | null;
  departmentId: number | null;
  mustChangePassword: boolean;
}

/** Roles stored on the user; the note-taker is per meeting and is not a role. */
export type SystemRole = 'PlatformOwner' | 'Admin' | 'CompanyHead' | 'DepartmentHead' | 'Employee';
