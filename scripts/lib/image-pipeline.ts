/**
 * Image optimisation + verification engine behind the `optimize-web-images`
 * skill (.claude/skills/optimize-web-images/SKILL.md).
 *
 * Safety properties enforced here, not merely documented:
 *   - sources are only ever READ; a SHA-256 of each is recorded so `verify`
 *     can prove the originals are byte-identical afterwards
 *   - output goes only under <root>/public/images/
 *   - files already under public/ are never used as sources (no recompressing
 *     a previous output, which would compound quality loss)
 *   - an existing file we did not generate is never overwritten without --force
 *   - no upscaling: variants wider than the source are skipped
 *   - EXIF/GPS metadata is stripped from every output
 *   - cropping only ever REMOVES edge rows (browser chrome, a status bar, a
 *     personal profile header). It cannot scale, stretch or re-frame, so it
 *     cannot misrepresent what a product screenshot shows. The amounts are
 *     recorded in the manifest so any crop is auditable.
 *
 * The manifest holds only measurements taken from real files, never estimates.
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { Metadata } from 'sharp';

// Each file is processed once, so libvips caching gains nothing, and on Windows it
// keeps file handles open, which blocks deleting or regenerating those files.
sharp.cache(false);

export type OutputFormat = 'webp' | 'avif' | 'jpeg';

/** Rows removed from the top and/or bottom of the source, in source pixels. */
export interface Crop {
  top: number;
  bottom: number;
}

export const NO_CROP: Crop = { top: 0, bottom: 0 };

export function isCropped(crop: Crop): boolean {
  return crop.top > 0 || crop.bottom > 0;
}

/**
 * The region kept after cropping. Throws rather than silently clamping: a crop
 * that does not fit the image is an author mistake, not something to guess at.
 */
export function cropRegion(crop: Crop, source: { width: number; height: number }) {
  for (const [edge, value] of Object.entries(crop)) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`--crop-${edge} must be a whole number of pixels >= 0, got ${value}`);
    }
  }
  const height = source.height - crop.top - crop.bottom;
  if (height <= 0) {
    throw new Error(
      `crop removes the whole image: top ${crop.top} + bottom ${crop.bottom} >= height ${source.height}`,
    );
  }
  return { left: 0, top: crop.top, width: source.width, height };
}

export interface OptimizeOptions {
  /** Project root. Everything is resolved and confined relative to this. */
  root: string;
  /** Source image paths, relative to root. */
  sources: string[];
  /** Output directory, relative to root. Must be inside public/images. */
  outDir: string;
  widths: number[];
  format: OutputFormat;
  quality: number;
  lossless: boolean;
  /** Output base name; only valid with exactly one source. */
  name?: string;
  /** Rows to remove from the top/bottom of every source before resizing. */
  crop: Crop;
  dryRun: boolean;
  force: boolean;
  manifestPath: string;
}

export interface SourceInfo {
  path: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
  sha256: string;
}

export interface OutputInfo {
  path: string;
  /** URL the app should reference, e.g. /images/product/x-800.webp */
  publicPath: string;
  width: number;
  height: number;
  format: OutputFormat;
  bytes: number;
  quality: number;
  lossless: boolean;
  /** Byte reduction versus the source file. Positive means smaller. */
  bytesSavedPercent: number;
}

export interface ManifestEntry {
  source: SourceInfo;
  outputs: OutputInfo[];
  skippedWidths: number[];
  /** Present only when rows were removed, so an untouched entry stays unchanged. */
  crop?: Crop;
}

export interface Manifest {
  schemaVersion: 1;
  generator: string;
  sharpVersion: string;
  entries: Record<string, ManifestEntry>;
}

const SOURCE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff']);
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

