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

const PAGE_LIGHT = '#fffdf8';
const SURFACE_DARK = '#1e1d1a';
const INK_DARK = '#161513';
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

/** Derives the full light and dark token sets from one accent colour. */
export function deriveTheme(accent: string): BrandTheme {
  const darkAccent = mix(accent, '#ffffff', 0.62);
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
      accentSoft: mix(accent, SURFACE_DARK, 0.78),
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