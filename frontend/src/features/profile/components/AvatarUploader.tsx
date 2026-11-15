import { Avatar, Button } from '@/shared';
import { useRef } from 'react';
import { AVATAR_TYPES } from '../constants';
import type { AvatarUploaderProps } from '../types';

/** Shows the person's photo and lets them upload a new one or remove it. */
export function AvatarUploader({ name, url, isUploading, error, onFile, onRemove }: AvatarUploaderProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar name={name} url={url} className="size-24 !text-xl" />
      <div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" loading={isUploading} onClick={() => input.current?.click()}>
            {url ? 'Change Photo' : 'Upload Photo'}
          </Button>
          {url && (
            <Button variant="ghost" onClick={onRemove}>
              Remove
            </Button>
          )}
        </div>
        <p className="mt-2 text-sm text-muted">PNG, JPG or WebP, up to 2 MB. A square photo works best.</p>
        {error && <p className="mt-1.5 text-sm text-danger" role="alert">{error}</p>}
      </div>
      <input
        ref={input}
        type="file"
        accept={AVATAR_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose a photo"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}