/** `workout_01 Final.PNG` -> `workout-01-final` */
export function slugify(fileName: string): string {
  return path
    .basename(fileName, path.extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseWidths(input: string): number[] {
  const widths = input.split(',').map((part) => Number(part.trim()));
  if (widths.some((w) => !Number.isInteger(w) || w <= 0)) {
    throw new Error(`--widths must be positive whole numbers, got "${input}"`);
  }
  return [...new Set(widths)].sort((a, b) => a - b);
}

/** Variants at or below the source width. Never upscales. */
export function chooseWidths(requested: readonly number[], sourceWidth: number) {
  const usable = requested.filter((w) => w <= sourceWidth);
  const skipped = requested.filter((w) => w > sourceWidth);
  // Everything was wider than the source: keep a single native-size variant.
  return { usable: usable.length > 0 ? usable : [sourceWidth], skipped };
}

export function outputName(base: string, width: number, format: OutputFormat): string {
  const ext = format === 'jpeg' ? 'jpg' : format;
  return `${base}-${width}.${ext}`;
}

/** Throws if `target` is not inside `parent`. Blocks `..` and absolute escapes. */
export function assertInside(parent: string, target: string, label: string): void {
  const relative = path.relative(parent, target);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must be inside ${toPosix(parent)} (got ${toPosix(target)})`);
  }
}

export async function sha256(file: string): Promise<string> {
  return createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
}

/** Width/height after applying EXIF orientation, as a browser would show it. */
export function orientedSize(meta: Metadata): { width: number; height: number } {
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  return (meta.orientation ?? 1) >= 5 ? { width: height, height: width } : { width, height };
}

export async function readSourceInfo(root: string, relativePath: string): Promise<SourceInfo> {
  const absolute = path.join(root, relativePath);
  const [info, meta, hash] = await Promise.all([
    stat(absolute),
    sharp(absolute).metadata(),
    sha256(absolute),
  ]);
  const { width, height } = orientedSize(meta);
  return {
    path: toPosix(relativePath),
    bytes: info.size,
    width,
    height,
    format: meta.format ?? 'unknown',
    sha256: hash,
  };
}

export async function loadManifest(manifestFile: string): Promise<Manifest> {
  if (!existsSync(manifestFile)) {
    return {
      schemaVersion: 1,
      generator: 'scripts/optimize-images.ts',
      sharpVersion: sharp.versions.sharp,
      entries: {},
    };
  }
  return JSON.parse(await readFile(manifestFile, 'utf8')) as Manifest;
}

function validateOptions(options: OptimizeOptions): void {
  if (options.sources.length === 0) throw new Error('Provide at least one --src');
  if (options.name !== undefined) {
    if (options.sources.length !== 1)
      throw new Error('--name can only be used with exactly one --src');
    if (!KEBAB.test(options.name))
      throw new Error(`--name must be kebab-case, got "${options.name}"`);
  }
  if (!Number.isFinite(options.quality) || options.quality < 1 || options.quality > 100) {
    throw new Error(`--quality must be 1-100, got ${options.quality}`);
  }
  if (options.widths.length === 0) throw new Error('Provide at least one width');

  const imagesRoot = path.join(options.root, 'public', 'images');
  const out = path.resolve(options.root, options.outDir);
  if (out !== imagesRoot) assertInside(imagesRoot, out, '--out');
}

export async function optimizeImages(options: OptimizeOptions): Promise<Manifest> {
  validateOptions(options);

  const publicRoot = path.join(options.root, 'public');
  const outAbs = path.resolve(options.root, options.outDir);
  const manifestFile = path.resolve(options.root, options.manifestPath);
  const manifest = await loadManifest(manifestFile);
  manifest.sharpVersion = sharp.versions.sharp;

  const knownOutputs = new Set(
    Object.values(manifest.entries).flatMap((entry) => entry.outputs.map((o) => o.path)),
  );

  const usedNames = new Map<string, string>();

  for (const sourceRel of options.sources) {
    const sourceAbs = path.resolve(options.root, sourceRel);
    assertInside(options.root, sourceAbs, `source "${sourceRel}"`);

    if (!existsSync(sourceAbs)) throw new Error(`Source not found: ${sourceRel}`);
    if (!SOURCE_EXTENSIONS.has(path.extname(sourceAbs).toLowerCase())) {
      throw new Error(`Unsupported source type: ${sourceRel}`);
    }
    if (path.relative(publicRoot, sourceAbs).startsWith('..') === false) {
      throw new Error(
        `Refusing to use "${sourceRel}" as a source: it is under public/, so it is already an output. Re-optimising would compound quality loss; use the original in references/.`,
      );
    }

    const base = options.name ?? slugify(sourceRel);
    const clash = usedNames.get(base);
    if (clash)
      throw new Error(
        `"${sourceRel}" and "${clash}" would both produce "${base}-*". Pass distinct names.`,
      );
    usedNames.set(base, sourceRel);

    const source = await readSourceInfo(options.root, sourceRel);
    // Cropping only removes top/bottom rows, so the usable widths are unchanged.
    const region = cropRegion(options.crop, source);
    const { usable, skipped } = chooseWidths(options.widths, source.width);
    const outputs: OutputInfo[] = [];

    for (const width of usable) {
      const fileAbs = path.join(outAbs, outputName(base, width, options.format));
      const fileRel = toPosix(path.relative(options.root, fileAbs));

      if (existsSync(fileAbs) && !knownOutputs.has(fileRel) && !options.force) {
        throw new Error(
          `Refusing to overwrite ${fileRel}: it was not generated by this tool. Re-run with --force if you are sure.`,
        );
      }

      // rotate() applies EXIF orientation so the saved pixels are upright;
      // metadata is dropped by default, which also removes any GPS data.
      // The crop runs on upright pixels, before the resize, so the amounts are
      // in source pixels regardless of the variant width.
      let pipeline = sharp(sourceAbs).rotate();
      if (isCropped(options.crop)) pipeline = pipeline.extract(region);
      pipeline = pipeline.resize({ width, withoutEnlargement: true });
      if (options.format === 'webp') {
        pipeline = pipeline.webp({
          quality: options.quality,
          lossless: options.lossless,
          effort: 6,
          smartSubsample: true,
        });
      } else if (options.format === 'avif') {
        pipeline = pipeline.avif({
          quality: options.quality,
          lossless: options.lossless,
          effort: 6,
        });
      } else {
        pipeline = pipeline.jpeg({ quality: options.quality, mozjpeg: true });
      }

      const buffer = await pipeline.toBuffer();
      const meta = await sharp(buffer).metadata();
      const published = '/' + toPosix(path.relative(publicRoot, fileAbs));

      if (!options.dryRun) {
        await mkdir(outAbs, { recursive: true });
        await writeFile(fileAbs, buffer);
      }

      outputs.push({
        path: fileRel,
        publicPath: published,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        format: options.format,
        bytes: buffer.length,
        quality: options.quality,
        lossless: options.lossless,
        bytesSavedPercent: Number(
          (((source.bytes - buffer.length) / source.bytes) * 100).toFixed(1),
        ),
      });
    }

    manifest.entries[source.path] = {
      source,
      outputs,
      skippedWidths: skipped,
      ...(isCropped(options.crop) ? { crop: options.crop } : {}),
    };
  }

  // Stable key order keeps the manifest diff-friendly and deterministic.
  manifest.entries = Object.fromEntries(
    Object.entries(manifest.entries).sort(([a], [b]) => a.localeCompare(b)),
  );

  if (!options.dryRun) {
    await mkdir(path.dirname(manifestFile), { recursive: true });
    await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  }
  return manifest;
}

export interface VerifyCheck {
  ok: boolean;
  file: string;
  check: string;
  detail: string;
}

export interface VerifyReport {
  checks: VerifyCheck[];
  passed: number;
  failed: number;
}

/** Re-measures every file named in the manifest and compares against what was recorded. */
export async function verifyManifest(root: string, manifestPath: string): Promise<VerifyReport> {
  const manifest = await loadManifest(path.resolve(root, manifestPath));
  const checks: VerifyCheck[] = [];
  const record = (ok: boolean, file: string, check: string, detail: string) =>
    checks.push({ ok, file, check, detail });

  if (Object.keys(manifest.entries).length === 0) {
    record(false, manifestPath, 'manifest has entries', 'manifest is empty or missing');
  }

  for (const [sourcePath, entry] of Object.entries(manifest.entries)) {
    const sourceAbs = path.join(root, sourcePath);
    if (!existsSync(sourceAbs)) {
      record(false, sourcePath, 'source still exists', 'source file is missing');
      continue;
    }
    const currentHash = await sha256(sourceAbs);
    record(
      currentHash === entry.source.sha256,
      sourcePath,
      'source unmodified',
      currentHash === entry.source.sha256
        ? `sha256 ${currentHash.slice(0, 12)}… unchanged`
        : 'sha256 differs from the recorded original',
    );

    for (const output of entry.outputs) {
      const outAbs = path.join(root, output.path);
      if (!existsSync(outAbs)) {
        record(false, output.path, 'output exists', 'file is missing');
        continue;
      }
      record(true, output.path, 'output exists', 'present');

      const [info, meta] = await Promise.all([stat(outAbs), sharp(outAbs).metadata()]);
      record(
        meta.format === (output.format === 'jpeg' ? 'jpeg' : output.format),
        output.path,
        'format matches',
        `recorded ${output.format}, actual ${meta.format}`,
      );
      record(
        meta.width === output.width && meta.height === output.height,
        output.path,
        'dimensions match',
        `recorded ${output.width}x${output.height}, actual ${meta.width}x${meta.height}`,
      );
      record(
        info.size === output.bytes,
        output.path,
        'size matches',
        `recorded ${output.bytes} B, actual ${info.size} B`,
      );
      record(
        (meta.width ?? 0) <= entry.source.width,
        output.path,
        'not upscaled',
        `output ${meta.width}px <= source ${entry.source.width}px`,
      );
      // A crop must only have removed rows: the aspect ratio has to match the
      // kept region, which proves nothing was stretched to hide the removal.
      const kept = entry.crop ? cropRegion(entry.crop, entry.source) : null;
      if (kept) {
        const expected = Math.round(((meta.width ?? 0) * kept.height) / kept.width);
        record(
          Math.abs((meta.height ?? 0) - expected) <= 1,
          output.path,
          'crop not stretched',
          `kept ${kept.width}x${kept.height} (top ${entry.crop?.top}, bottom ${entry.crop?.bottom}); expected height ~${expected}, actual ${meta.height}`,
        );
      }
      record(
        meta.exif === undefined,
        output.path,
        'metadata stripped',
        meta.exif === undefined ? 'no EXIF block' : 'EXIF block present',
      );
      record(
        output.path.startsWith('public/images/') && output.publicPath.startsWith('/images/'),
        output.path,
        'inside public/images',
        output.publicPath,
      );
    }
  }

  const failed = checks.filter((c) => !c.ok).length;
  return { checks, passed: checks.length - failed, failed };
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
}

/** Markdown before/after table built from the manifest's measured values. */
export function renderReport(manifest: Manifest, entryKeys: readonly string[]): string {
  const lines: string[] = [
    '| Source | Before | Output | After | Bytes saved |',
    '|---|---|---|---|---:|',
  ];
  for (const key of entryKeys) {
    const entry = manifest.entries[key];
    if (!entry) continue;
    const before = `${entry.source.width}×${entry.source.height} ${entry.source.format.toUpperCase()}, ${formatBytes(entry.source.bytes)}`;
    entry.outputs.forEach((output, index) => {
      const after = `${output.width}×${output.height} ${output.format.toUpperCase()}${output.lossless ? ' lossless' : ` q${output.quality}`}, ${formatBytes(output.bytes)}`;
      lines.push(
        `| ${index === 0 ? `\`${entry.source.path}\`` : ''} | ${index === 0 ? before : ''} | \`${output.publicPath}\` | ${after} | ${output.bytesSavedPercent}% |`,
      );
    });
  }
  return lines.join('\n') + '\n';
}
