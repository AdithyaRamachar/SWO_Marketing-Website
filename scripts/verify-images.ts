/**
 * npm run images:verify [-- --manifest <path>] [-- --report <path>]
 *
 * Re-measures every generated image named in the manifest and confirms it
 * still matches what was recorded, and that every source is byte-identical.
 * Exits non-zero on any failed check.
 *
 * --report writes the before/after markdown table, built from the manifest's
 * measured values, so a report never has to be typed by hand.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadManifest, renderReport, verifyManifest } from './lib/image-pipeline.ts';

const root = path.join(import.meta.dirname, '..');

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const manifestPath = option('--manifest') ?? 'public/images/manifest.json';
const reportPath = option('--report');

const report = await verifyManifest(root, manifestPath);
for (const check of report.checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'}  ${check.file}  ${check.check}: ${check.detail}`);
}
console.log(
  `\n${report.passed}/${report.checks.length} checks passed${report.failed ? `, ${report.failed} FAILED` : ''}`,
);

// Only write a report for a manifest that verified cleanly.
if (reportPath && report.failed === 0) {
  const manifest = await loadManifest(path.resolve(root, manifestPath));
  const table = renderReport(manifest, Object.keys(manifest.entries));
  const target = path.resolve(root, reportPath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, table, 'utf8');
  console.log(`Report written to ${reportPath}`);
}
process.exitCode = report.failed > 0 ? 1 : 0;
