import type { SystemRole } from '@/features/auth';
import type { EmptyStateCopy } from '../types';

/** Empty-state copy per role until real "waiting for me" items exist (later milestones). */
export const EMPTY_STATE_COPY: Record<SystemRole, EmptyStateCopy> = {
  PlatformOwner: {
    title: 'No organizations yet',
    body: 'Creating organizations and their administrators arrives in the next milestone.',
  },
  Admin: {
    title: 'Nothing is waiting for you',
    body: 'Departments, people and join requests will appear here once they exist.',
  },
  CompanyHead: {
    title: 'Nothing is waiting for you',
    body: 'You can read every department’s concluded minutes here once meetings start.',
  },
  DepartmentHead: {
    title: 'Nothing is waiting for you',
    body: 'When it is time for your department’s meeting, you will start it from here.',
  },
  Employee: {
    title: 'Nothing is waiting for you',
    body: 'Points that need your confirmation will appear here after a meeting.',
  },
};
