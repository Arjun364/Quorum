import type { PasswordRequirementsProps } from '../types';

/** Lists each password requirement with a check mark once met (text and icon, never colour alone). */
export function PasswordRequirements({ rules }: PasswordRequirementsProps) {
  return (
    <ul aria-label="Password requirements" className="-mt-2 grid gap-1 text-sm sm:grid-cols-2">
      {rules.map((rule) => (
        <li key={rule.label} className={`flex items-center gap-2 ${rule.met ? 'text-ok' : 'text-muted'}`}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0" fill="none">
            {rule.met ? (
              <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <circle cx="8" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            )}
          </svg>
          <span>
            {rule.label}
            <span className="sr-only">{rule.met ? ' (met)' : ' (not met yet)'}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
