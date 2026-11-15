/** The three steps shown on the public website. */
export const HOW_IT_WORKS = [
  { title: 'Register your company', body: 'The company head signs up, confirms the email and gets a private address such as acme.quorum.app.' },
  { title: 'Invite department heads', body: 'Add organizations and departments, then invite each head by email. They choose their own password.' },
  { title: 'Run the meeting', body: 'The head starts it, a note-taker compiles the minutes, owners confirm their points and the head approves last.' },
] as const;

/** Plain statements about how data is kept; claims here must stay true of the product. */
export const SECURITY_FACTS = [
  'Every company lives on its own address; a sign-in only works there.',
  'Passwords are stored as one-way hashes, never in readable form.',
  'Email only tells people something needs them; minutes never travel by email.',
  'Every edit keeps its earlier version, so history is never overwritten.',
] as const;