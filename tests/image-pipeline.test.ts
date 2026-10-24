import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertInside,
  chooseWidths,
  optimizeImages,
  outputName,
  parseWidths,
  renderReport,
  sha256,
  slugify,
  verifyManifest,
} from '../scripts/lib/image-pipeline.ts';
import type { OptimizeOptions } from '../scripts/lib/image-pipeline.ts';

const REAL_ROOT = path.join(import.meta.dirname, '..');

describe('pure helpers', () => {
  it('slugifies filenames to kebab-case', () => {
    expect(slugify('references/photography/Workout_02 Final.PNG')).toBe('workout-02-final');
    expect(slugify('exercise-card.png')).toBe('exercise-card');
  });

  it('parses, de-duplicates and sorts widths', () => {
    expect(parseWidths('800, 400,800')).toEqual([400, 800]);
    expect(() => parseWidths('400,abc')).toThrow(/positive whole numbers/);
    expect(() => parseWidths('0')).toThrow();
    expect(() => parseWidths('1.5')).toThrow();
  });

  it('never upscales: drops widths above the source', () => {
    expect(chooseWidths([400, 800, 1600], 768)).toEqual({ usable: [400], skipped: [800, 1600] });
  });

  it('falls back to one native-size variant when every width is too large', () => {
    expect(chooseWidths([1200, 1600], 768)).toEqual({ usable: [768], skipped: [1200, 1600] });
  });

  it('names outputs with base, width and extension', () => {
    expect(outputName('exercise-card', 800, 'webp')).toBe('exercise-card-800.webp');
    expect(outputName('x', 400, 'jpeg')).toBe('x-400.jpg');
  });

  it('assertInside accepts children and rejects escapes', () => {
    const parent = path.resolve('/project/public/images');
    expect(() => assertInside(parent, path.join(parent, 'a', 'b'), 'out')).not.toThrow();
    expect(() => assertInside(parent, path.resolve('/project/public'), 'out')).toThrow();
    expect(() => assertInside(parent, path.join(parent, '..', 'x'), 'out')).toThrow();
    expect(() => assertInside(parent, parent, 'out')).toThrow();
  });
});

