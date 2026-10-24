/**
 * npm run images:optimize -- --src <file> [--src <file> ...] --out public/images/<group> [options]
 *
 * Generates optimised, responsive derivatives of source images. Sources are
 * never modified. See .claude/skills/optimize-web-images/SKILL.md.
 *
 * Options
 *   --src <path>        source image, relative to the project root (repeatable)
 *   --out <dir>        output directory inside public/images/        (required)
 *   --widths <list>    comma-separated target widths, default 400,800
 *   --format <fmt>     webp | avif | jpeg, default webp
 *   --quality <1-100>  default 82
 *   --lossless         lossless encoding (webp/avif); usually larger for photos
 *   --name <slug>      output base name (single --src only), default from filename
 *   --crop-top <px>    remove this many rows from the top of each source
 *   --crop-bottom <px> remove this many rows from the bottom of each source
 *   --manifest <path>  default public/images/manifest.json
 *   --report <path>    also write a markdown before/after table
 *   --dry-run          measure and report without writing any file
 *   --force            allow overwriting an existing file this tool did not create
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  optimizeImages,
  parseWidths,
  renderReport,
  type OptimizeOptions,
  type OutputFormat,
} from './lib/image-pipeline.ts';

const root = path.join(import.meta.dirname, '..');

function parse(argv: readonly string[]): { options: OptimizeOptions; report: string | null } {
  const options: OptimizeOptions = {
    root,
    sources: [],
    outDir: '',
    widths: [400, 800],
    format: 'webp',
    quality: 82,
    lossless: false,
    crop: { top: 0, bottom: 0 },
    dryRun: false,
    force: false,
    manifestPath: 'public/images/manifest.json',
  };
  let report: string | null = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = (): string => {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      i += 1;
      return v;
    };
    switch (arg) {
      case '--src':
        options.sources.push(value());
        break;
      case '--out':
        options.outDir = value();
        break;
      case '--widths':
        options.widths = parseWidths(value());
        break;
      case '--format': {
        const fmt = value();
        if (fmt !== 'webp' && fmt !== 'avif' && fmt !== 'jpeg')
          throw new Error(`--format must be webp, avif or jpeg, got "${fmt}"`);
        options.format = fmt as OutputFormat;
        break;
      }
      case '--quality':
        options.quality = Number(value());
        break;
      case '--lossless':
        options.lossless = true;
        break;
      case '--name':
        options.name = value();
        break;
      case '--crop-top':
        options.crop = { ...options.crop, top: Number(value()) };
        break;
      case '--crop-bottom':
        options.crop = { ...options.crop, bottom: Number(value()) };
        break;
      case '--manifest':
        options.manifestPath = value();
        break;
      case '--report':
        report = value();
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force':
        options.force = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!options.outDir) throw new Error('--out is required (a directory inside public/images/)');
  return { options, report };
}

async function main(): Promise<void> {
  const { options, report } = parse(process.argv.slice(2));
  const manifest = await optimizeImages(options);

  const keys = options.sources.map((s) => s.split(path.sep).join('/'));
  const table = renderReport(manifest, keys);
  console.log(options.dryRun ? 'DRY RUN: nothing was written\n' : 'Optimised images written.\n');
  console.log(table);

  for (const key of keys) {
    const crop = manifest.entries[key]?.crop;
    if (crop)
      console.log(
        `Note: ${key}: cropped ${crop.top}px from the top and ${crop.bottom}px from the bottom; the original is untouched`,
      );
    const skipped = manifest.entries[key]?.skippedWidths ?? [];
    if (skipped.length > 0)
      console.log(
        `Note: ${key}: skipped ${skipped.join(', ')}px (wider than the source; never upscaled)`,
      );
  }

  if (report && !options.dryRun) {
    const reportAbs = path.resolve(root, report);
    await mkdir(path.dirname(reportAbs), { recursive: true });
    await writeFile(reportAbs, table, 'utf8');
    console.log(`Report written to ${report}`);
  }
}

main().catch((error: unknown) => {
  console.error(
    `images:optimize failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
