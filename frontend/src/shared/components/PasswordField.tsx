import { useState } from 'react';
import type { PasswordFieldProps } from '../types';
import { TextField } from './TextField';

/** Renders a password input with an accessible show/hide toggle; pasting is never blocked. */
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      spellCheck={false}
      autoCapitalize="none"
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="min-h-9 rounded-md px-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
        >
          {visible ? 'Hide' : 'Show'}
          <span className="sr-only"> password</span>
        </button>
      }
    />
  );
}
