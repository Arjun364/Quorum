import { Button } from '@/shared';
import { useRef } from 'react';
import { LOGO_TYPES } from '../constants';
import type { LogoUploaderProps } from '../types';
import { BrandMark } from './BrandMark';

/** Shows the current logo and lets the company head choose a new image; the file is checked and uploaded by the page hook. */
export function LogoUploader({ name, logoUrl, isUploading, error, onFile }: LogoUploaderProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="flex items-center gap-4 rounded-lg border border-dashed border-line bg-surface p-4">
        <BrandMark name={name} logoUrl={logoUrl} className="!size-14 !rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{logoUrl ? 'Your logo' : 'No logo yet'}</p>
          <p className="text-sm text-muted">PNG, JPG or WebP, up to 2 MB. Square works best.</p>
        </div>
        <Button variant="secondary" loading={isUploading} onClick={() => input.current?.click()}>
          {isUploading ? 'Uploading…' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
        </Button>
        <input
          ref={input}
          type="file"
          accept={LOGO_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-label="Logo file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = '';
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}