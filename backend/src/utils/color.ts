import { THEME_PAGE_BACKGROUND } from '../constants';

/** Parses "#rrggbb" into its three channels, or null when the text is not such a colour. */
export function parseHexColor(value: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance of a colour. */
function luminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two "#rrggbb" colours (1 to 21); 0 when either is invalid. */
export function contrastRatio(a: string, b: string): number {
  const ca = parseHexColor(a);
  const cb = parseHexColor(b);
  if (!ca || !cb) return 0;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Returns why a custom accent colour is not acceptable, or null when it is: it must be "#rrggbb" and
 * stay visible on the page background (3:1), so buttons and links never disappear.
 */
export function checkAccentColor(value: string): string | null {
  if (!parseHexColor(value)) return 'Use a colour in the form #rrggbb';
  if (contrastRatio(value, THEME_PAGE_BACKGROUND) < 3) {
    return 'That colour is too light to see on the page. Choose a darker one';
  }
  return null;
}
