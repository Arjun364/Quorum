import { useEffect, useRef } from 'react';
import type { DialogProps } from '../types';

/** Modal dialog built on the native `<dialog>`: focus is trapped, Esc and the backdrop close it, and focus returns to the opener. */
export function Dialog({ open, title, description, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="dialog m-auto w-[min(32rem,calc(100%-2rem))] card p-0 text-ink shadow-[var(--shadow-3)]"
    >
      {open && (
        <div className="p-6 sm:p-7">
          <h2 id="dialog-title" className="font-display text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="mt-1.5 text-muted text-pretty">{description}</p>}
          <div className="mt-6">{children}</div>
        </div>
      )}
    </dialog>
  );
}