/** The slides of the "about the application" section, one per stage of a meeting. */
export const SLIDES = [
  { id: 'start', title: 'The head starts the meeting', body: 'Three members present, the head included, and Quorum draws a note-taker at random. Never the head, never last month’s note-taker.' },
  { id: 'compile', title: 'The note-taker compiles the minutes', body: 'Points, owners and due dates in one list. The head adds notes; the note-taker decides what becomes official.' },
  { id: 'confirm', title: 'Owners confirm their own points', body: 'Each person sees only what carries their name. A change asks only the affected owners to confirm again.' },
  { id: 'approve', title: 'The head approves, the rest carries over', body: 'Open points move to next month by themselves. Every version stays on record.' },
] as const;

/** Plain statements about how data is kept; claims here must stay true of the product. */
export const SECURITY_FACTS = [
  'Every company lives on its own address; a sign-in only works there.',
  'Passwords are stored as one-way hashes, never in readable form.',
  'Email only tells people something needs them; minutes never travel by email.',
  'Every edit keeps its earlier version, so history is never overwritten.',
] as const;