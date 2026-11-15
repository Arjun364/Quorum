import type { EmptyStateCopy, SetupStep } from './home.types';

/** Props of the greeting at the top of the home page. */
export interface WelcomeHeaderProps {
  roleLabel: string;
  name: string;
}

/** Props of the "Waiting for You" section. */
export interface WaitingForYouProps {
  emptyState: EmptyStateCopy;
}

/** Props of the company head's setup checklist. */
export interface SetupChecklistProps {
  steps: SetupStep[];
}
