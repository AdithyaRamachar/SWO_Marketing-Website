/**
 * WCAG 2.x contrast maths and the list of foreground/background pairs the
 * design system promises to keep accessible.
 *
 * Pairs name TOKENS, never hex values, so changing a token in tokens.css
 * re-checks every pair that uses it. There is no copy of any colour here.
 */

import { isHexColour, resolveToken } from './tokens.ts';

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function expandHex(hex: string): string {
  const h = hex.replace('#', '');
  return h.length === 3 ? [...h].map((c) => c + c).join('') : h;
}

export function relativeLuminance(hex: string): number {
  const h = expandHex(hex);
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * (r as number) + 0.7152 * (g as number) + 0.0722 * (b as number);
}

export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (a, b) => b - a,
  );
  return ((lighter as number) + 0.05) / ((darker as number) + 0.05);
}

/** WCAG 2.2 thresholds. */
export const THRESHOLDS = {
  /** SC 1.4.3, body-size text. */
  text: 4.5,
  /** SC 1.4.3, large text, and SC 1.4.11 non-text UI components. */
  nonText: 3,
} as const;

export interface ContrastPair {
  id: string;
  foreground: string;
  background: string;
  minimum: number;
  kind: 'text' | 'non-text';
  usage: string;
}

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  {
    id: 'text-primary-on-page',
    foreground: '--color-text-primary',
    background: '--color-surface-page',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Body and headings on the page canvas',
  },
  {
    id: 'text-primary-on-subtle',
    foreground: '--color-text-primary',
    background: '--color-surface-subtle',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Body and headings on quiet panels',
  },
  {
    id: 'text-secondary-on-page',
    foreground: '--color-text-secondary',
    background: '--color-surface-page',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Supporting text on the page canvas',
  },
  {
    id: 'text-secondary-on-subtle',
    foreground: '--color-text-secondary',
    background: '--color-surface-subtle',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Supporting text on quiet panels',
  },
  {
    id: 'text-secondary-on-hover',
    foreground: '--color-text-secondary',
    background: '--color-surface-hover',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Supporting text on a hovered surface',
  },
  {
    id: 'on-primary-on-brand',
    foreground: '--color-brand-on-primary',
    background: '--color-brand-primary',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Primary button label',
  },
  {
    id: 'on-primary-on-brand-hover',
    foreground: '--color-brand-on-primary',
    background: '--color-brand-primary-hover',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Primary button label, hover',
  },
  {
    id: 'on-primary-on-brand-active',
    foreground: '--color-brand-on-primary',
    background: '--color-brand-primary-active',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Primary button label, pressed',
  },
  {
    id: 'brand-text-on-page',
    foreground: '--color-brand-primary',
    background: '--color-surface-page',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Tertiary button label and links on the page',
  },
  {
    id: 'brand-text-on-subtle',
    foreground: '--color-brand-primary',
    background: '--color-surface-subtle',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Links on quiet panels',
  },
  {
    id: 'brand-text-on-hover',
    foreground: '--color-brand-primary',
    background: '--color-surface-hover',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Tertiary button label, hover',
  },
  {
    id: 'brand-text-on-brand-subtle',
    foreground: '--color-brand-primary',
    background: '--color-brand-subtle',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Brand text on a tinted background',
  },
  {
    id: 'status-green',
    foreground: '--color-status-green-fg',
    background: '--color-status-green-bg',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Green status label',
  },
  {
    id: 'status-amber',
    foreground: '--color-status-amber-fg',
    background: '--color-status-amber-bg',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Amber status label',
  },
  {
    id: 'status-red',
    foreground: '--color-status-red-fg',
    background: '--color-status-red-bg',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Red status label',
  },
  {
    id: 'feedback-info',
    foreground: '--color-feedback-info-fg',
    background: '--color-feedback-info-bg',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Informational message',
  },
  {
    id: 'status-green-on-page',
    foreground: '--color-status-green-fg',
    background: '--color-surface-page',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Green text or icon directly on the page',
  },
  {
    id: 'status-amber-on-page',
    foreground: '--color-status-amber-fg',
    background: '--color-surface-page',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Amber text or icon directly on the page',
  },
  {
    id: 'status-red-on-page',
    foreground: '--color-status-red-fg',
    background: '--color-surface-page',
    minimum: THRESHOLDS.text,
    kind: 'text',
    usage: 'Red text or icon, e.g. a form error message',
  },
  {
    id: 'border-strong-on-page',
    foreground: '--color-border-strong',
    background: '--color-surface-page',
    minimum: THRESHOLDS.nonText,
    kind: 'non-text',
    usage: 'Form-control boundary (WCAG 1.4.11)',
  },
  {
    id: 'focus-ring-on-page',
    foreground: '--color-focus-ring',
    background: '--color-surface-page',
    minimum: THRESHOLDS.nonText,
    kind: 'non-text',
    usage: 'Keyboard focus indicator on the page',
  },
  {
    id: 'focus-ring-on-subtle',
    foreground: '--color-focus-ring',
    background: '--color-surface-subtle',
    minimum: THRESHOLDS.nonText,
    kind: 'non-text',
    usage: 'Keyboard focus indicator on quiet panels',
  },
  {
    id: 'brand-accent-on-page',
    foreground: '--color-brand-accent',
    background: '--color-surface-page',
    minimum: THRESHOLDS.nonText,
    kind: 'non-text',
    usage: 'Decorative accent shapes only; NOT for text',
  },
];

export interface ContrastResult extends ContrastPair {
  foregroundHex: string;
  backgroundHex: string;
  ratio: number;
  passes: boolean;
}

export function evaluatePairs(
  tokens: ReadonlyMap<string, string>,
  pairs: readonly ContrastPair[] = CONTRAST_PAIRS,
): ContrastResult[] {
  return pairs.map((pair) => {
    const foregroundHex = resolveToken(pair.foreground, tokens);
    const backgroundHex = resolveToken(pair.background, tokens);
    if (!isHexColour(foregroundHex) || !isHexColour(backgroundHex)) {
      throw new Error(
        `Pair ${pair.id}: tokens must resolve to hex (got ${foregroundHex} / ${backgroundHex})`,
      );
    }
    const ratio = contrastRatio(foregroundHex, backgroundHex);
    return { ...pair, foregroundHex, backgroundHex, ratio, passes: ratio >= pair.minimum };
  });
}
