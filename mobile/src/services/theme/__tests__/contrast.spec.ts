import { darkTheme, lightTheme } from '../tokens';

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function srgbToLinear(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(foreground: string, background: string) {
  const L1 = relativeLuminance(foreground);
  const L2 = relativeLuminance(background);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

describe('theme colors meet WCAG AA contrast', () => {
  it('meets AA for core text + button combinations (light)', () => {
    expect(contrastRatio(lightTheme.colors.text, lightTheme.colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightTheme.colors.mutedText, lightTheme.colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightTheme.colors.text, lightTheme.colors.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightTheme.colors.mutedText, lightTheme.colors.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightTheme.colors.onPrimary, lightTheme.colors.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightTheme.colors.onSecondary, lightTheme.colors.secondary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightTheme.colors.link, lightTheme.colors.background)).toBeGreaterThanOrEqual(4.5);
    // Status colors are used for text (e.g., errors, confirmations)
    expect(contrastRatio(lightTheme.colors.error, lightTheme.colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightTheme.colors.error, lightTheme.colors.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightTheme.colors.success, lightTheme.colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightTheme.colors.success, lightTheme.colors.card)).toBeGreaterThanOrEqual(4.5);
  });

  it('meets AA for core text + button combinations (dark)', () => {
    expect(contrastRatio(darkTheme.colors.text, darkTheme.colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkTheme.colors.mutedText, darkTheme.colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkTheme.colors.text, darkTheme.colors.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkTheme.colors.mutedText, darkTheme.colors.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkTheme.colors.onPrimary, darkTheme.colors.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkTheme.colors.onSecondary, darkTheme.colors.secondary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkTheme.colors.link, darkTheme.colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkTheme.colors.error, darkTheme.colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkTheme.colors.error, darkTheme.colors.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkTheme.colors.success, darkTheme.colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkTheme.colors.success, darkTheme.colors.card)).toBeGreaterThanOrEqual(4.5);
  });
});