describe('optimize + verify (synthetic image in a temporary project)', () => {
  let root: string;

  async function makeSource(
    name: string,
    width: number,
    height: number,
    format: 'png' | 'jpeg' = 'png',
  ) {
    const file = path.join(root, 'references', name);
    await mkdir(path.dirname(file), { recursive: true });
    const base = sharp({
      create: { width, height, channels: 3, background: { r: 30, g: 120, b: 110 } },
    });
    await (format === 'png' ? base.png() : base.jpeg()).toFile(file);
    return file;
  }

  function options(overrides: Partial<OptimizeOptions> = {}): OptimizeOptions {
    return {
      root,
      sources: ['references/shot.png'],
      outDir: 'public/images/test',
      widths: [400, 800, 1600],
      format: 'webp',
      quality: 80,
      lossless: false,
      crop: { top: 0, bottom: 0 },
      dryRun: false,
      force: false,
      manifestPath: 'public/images/manifest.json',
      ...overrides,
    };
  }

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'swo-img-'));
    await makeSource('shot.png', 1000, 500);
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('writes responsive variants with the measured dimensions and skips upscaling', async () => {
    const manifest = await optimizeImages(options());
    const entry = manifest.entries['references/shot.png']!;

    expect(entry.source).toMatchObject({ width: 1000, height: 500, format: 'png' });
    expect(entry.outputs.map((o) => o.width)).toEqual([400, 800]);
    expect(entry.skippedWidths).toEqual([1600]);
    expect(entry.outputs.map((o) => o.height)).toEqual([200, 400]);
    for (const output of entry.outputs) {
      expect(existsSync(path.join(root, output.path))).toBe(true);
      expect(output.publicPath).toBe(`/images/test/shot-${output.width}.webp`);
    }
  });

  // Cropping exists to remove browser chrome and personal headers from the
  // supplied screenshots (Phase D). It must only ever drop edge rows.
  it('crops rows off the top and bottom without changing the width or stretching', async () => {
    const manifest = await optimizeImages(
      options({ widths: [500], crop: { top: 100, bottom: 50 } }),
    );
    const entry = manifest.entries['references/shot.png']!;
    const output = entry.outputs[0]!;

    // Source 1000x500; keeping rows 100..450 leaves 1000x350, halved to 500x175.
    expect(entry.crop).toEqual({ top: 100, bottom: 50 });
    expect([output.width, output.height]).toEqual([500, 175]);
    const meta = await sharp(path.join(root, output.path)).metadata();
    expect([meta.width, meta.height]).toEqual([500, 175]);
  });

  it('omits crop from the manifest when nothing was cropped', async () => {
    const manifest = await optimizeImages(options());
    expect(manifest.entries['references/shot.png']!.crop).toBeUndefined();
  });

  it('verification passes for a cropped output and records the kept region', async () => {
    await optimizeImages(options({ widths: [500], crop: { top: 100, bottom: 50 } }));
    const report = await verifyManifest(root, 'public/images/manifest.json');
    expect(report.failed).toBe(0);
    const check = report.checks.find((c) => c.check === 'crop not stretched');
    expect(check?.detail).toContain('kept 1000x350');
  });

  it('refuses a crop that would remove the whole image', async () => {
    await expect(optimizeImages(options({ crop: { top: 400, bottom: 100 } }))).rejects.toThrow(
      /crop removes the whole image/,
    );
  });

  it('refuses a negative or fractional crop', async () => {
    await expect(optimizeImages(options({ crop: { top: -10, bottom: 0 } }))).rejects.toThrow(
      /--crop-top must be a whole number/,
    );
    await expect(optimizeImages(options({ crop: { top: 0, bottom: 1.5 } }))).rejects.toThrow(
      /--crop-bottom must be a whole number/,
    );
  });

  it('leaves the source byte-identical after a crop', async () => {
    const source = path.join(root, 'references', 'shot.png');
    const before = await sha256(source);
    await optimizeImages(options({ widths: [500], crop: { top: 100, bottom: 50 } }));
    expect(await sha256(source)).toBe(before);
  });

  it('leaves the source byte-identical', async () => {
    const source = path.join(root, 'references', 'shot.png');
    const before = await sha256(source);
    await optimizeImages(options());
    expect(await sha256(source)).toBe(before);
  });

  it('verifies a clean run', async () => {
    await optimizeImages(options());
    const report = await verifyManifest(root, 'public/images/manifest.json');
    expect(report.failed).toBe(0);
    expect(report.checks.map((c) => c.check)).toEqual(
      expect.arrayContaining([
        'source unmodified',
        'output exists',
        'format matches',
        'dimensions match',
        'size matches',
        'not upscaled',
        'metadata stripped',
      ]),
    );
  });

  it('verify detects a modified source', async () => {
    await optimizeImages(options());
    await writeFile(
      path.join(root, 'references', 'shot.png'),
      await readFile(path.join(root, 'references', 'shot.png')).then((b) =>
        Buffer.concat([b, Buffer.from('x')]),
      ),
    );
    const report = await verifyManifest(root, 'public/images/manifest.json');
    expect(report.checks.find((c) => c.check === 'source unmodified')?.ok).toBe(false);
  });

  it('verify detects a deleted output', async () => {
    const manifest = await optimizeImages(options());
    await rm(path.join(root, manifest.entries['references/shot.png']!.outputs[0]!.path));
    const report = await verifyManifest(root, 'public/images/manifest.json');
    expect(report.failed).toBeGreaterThan(0);
    expect(report.checks.find((c) => c.check === 'output exists' && !c.ok)).toBeTruthy();
  });

  it('verify detects an output replaced by a different image', async () => {
    const manifest = await optimizeImages(options());
    const target = path.join(root, manifest.entries['references/shot.png']!.outputs[0]!.path);
    await sharp({ create: { width: 50, height: 50, channels: 3, background: '#fff' } })
      .webp()
      .toFile(target);
    const report = await verifyManifest(root, 'public/images/manifest.json');
    expect(report.checks.find((c) => c.check === 'dimensions match')?.ok).toBe(false);
  });

  it('verify fails on a missing manifest rather than passing vacuously', async () => {
    const report = await verifyManifest(root, 'public/images/none.json');
    expect(report.failed).toBeGreaterThan(0);
  });

  it('dry run measures but writes nothing', async () => {
    const manifest = await optimizeImages(options({ dryRun: true }));
    expect(manifest.entries['references/shot.png']!.outputs).toHaveLength(2);
    expect(existsSync(path.join(root, 'public'))).toBe(false);
  });

  it('is idempotent: a second run reproduces the same manifest', async () => {
    await optimizeImages(options());
    const first = readFileSync(path.join(root, 'public/images/manifest.json'), 'utf8');
    await optimizeImages(options());
    expect(readFileSync(path.join(root, 'public/images/manifest.json'), 'utf8')).toBe(first);
  });

  it('refuses an output directory outside public/images', async () => {
    await expect(optimizeImages(options({ outDir: 'references' }))).rejects.toThrow(
      /--out must be inside/,
    );
    await expect(optimizeImages(options({ outDir: 'public' }))).rejects.toThrow(
      /--out must be inside/,
    );
    await expect(
      optimizeImages(options({ outDir: 'public/images/../../elsewhere' })),
    ).rejects.toThrow(/--out must be inside/);
  });

  it('refuses to use a generated file as a source (no recompression)', async () => {
    await optimizeImages(options());
    await expect(
      optimizeImages(
        options({ sources: ['public/images/test/shot-800.webp'], outDir: 'public/images/again' }),
      ),
    ).rejects.toThrow(/already an output/);
  });

  it('refuses to overwrite a file it did not create, unless forced', async () => {
    await mkdir(path.join(root, 'public/images/test'), { recursive: true });
    await writeFile(path.join(root, 'public/images/test/shot-400.webp'), 'hand-made');
    await expect(optimizeImages(options())).rejects.toThrow(/Refusing to overwrite/);
    expect(await readFile(path.join(root, 'public/images/test/shot-400.webp'), 'utf8')).toBe(
      'hand-made',
    );

    await expect(optimizeImages(options({ force: true }))).resolves.toBeDefined();
  });

  it('rejects a missing source, an unsupported type and a source outside the project', async () => {
    await expect(optimizeImages(options({ sources: ['references/missing.png'] }))).rejects.toThrow(
      /Source not found/,
    );
    await writeFile(path.join(root, 'references', 'notes.txt'), 'x');
    await expect(optimizeImages(options({ sources: ['references/notes.txt'] }))).rejects.toThrow(
      /Unsupported source type/,
    );
    await expect(optimizeImages(options({ sources: ['../outside.png'] }))).rejects.toThrow(
      /must be inside/,
    );
  });

  it('rejects bad options', async () => {
    await expect(optimizeImages(options({ sources: [] }))).rejects.toThrow(/at least one --src/);
    await expect(optimizeImages(options({ quality: 0 }))).rejects.toThrow(/--quality/);
    await expect(optimizeImages(options({ name: 'Bad Name' }))).rejects.toThrow(/kebab-case/);
    await makeSource('other.png', 800, 400);
    await expect(
      optimizeImages(
        options({ sources: ['references/shot.png', 'references/other.png'], name: 'one' }),
      ),
    ).rejects.toThrow(/exactly one --src/);
  });

  it('refuses two sources that would produce the same output name', async () => {
    await makeSource('a/shot.png', 900, 450);
    await expect(
      optimizeImages(options({ sources: ['references/shot.png', 'references/a/shot.png'] })),
    ).rejects.toThrow(/would both produce/);
  });

  it('strips EXIF metadata, including GPS-bearing blocks', async () => {
    const file = path.join(root, 'references', 'gps.jpg');
    await sharp({ create: { width: 900, height: 600, channels: 3, background: '#888' } })
      .jpeg()
      .withExif({ IFD0: { Copyright: 'private', ImageDescription: 'GPS test' } })
      .toFile(file);
    expect((await sharp(file).metadata()).exif).toBeDefined();

    const manifest = await optimizeImages(options({ sources: ['references/gps.jpg'] }));
    for (const output of manifest.entries['references/gps.jpg']!.outputs) {
      expect((await sharp(path.join(root, output.path)).metadata()).exif).toBeUndefined();
    }
  });

  it('applies EXIF orientation so portrait phone photos are not saved sideways', async () => {
    const file = path.join(root, 'references', 'rotated.jpg');
    await sharp({ create: { width: 1200, height: 600, channels: 3, background: '#888' } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toFile(file);

    const manifest = await optimizeImages(
      options({ sources: ['references/rotated.jpg'], widths: [300] }),
    );
    const entry = manifest.entries['references/rotated.jpg']!;
    // Stored as 1200x600 but displayed rotated, so the effective size is 600x1200.
    expect(entry.source).toMatchObject({ width: 600, height: 1200 });
    expect(entry.outputs[0]).toMatchObject({ width: 300, height: 600 });
  });

  it('renders a before/after table from measured values only', async () => {
    const manifest = await optimizeImages(options());
    const table = renderReport(manifest, ['references/shot.png']);
    expect(table).toContain('1000×500 PNG');
    expect(table).toContain('/images/test/shot-400.webp');
    expect(table).toContain('400×200 WEBP q80');
  });
});

describe('the real project assets (images generated by the skill demonstration)', () => {
  it('verifies against the committed manifest', async () => {
    const report = await verifyManifest(REAL_ROOT, 'public/images/manifest.json');
    const failures = report.checks
      .filter((c) => !c.ok)
      .map((c) => `${c.file} ${c.check}: ${c.detail}`);
    expect(failures).toEqual([]);
    expect(report.checks.length).toBeGreaterThan(20);
  });

  it('only references originals that live in references/', () => {
    const manifest = JSON.parse(
      readFileSync(path.join(REAL_ROOT, 'public/images/manifest.json'), 'utf8'),
    );
    for (const source of Object.keys(manifest.entries)) {
      expect(source.startsWith('references/'), source).toBe(true);
      expect(
        source.startsWith('references/external-templates/'),
        `${source} is a third-party template`,
      ).toBe(false);
    }
  });
});
