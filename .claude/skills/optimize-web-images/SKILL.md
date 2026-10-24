---
name: optimize-web-images
description: Prepare website images from the supplied references. Creates resized, compressed WebP/AVIF/JPEG derivatives in public/images/ without touching the originals, records a manifest of measured before/after sizes and dimensions, and verifies the result. Use when asked to optimise, resize, compress, convert or prepare responsive variants of images, or when a page needs an image that is not yet in public/images/.
allowed-tools: Read, Glob, Grep, Bash(npm run images:optimize *), Bash(npm run images:verify *), PowerShell(npm run images:optimize *), PowerShell(npm run images:verify *)
---

# Optimise web images

Turns original images in `references/` into web-ready files in `public/images/`,
and proves the result. Originals are **never modified**.

The engine is `scripts/lib/image-pipeline.ts` (Sharp), run through two npm
scripts. This skill is the procedure around them; do not re-implement image
processing inline.

## Inputs

| Input | Where it comes from |
|---|---|
| Source images | `references/product-screenshots/`, `references/photography/` (see `docs/asset-manifest.json`) |
| Intended use | The user's request, or the component/section that needs the image |
| Existing outputs | `public/images/manifest.json`, if present |

**Never** use files from `references/external-templates/` as site assets. They
are third-party layout references, not SWO product imagery
(`docs/implementation-brief.md`).

## Procedure

1. **Inspect.** Read `docs/asset-manifest.json` and confirm each source exists on
   disk (documented extensions have been wrong before: check the real file).
   Read `public/images/manifest.json` if it exists so you do not regenerate or
   clash with existing outputs.
2. **Decide the role and settings** using the table below. State the choice and
   the reason before running anything.
3. **Dry run.** Run with `--dry-run` and read the table it prints. Nothing is
   written. Change the settings if a result looks wrong.
4. **Generate.** Run the same command without `--dry-run`.
5. **Verify.** Run `npm run images:verify`. Every check must pass. If any fails,
   report it. Do not edit the manifest to make it pass. To save a before/after
   table, add `-- --report <path>`: it is built from the measured manifest, so
   **never write a report file by hand or with another tool**. If `--report` is
   not possible, give the table in your reply instead.
6. **Report.** Give the user the measured before/after table, including any
   output that is not smaller, and the `publicPath` values to reference.

## Choosing settings

| Image role | Widths | Format | Quality | Why |
|---|---|---|---|---|
| App screenshot (UI text) | `400,800` | `webp` | `85` | Sharp text edges matter; the source is 864px wide, so 800 is near-native |
| Full-width photograph | `800,1600` | `webp` | `78` | Photos tolerate lossy compression; widths above the source are skipped automatically |
| Photo going to a very slow connection or small slot | `400,800` | `webp` | `72` | Smaller still; check it by eye |
| Need the smallest file and have time to spare | as above | `avif` | `60` | Often smaller than WebP, much slower to encode |

Rules of thumb:

- **Do not upscale.** Widths wider than the source are dropped. If every width
  is wider, one native-size file is produced.
- **Avoid recompressing.** Always start from the original in `references/`,
  never from something in `public/images/` (the tool refuses). Converting a
  JPEG to WebP is one generation of loss; converting that WebP again is two.
- **Lossless is rarely worth it** for photographs (the file often grows). Try it
  for a screenshot only if text edges look soft, and compare sizes.
- If the output is **larger** than the source (possible for an already-small
  PNG), say so plainly and let the user decide. A smaller *display size* is
  still real, but it is not a byte saving.

## Commands

Run every command from the project root, which is already the working directory.
Do **not** prefix with `cd` and do not append redirections such as `2>&1`; they
are unnecessary, and compound commands are matched against the permission
allowlist one part at a time. On Windows the shell may be PowerShell: the
frontmatter allowlists both `Bash(...)` and `PowerShell(...)` for that reason.

```bash
# Preview, no files written
npm run images:optimize -- --src references/product-screenshots/exercise-card.png \
  --out public/images/product --widths 400,800 --format webp --quality 85 --dry-run

# Generate, several sources at once, with a saved report
npm run images:optimize -- \
  --src references/product-screenshots/exercise-card.png \
  --src references/product-screenshots/exercise-card-caution-message.png \
  --out public/images/product --widths 400,800 --format webp --quality 85 \

# Check everything the manifest names, and save the before/after table
npm run images:verify -- --report docs/evidence/image-optimization/before-after.md
```

Options: `--src` (repeatable), `--out` (inside `public/images/`, required),
`--widths`, `--format webp|avif|jpeg`, `--quality 1-100`, `--lossless`,
`--name <kebab-case>` (single source only), `--manifest`, `--dry-run`, `--force`.
`images:verify` takes `--manifest` and `--report`.

## Outputs

- `public/images/<group>/<name>-<width>.<ext>`, for example
  `public/images/product/exercise-card-800.webp`. Names are kebab-case and carry
  the pixel width.
- `public/images/manifest.json`: for every source, its measured size, dimensions,
  format and SHA-256, plus every output's path, `publicPath`, dimensions, bytes
  and percentage saved. It contains only measured values, no estimates.
- Optionally a markdown before/after table (`--report`).

## Safety rules (the tool enforces these; do not work around them)

- Sources are read-only. `images:verify` compares each source's SHA-256 with the
  recorded value, so a modified original is detected.
- Writes only go under `public/images/`. A `--out` elsewhere is rejected.
- A file under `public/` is never accepted as a source.
- An existing file that this tool did not generate is never overwritten. Do not
  pass `--force` unless the user has said the existing file may be replaced.
- EXIF metadata, including any GPS location, is stripped from every output.
  Personal photos can carry it.
- Do not download images. Use what is in `references/`.
- Do not delete or rename anything in `references/`.

## Using the results

Reference outputs by their `publicPath`, and copy `width` and `height` from the
manifest into the content so the browser can reserve space. For responsive
images, build a `srcSet` from the variants of one source. In structured content,
`src` must be a path under `/images/`; `npm run validate:content` checks the
file exists and the declared dimensions match the real file.

## Failure handling

| Symptom | Meaning | Action |
|---|---|---|
| `Source not found` | The documented path is wrong | Check the real extension on disk; report a docs defect rather than guessing |
| `Refusing to use … as a source` | You pointed at a generated file | Use the original in `references/` |
| `Refusing to overwrite …` | A hand-placed file occupies that name | Choose another `--name`, or ask before using `--force` |
| `images:verify` FAIL | A file changed or went missing | Report which check failed; regenerate from the original |
| Output larger than source | Source was already well compressed | Report it; do not hide the result |

## Verification boundary

A passing `images:verify` proves files exist, match the manifest, were not
upscaled, have no EXIF, and that sources are unchanged. It does **not** prove
the image *looks* acceptable. For visual quality, view the output (open the file)
and say that you did, or say that you did not.
