import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CONTRAST_PAIRS,
  THRESHOLDS,
  contrastRatio,
  evaluatePairs,
  relativeLuminance,
} from '../scripts/lib/contrast.ts';
import {
  isHexColour,
  loadTokens,
  parseTokenDeclarations,
  resolveToken,
  tokensWithPrefix,
} from '../scripts/lib/tokens.ts';

const ROOT = path.join(import.meta.dirname, '..');
const tokens = loadTokens();

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(tsx?|css)$/.test(entry) ? [full] : [];
  });
}

const componentFiles = sourceFiles(path.join(ROOT, 'src', 'components'));
const appFiles = sourceFiles(path.join(ROOT, 'src')).filter(
  (file) => !file.endsWith('tokens.css') && !file.endsWith('token-parse.ts'),
);

describe('token availability', () => {
  // The names the style guide has always promised, plus the ones this phase added.
  const REQUIRED = [
    '--color-text-primary',
    '--color-text-secondary',
    '--color-brand-primary',
    '--color-surface-page',
    '--color-surface-subtle',
    '--color-border-default',
    '--color-status-green-bg',
    '--color-status-green-fg',
    '--color-status-amber-bg',
    '--color-status-amber-fg',
    '--color-status-red-bg',
    '--color-status-red-fg',
    '--color-feedback-success-fg',
    '--color-feedback-warning-fg',
    '--color-feedback-danger-fg',
    '--color-feedback-info-fg',
    '--color-focus-ring',
    '--font-sans',
    '--text-hero',
    '--text-h2',
    '--text-h3',
    '--text-body',
    '--text-small',
    '--leading-heading',
    '--leading-body',
    '--space-1',
    '--space-16',
    '--radius-card',
    '--radius-button',
    '--shadow-card',
    '--container-content',
    '--breakpoint-md',
  ];

  it.each(REQUIRED)('defines %s', (name) => {
    expect(tokens.has(name)).toBe(true);
  });

  it('keeps the documented values for tokens the style guide fixed', () => {
    expect(tokens.get('--space-4')).toBe('1rem');
    expect(tokens.get('--radius-card')).toBe('1rem');
    expect(tokens.get('--radius-button')).toBe('0.625rem');
    expect(tokens.get('--container-content')).toBe('72rem');
    expect(tokens.get('--text-hero')).toBe('clamp(2.75rem, 5vw, 4.5rem)');
  });

  it('pins the border widths to the values of Tailwind built-in `border` and `border-2`', () => {
    expect(tokens.get('--border-width-default')).toBe('1px');
    expect(tokens.get('--border-width-strong')).toBe('2px');
  });

  it('makes the spacing scale line up with Tailwind numeric utilities', () => {
    expect(tokens.get('--spacing')).toBe('0.25rem');
    for (const step of [1, 2, 3, 4, 6, 8, 12, 16]) {
      expect(tokens.get(`--space-${step}`)).toBe(`${step * 0.25}rem`);
    }
  });
});

describe('token consistency', () => {
  it('resolves every colour token to a hex value', () => {
    const colours = tokensWithPrefix('--color-', tokens);
    expect(colours.length).toBeGreaterThan(20);
    for (const name of colours) {
      expect(isHexColour(resolveToken(name, tokens)), `${name} did not resolve to hex`).toBe(true);
    }
  });

  it('only aliases tokens that exist (no dangling var() references)', () => {
    for (const [name, value] of tokens) {
      for (const match of value.matchAll(/var\((--[a-z0-9-]+)\)/gi)) {
        expect(tokens.has(match[1] as string), `${name} references missing ${match[1]}`).toBe(true);
      }
    }
  });

  it('detects a circular reference instead of looping', () => {
    const cyclic = parseTokenDeclarations('--a: var(--b); --b: var(--a);');
    expect(() => resolveToken('--a', cyclic)).toThrow(/Circular token reference/);
  });

  it('makes success, warning and danger feedback alias the decision-state tokens', () => {
    expect(resolveToken('--color-feedback-success-fg', tokens)).toBe(
      resolveToken('--color-status-green-fg', tokens),
    );
    expect(resolveToken('--color-feedback-warning-fg', tokens)).toBe(
      resolveToken('--color-status-amber-fg', tokens),
    );
    expect(resolveToken('--color-feedback-danger-fg', tokens)).toBe(
      resolveToken('--color-status-red-fg', tokens),
    );
  });

  it('documents every token in docs/style-guide.md (no undocumented token)', () => {
    const guide = readFileSync(path.join(ROOT, 'docs', 'style-guide.md'), 'utf8');
    const undocumented = [...tokens.keys()].filter((name) => !guide.includes(`\`${name}\``));
    expect(
      undocumented,
      `Add these to the token reference table: ${undocumented.join(', ')}`,
    ).toEqual([]);
  });

  it('does not document a token that no longer exists', () => {
    const guide = readFileSync(path.join(ROOT, 'docs', 'style-guide.md'), 'utf8');
    const referenced = new Set(
      [
        ...guide.matchAll(
          /`(--(?:color|palette|font|text|leading|space|radius|shadow|border-width|container|breakpoint|focus|min|default)-[a-z0-9-]+)`/g,
        ),
      ].map((m) => m[1] as string),
    );
    // `--text-hero--line-height` style paired properties are real declarations.
    const missing = [...referenced].filter((name) => !tokens.has(name));
    expect(missing, `style-guide.md mentions tokens missing from tokens.css`).toEqual([]);
  });
});

