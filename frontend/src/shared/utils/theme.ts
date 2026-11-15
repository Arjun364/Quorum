/** The colour tokens a brand accent drives (see design/tokens.css). */
export interface BrandTokens {
  accent: string;
  accentHover: string;
  accentInk: string;
  accentSoft: string;
}

/** Light and dark token sets derived from one accent colour. */
export interface BrandTheme {
  light: BrandTokens;
  dark: BrandTokens;
}

type Rgb = [number, number, number];

const PAGE_LIGHT = '#ffffff';
const SURFACE_DARK = '#131824';
const INK_DARK = '#0a0d14';
const INK_LIGHT = '#ffffff';

/** Parses "#rrggbb" into channels, or null when it is not such a colour. */
export function parseHex(value: string): Rgb | null {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Writes channels as "#rrggbb". */
export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
}

/** Blends colour `a` toward colour `b` by `t` (0 keeps `a`, 1 gives `b`). */
export function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a) ?? [0, 0, 0];
  const cb = parseHex(b) ?? [0, 0, 0];
  return toHex([ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]);
}

/** WCAG relative luminance. */
function luminance([r, g, b]: Rgb): number {
  const c = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}

/** WCAG contrast ratio of two colours (1 to 21); 0 when either is invalid. */
export function contrast(a: string, b: string): number {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 0;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The readable text colour (white or near-black) for text on top of `background`. */
export function readableInk(background: string): string {
  return contrast(background, INK_LIGHT) >= contrast(background, INK_DARK) ? INK_LIGHT : INK_DARK;
}

/** Lifts a brand colour for the dark theme: same hue, brighter, and more saturated unless the brand is deliberately grey. */
function brightenForDark(accent: string): string {
  const rgb = parseHex(accent);
  if (!rgb) return accent;
  const [r, g, b] = rgb.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l0 = (max + min) / 2;
  const s0 = d === 0 ? 0 : d / (1 - Math.abs(2 * l0 - 1));
  const s = s0 < 0.12 ? s0 : Math.min(0.85, Math.max(s0, 0.6));
  const l = 0.68;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return toHex([(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255]);
}

/** Derives the full light and dark token sets from one accent colour. */
export function deriveTheme(accent: string): BrandTheme {
  const darkAccent = brightenForDark(accent);
  return {
    light: {
      accent,
      accentHover: mix(accent, '#000000', 0.14),
      accentInk: readableInk(accent),
      accentSoft: mix(accent, PAGE_LIGHT, 0.87),
    },
    dark: {
      accent: darkAccent,
      accentHover: mix(darkAccent, '#ffffff', 0.18),
      accentInk: readableInk(darkAccent),
      accentSoft: mix(darkAccent, SURFACE_DARK, 0.84),
    },
  };
}

const tokensToCss = (t: BrandTokens): string =>
  `--accent:${t.accent};--accent-hover:${t.accentHover};--accent-ink:${t.accentInk};--accent-soft:${t.accentSoft};`;

/** Inline-style object that scopes one brand's light tokens to an element (used for live previews). */
export function themeStyle(accent: string): Record<string, string> {
  const t = deriveTheme(accent).light;
  return { '--accent': t.accent, '--accent-hover': t.accentHover, '--accent-ink': t.accentInk, '--accent-soft': t.accentSoft };
}

/** Applies a brand's accent to the whole app, for both colour schemes, by (re)writing one style element. */
export function applyBrandTheme(accent: string): void {
  const theme = deriveTheme(accent);
  let style = document.getElementById('brand-theme');
  if (!style) {
    style = document.createElement('style');
    style.id = 'brand-theme';
    document.head.appendChild(style);
  }
  style.textContent = `:root{${tokensToCss(theme.light)}}@media (prefers-color-scheme: dark){:root{${tokensToCss(theme.dark)}}}`;
}

/** Initials for a company mark: first letters of up to two words. */
export function initialsOf(name: string): string {
  const letters = name.trim().split(/\s+/).map((w) => w[0] ?? '').join('');
  return (letters.slice(0, 2) || '?').toUpperCase();
}