/**
 * npm run check:tokens
 *
 * Computes WCAG contrast for every foreground/background pair the design
 * system promises (scripts/lib/contrast.ts) using the live values in
 * src/styles/tokens.css. Exits non-zero if any pair fails.
 */

import { CONTRAST_PAIRS, evaluatePairs } from './lib/contrast.ts';
import { loadTokens } from './lib/tokens.ts';

const markdown = process.argv.includes('--markdown');
const results = evaluatePairs(loadTokens(), CONTRAST_PAIRS);

if (markdown) {
  console.log('| Pair | Foreground | Background | Ratio | Required | Result |');
  console.log('|---|---|---|---:|---:|---|');
  for (const r of results) {
    console.log(
      `| ${r.usage} | \`${r.foreground}\` ${r.foregroundHex} | \`${r.background}\` ${r.backgroundHex} | ` +
        `${r.ratio.toFixed(2)} | ${r.minimum}:1 | ${r.passes ? 'pass' : '**FAIL**'} |`,
    );
  }
} else {
  for (const r of results) {
    console.log(
      `${r.passes ? 'PASS' : 'FAIL'}  ${r.ratio.toFixed(2).padStart(5)}:1  (need ${r.minimum}:1)  ${r.id}`,
    );
  }
}

const failures = results.filter((r) => !r.passes);
console.log(
  `\n${results.length - failures.length}/${results.length} pairs pass WCAG thresholds` +
    (failures.length ? ` — ${failures.length} FAILING` : ''),
);
process.exitCode = failures.length > 0 ? 1 : 0;