describe('accessible contrast (WCAG 2.2)', () => {
  it('computes known reference ratios correctly', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    // #777777 on white is the classic just-below-AA example (4.48:1).
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(relativeLuminance('#fff')).toBeCloseTo(1, 5);
  });

  it('passes every declared foreground/background pair', () => {
    const failures = evaluatePairs(tokens)
      .filter((result) => !result.passes)
      .map((r) => `${r.id}: ${r.ratio.toFixed(2)} < ${r.minimum}`);
    expect(failures).toEqual([]);
  });

  it('covers text, non-text and all three decision states', () => {
    const ids = CONTRAST_PAIRS.map((pair) => pair.id);
    for (const required of [
      'status-green',
      'status-amber',
      'status-red',
      'border-strong-on-page',
      'focus-ring-on-page',
    ]) {
      expect(ids).toContain(required);
    }
    expect(CONTRAST_PAIRS.some((p) => p.minimum === THRESHOLDS.text)).toBe(true);
    expect(CONTRAST_PAIRS.some((p) => p.minimum === THRESHOLDS.nonText)).toBe(true);
  });

  it('reports a failure when a colour is made too light (the check can actually fail)', () => {
    const weakened = parseTokenDeclarations(
      '--color-text-primary: #cccccc; --color-surface-page: #ffffff;',
    );
    const [result] = evaluatePairs(weakened, [CONTRAST_PAIRS[0]!]);
    expect(result?.passes).toBe(false);
  });
});

describe('components use tokens, not raw values', () => {
  it('contains no hex colour literal in component or app source', () => {
    for (const file of appFiles) {
      const source = readFileSync(file, 'utf8');
      expect(source, path.relative(ROOT, file)).not.toMatch(/#[0-9a-fA-F]{3,8}\b(?![\w-])/);
    }
  });

  it('never references a palette token from a component', () => {
    for (const file of componentFiles) {
      expect(readFileSync(file, 'utf8'), path.relative(ROOT, file)).not.toMatch(/palette-/);
    }
  });

  it('uses no default-Tailwind colour utility (bg-red-500, text-gray-600 ...)', () => {
    const offPalette =
      /\b(?:bg|text|border|ring|fill|stroke|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?\b/;
    for (const file of appFiles.filter((f) => f.endsWith('.tsx'))) {
      expect(readFileSync(file, 'utf8'), path.relative(ROOT, file)).not.toMatch(offPalette);
    }
  });

  it('uses no arbitrary pixel or colour value in a class name', () => {
    for (const file of componentFiles) {
      expect(readFileSync(file, 'utf8'), path.relative(ROOT, file)).not.toMatch(
        /\[(?:#|\d+px|\d+(?:\.\d+)?rem)/,
      );
    }
  });

  it('uses only documented spacing steps in components', () => {
    const allowed = new Set(['0', '1', '2', '3', '4', '6', '8', '12', '16']);
    const utility =
      /\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-(\d+)\b/g;
    for (const file of componentFiles.filter((f) => f.endsWith('.tsx'))) {
      for (const match of readFileSync(file, 'utf8').matchAll(utility)) {
        expect(
          allowed.has(match[1] as string),
          `${path.relative(ROOT, file)}: ${match[0]} is not a documented step`,
        ).toBe(true);
      }
    }
  });
});

describe('style guide values match tokens.css', () => {
  it('documents the exact declared value of every token in the reference table', () => {
    const guide = readFileSync(path.join(ROOT, 'docs', 'style-guide.md'), 'utf8');
    const row = /^\| `(--[a-z0-9-]+)` \| `([^`]+)` \|/gm;
    const documented = new Map<string, string>();
    for (const match of guide.matchAll(row)) documented.set(match[1] as string, match[2] as string);

    expect(documented.size).toBe(tokens.size);
    const mismatches = [...documented]
      .filter(([name, value]) => tokens.get(name) !== value)
      .map(([name, value]) => `${name}: guide says ${value}, tokens.css says ${tokens.get(name)}`);
    expect(mismatches).toEqual([]);
  });
});
