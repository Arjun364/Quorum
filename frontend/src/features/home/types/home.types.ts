/** Title and explanation shown in the "Waiting for You" empty state. */
export interface EmptyStateCopy {
  title: string;
  body: string;
}

/** One step of the company head's setup checklist. */
export interface SetupStep {
  id: string;
  title: string;
  body: string;
  to: string;
  done: boolean;
}