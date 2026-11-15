export type SystemRole = 'PlatformOwner' | 'Admin' | 'CompanyHead' | 'DepartmentHead' | 'Employee';

export interface User {
  id: number;
  name: string;
  email: string;
  systemRole: SystemRole;
  organizationId: number | null;
  departmentId: number | null;
  mustChangePassword: boolean;
}

export interface AuthResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: User;
}

export const ROLE_LABELS: Record<SystemRole, string> = {
  PlatformOwner: 'Platform Owner',
  Admin: 'Administrator',
  CompanyHead: 'Company Head',
  DepartmentHead: 'Department Head',
  Employee: 'Employee',
};
