import { Alert, Button, TextField } from '@/shared';
import { BrandPreview, LogoUploader, ThemePicker } from '../components';
import { COMPANY_MESSAGES } from '../constants';
import { useBrandSettings } from '../hooks';

/** Brand settings for the company head: name, logo and theme with a live preview; all behaviour comes from `useBrandSettings`. */
export function BrandSettingsPage() {
  const brand = useBrandSettings();
  if (brand.isLoading || !brand.company) return <p role="status" className="text-muted">Loading…</p>;

  return (
    <>
      <p data-enter className="eyebrow">
        Settings
      </p>
      <h1 data-enter className="mt-1 text-4xl font-medium leading-[1.05] sm:text-5xl">
        Brand
      </h1>
      <p data-enter className="mt-2 max-w-xl text-muted text-pretty">
        Your name, logo and colours appear everywhere your people sign in.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <TextField label="Company Name" name="name" autoComplete="organization" value={brand.name} onChange={(e) => brand.handleName(e.target.value)} />
          <div>
            <p className="mb-1.5 text-sm font-medium">Logo</p>
            <LogoUploader
              name={brand.name}
              logoUrl={brand.company.logoUrl}
              isUploading={brand.isUploadingLogo}
              error={brand.logoError}
              onFile={brand.handleLogoFile}
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Theme</p>
            <ThemePicker
              preset={brand.preset}
              customColor={brand.customColor}
              customProblem={brand.customProblem}
              onPreset={brand.handlePreset}
              onCustomColor={brand.handleCustomColor}
            />
          </div>
          <div className="space-y-3">
            <Button loading={brand.isSaving} disabled={Boolean(brand.customProblem) || !brand.name.trim()} onClick={brand.handleSave}>
              {brand.isSaving ? 'Saving…' : 'Save Brand'}
            </Button>
            {brand.saved && <Alert>{COMPANY_MESSAGES.brandSaved}</Alert>}
            {brand.saveFailed && <Alert tone="error">{COMPANY_MESSAGES.unreachable}</Alert>}
          </div>
        </div>
        <BrandPreview name={brand.name} logoUrl={brand.company.logoUrl} accent={brand.accent} />
      </div>
    </>
  );
}