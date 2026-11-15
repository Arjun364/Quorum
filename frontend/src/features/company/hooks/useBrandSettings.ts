import { contrast } from '@/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { companyApi } from '../api';
import { COMPANY_MESSAGES, LOGO_MAX_BYTES, LOGO_TYPES, THEME_PAGE_BACKGROUND, THEME_PRESETS } from '../constants';
import type { Company, ThemePreset } from '../types';
import { checkAccent, checkLogoFile } from '../utils';

/** Owns the brand settings screen: the company, the editable name and theme, the logo upload, and saving. */
export function useBrandSettings() {
  const queryClient = useQueryClient();

  // The company being edited.
  const companyQuery = useQuery({ queryKey: ['company', 'current'], queryFn: companyApi.current });
  const company = companyQuery.data;

  // Editable state: what the user changed, shown over the loaded company until saved.
  const [draftName, setName] = useState<string | null>(null);
  const [draftPreset, setPreset] = useState<ThemePreset | null>(null);
  const [draftColor, setCustomColor] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const name = draftName ?? company?.name ?? '';
  const preset: ThemePreset = draftPreset ?? company?.themePreset ?? 'Forest';
  const customColor = draftColor ?? (company?.themePreset === 'Custom' ? company.accentColor : '#7a1f3d');

  // Derived values for the preview and validation.
  const presetAccent = THEME_PRESETS.find((p) => p.id === preset)?.accent;
  const accent = preset === 'Custom' ? customColor : (presetAccent ?? '#1f3a34');
  const customProblem = preset === 'Custom' ? checkAccent(customColor) : null;
  const contrastRatio = contrast(accent, THEME_PAGE_BACKGROUND);

  /** Refreshes the cached company and the public branding after a change. */
  const refresh = (next: Company): void => {
    queryClient.setQueryData(['company', 'current'], next);
    void queryClient.invalidateQueries({ queryKey: ['company', 'public'] });
  };

  // Mutations that use that state.
  const saveMutation = useMutation({
    mutationFn: () => companyApi.updateBrand({ name: name.trim(), themePreset: preset, accentColor: preset === 'Custom' ? customColor : undefined }),
    onSuccess: (next) => {
      refresh(next);
      setSaved(true);
    },
  });

  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      const signature = await companyApi.logoSignature();
      const uploaded = await companyApi.uploadToImageService(signature, file);
      return companyApi.setLogo(uploaded);
    },
    onSuccess: (next) => {
      refresh(next);
      setLogoError(null);
    },
    onError: () => setLogoError(COMPANY_MESSAGES.logoFailed),
  });

  /** Picks a preset or the custom colour. */
  const handlePreset = (next: ThemePreset): void => {
    setPreset(next);
    setSaved(false);
  };

  /** Changes the custom colour (and switches to it). */
  const handleCustomColor = (value: string): void => {
    setCustomColor(value);
    setPreset('Custom');
    setSaved(false);
  };

  /** Edits the company name. */
  const handleName = (value: string): void => {
    setName(value);
    setSaved(false);
  };

  /** Checks the chosen logo file locally, then uploads it. */
  const handleLogoFile = (file: File): void => {
    const problem = checkLogoFile(file, LOGO_TYPES, LOGO_MAX_BYTES);
    if (problem) {
      setLogoError(problem);
      return;
    }
    setLogoError(null);
    logoMutation.mutate(file);
  };

  /** Saves the name and theme unless the custom colour is unreadable. */
  const handleSave = (): void => {
    if (customProblem || !name.trim()) return;
    saveMutation.mutate();
  };

  return {
    company,
    isLoading: companyQuery.isPending,
    name,
    preset,
    customColor,
    accent,
    customProblem,
    contrastRatio,
    logoError,
    isUploadingLogo: logoMutation.isPending,
    isSaving: saveMutation.isPending,
    saved,
    saveFailed: saveMutation.isError,
    handleName,
    handlePreset,
    handleCustomColor,
    handleLogoFile,
    handleSave,
  };
}