import { THEME_PRESETS } from '../constants';
import type { ThemePickerProps } from '../types';

/** Renders the three theme presets and a custom colour picker; the colour's readability problem, if any, shows under it. */
export function ThemePicker({ preset, customColor, customProblem, onPreset, onCustomColor }: ThemePickerProps) {
  return (
    <div className="space-y-5">
      <div role="group" aria-label="Theme" className="grid grid-cols-3 gap-3">
        {THEME_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={preset === item.id}
            onClick={() => onPreset(item.id)}
            className={`lift rounded-lg border-2 bg-surface p-3 text-left ${preset === item.id ? 'border-accent shadow-[var(--ring)]' : 'border-line'}`}
          >
            <span className="mb-2 flex gap-1" aria-hidden="true">
              <i className="h-6 flex-1 rounded-md" style={{ background: item.accent }} />
              <i className="h-6 flex-1 rounded-md" style={{ background: item.soft }} />
              <i className="h-6 flex-1 rounded-md border border-line" style={{ background: item.ground }} />
            </span>
            <span className="text-sm font-semibold">{item.label}</span>
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="accent" className="mb-1.5 block text-sm font-medium">
          Custom Accent Colour
        </label>
        <div className="flex items-center gap-3">
          <input
            id="accent"
            type="color"
            value={customColor}
            onChange={(event) => onCustomColor(event.target.value)}
            className="h-12 w-14 cursor-pointer rounded-lg border border-line bg-surface p-1"
          />
          <span className="text-sm text-muted tabular-nums">{customColor}</span>
          {preset === 'Custom' && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${customProblem ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-ok'}`}>
              {customProblem ? 'Too light' : 'Readable'}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-muted" aria-live="polite">
          {preset === 'Custom' && customProblem ? customProblem : 'Buttons, links and highlights. The other shades are made for you.'}
        </p>
      </div>
    </div>
  );
}