/**
 * Node-side access to src/styles/tokens.css, the canonical token source, with
 * `var(--x)` references resolved to plain values. Tests, the contrast checker
 * and the docs-consistency check all go through here.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseTokenDeclarations } from '../../src/lib/token-parse.ts';

export { parseTokenDeclarations };

export const TOKENS_CSS_PATH = path.join(
  import.meta.dirname,
  '..',
  '..',
  'src',
  'styles',
  'tokens.css',
);

export function loadTokens(cssPath: string = TOKENS_CSS_PATH): Map<string, string> {
  return parseTokenDeclarations(readFileSync(cssPath, 'utf8'));
}

/** Follow `var(--other)` references until a literal value is reached. */
export function resolveToken(
  name: string,
  tokens: ReadonlyMap<string, string>,
  seen: readonly string[] = [],
): string {
  if (seen.includes(name)) {
    throw new Error(`Circular token reference: ${[...seen, name].join(' -> ')}`);
  }
  const value = tokens.get(name);
  if (value === undefined) throw new Error(`Unknown token: ${name}`);

  const reference = /^var\((--[a-z0-9-]+)\)$/i.exec(value);
  if (reference) return resolveToken(reference[1] as string, tokens, [...seen, name]);
  return value;
}

export function isHexColour(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

/** Names of every token in a namespace, e.g. tokensWithPrefix('--color-'). */
export function tokensWithPrefix(prefix: string, tokens: ReadonlyMap<string, string>): string[] {
  return [...tokens.keys()].filter((name) => name.startsWith(prefix));
}
