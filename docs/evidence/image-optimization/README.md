# Evidence: `optimize-web-images` skill

**Outcome: the skill was invoked through Claude Code, produced real outputs, and
those outputs were verified independently. It took three attempts; the first two
were blocked by permission-pattern defects in the skill that were found and fixed.**

| Item | Where |
|---|---|
| Skill definition | [`.claude/skills/optimize-web-images/SKILL.md`](../../../.claude/skills/optimize-web-images/SKILL.md) |
| Engine | [`scripts/lib/image-pipeline.ts`](../../../scripts/lib/image-pipeline.ts), CLI [`scripts/optimize-images.ts`](../../../scripts/optimize-images.ts), [`scripts/verify-images.ts`](../../../scripts/verify-images.ts) |
| Baseline (all 19 reference images, before) | [baseline.md](baseline.md) |
| Before/after table (generated from the manifest) | [before-after.md](before-after.md) |
| Manifest of generated files | [`public/images/manifest.json`](../../../public/images/manifest.json) |
| Raw invocation records | [attempt1-blocked.raw.json](attempt1-blocked.raw.json), [attempt2-blocked.raw.json](attempt2-blocked.raw.json), [attempt3.raw.json](attempt3.raw.json) |
| Tests | `tests/image-pipeline.test.ts` (26), `tests/tooling.test.ts` |

## Invocation

A skill created mid-session is not registered until a session starts, so the
Skill tool in the authoring session answered `Unknown skill: optimize-web-images`.
The supported route is a fresh Claude Code process, which loads `.claude/skills/`
at startup. The skill is invoked by its slash name:

```bash
claude -p "/optimize-web-images Prepare responsive derivatives for the content demo. \
  Sources: references/product-screenshots/exercise-card.png and \
  references/product-screenshots/exercise-card-caution-message.png (role: app screenshot, \
  output group public/images/product); references/photography/workout-02.png and \
  references/photography/post-workout-01.jpg (role: full-width photograph, output group \
  public/images/photography). Follow the skill procedure: dry-run first, then generate, then \
  verify, and save the before/after table with --report to \
  docs/evidence/image-optimization/before-after.md. Report measured results only." \
  --model sonnet \
  --allowedTools "Read" "Glob" "Grep" \
    "Bash(npm run images:optimize *)" "Bash(npm run images:verify *)" \
    "PowerShell(npm run images:optimize *)" "PowerShell(npm run images:verify *)" \
  --output-format json
```

`--model sonnet` resolved to `claude-sonnet-4-6` in the child process (per its
`modelUsage`). The child had read tools and only the two project image scripts.

## Attempts

| # | Child session | Result | Cause | Fix |
|---|---|---|---|---|
| 1 | `7cc39af0…` | **Blocked.** The child planned the right sequence (dry run, generate, verify) but every command was permission-denied, so nothing ran | `Bash(npm run images:*)` does not match `npm run images:optimize`: the legacy `:*` suffix needs a space after `images` | Allowlist `npm run images:optimize *` and `npm run images:verify *` explicitly |
| 2 | `58bda065…` | **Blocked** for the same reason | On this Windows machine the child used the **PowerShell** tool, and only `Bash(...)` was allowlisted | Allow both `Bash(...)` and `PowerShell(...)`; tell the skill not to prefix `cd` or append `2>&1` |
| 3 | `da805e33…` | **Succeeded.** 6 files generated, 46/46 verify checks | n/a | n/a |

Both defects were in the **skill's own permission configuration**, found only
because the skill was actually run. Attempt 1 also tried to write
`.claude/settings.json` to unblock itself; that write was denied.

### A behaviour worth knowing

In attempt 3 the child could not save its markdown report (its `Write` was denied)
and then tried **seven further routes** (`cat` heredocs, PowerShell here-strings,
`node -e`, a helper script) to save the same file. All were denied, so the
permission boundary held. It did show the skill leaves a gap where an agent hunts for
a way to write a report. The fix: `images:verify -- --report <path>` now writes the
before/after table from the measured manifest, and the skill says never to write
a report by hand. [before-after.md](before-after.md) was produced that way, not by
the child.

## Results

Source images are in `references/`; outputs are in `public/images/`. All numbers
are measured by Sharp and `fs.stat`, copied from the manifest.

| Source | Before | Output | After | Bytes saved |
|---|---|---|---|---:|
| `post-workout-01.jpg` | 1538×2048 JPEG, 548.0 KB | `post-workout-01-800.webp` | 800×1065 WebP q78, 75.9 KB | 86.2% |
| `workout-02.png` | 768×1365 PNG, 1.71 MB | `workout-02-768.webp` | 768×1365 WebP q78, 55.6 KB | 96.8% |
| `exercise-card-caution-message.png` | 864×1920 PNG, 199.9 KB | `-400.webp` | 400×889 WebP q85, 22.4 KB | 88.8% |
| | | `-800.webp` | 800×1778 WebP q85, 51.4 KB | 74.3% |
| `exercise-card.png` | 864×1920 PNG, 194.3 KB | `-400.webp` | 400×889 WebP q85, 19.1 KB | 90.2% |
| | | `-800.webp` | 800×1778 WebP q85, 43.4 KB | 77.7% |

Aggregate, computed from `public/images/manifest.json`:

| | Bytes | Size |
|---|---:|---|
| 4 original files | 2,760,525 | 2.63 MB |
| The largest derivative of each source (4 files) | 231,600 | 226.2 KB (**91.6% smaller**) |
| All 6 derivatives, every responsive variant | 274,052 | 267.6 KB (**90.1% smaller**) |

### Read these numbers honestly

- **The percentages compare different things.** The original is 864 px wide and
  the 400 px derivative is a smaller picture. Bytes saved combines compression
  *and* shrinking, and is not a pure quality-for-size trade.
- **`workout-02.png` (96.8%) looks dramatic because the source was a lossless PNG
  of a photograph.** That is the expected result for that conversion, not a
  property of the tool.
- **Not upscaled.** `workout-02.png` is only 768 px wide, so the 800 and 1600 px
  widths were skipped. `post-workout-01.jpg` is 1538 px wide, so 1600 was skipped.
- **One extra generation of loss on the JPEG.** `post-workout-01.jpg` was already
  lossy, so its WebP has been compressed twice overall. That derivative was **not
  viewed**, so whether the loss is visible is unchecked.
- **No size regression.** All six outputs are smaller than their sources. The
  skill says to report any that are not.

## Independent verification (not the child's report)

| Check | Result |
|---|---|
| `npm run images:verify` | **46/46 checks passed**: existence, format, dimensions and byte size match the manifest; no upscaling; no EXIF; inside `public/images/` |
| Sources untouched | `git status --short references` is empty, so all 19 originals are byte-identical to the commit. `images:verify` also recompares each source's SHA-256 |
| Child's numbers vs files | The child's quoted sizes matched the files (e.g. `exercise-card-800.webp` = 44,392 B = 43.4 KB) |
| EXIF removed | The six product-screenshot sources carry a 294-byte EXIF block; the outputs carry none |
| Referenced by the app | `npm run validate:content` loads the three images used by `site-content.json` and confirms width and height match the real files; the content demo renders them |
| **Looked at by eye** | Viewed `exercise-card-caution-message-800.webp` (UI text crisp and legible at q85) and `workout-02-768.webp` (clean at q78). **Only those two were viewed.** The other four were verified mechanically, not visually |

## Limits

- Verification confirms files are consistent with the manifest. It does **not**
  prove the images look good; visual quality was checked on two of six outputs.
- AVIF output and `--lossless` are implemented and unit-tested only on a
  synthetic image. They were **not** used on a real asset.
- The child ran on a different model (`claude-sonnet-4-6`) from the authoring
  session, so this demonstrates the skill works for a model that did not write it.
- Three sessions were used to get one success. All three are counted in the token
  ledger (see `docs/phase-c-report.md`).

## Open questions for Phase D (not acted on)

- `workout-02.png` has a visible **sparkle mark** in the lower-right corner that
  looks like an AI-editing watermark, and shows third-party marks (a Nike sock logo,
  gym signage). Decide whether it suits "personal gym photography".
- The product screenshots include a browser bar showing a **third-party dev URL**
  (`logic-check.lovable.app`), and `session-end-card.png` shows a **personal profile
  photo and handle**. Cropping is a design decision; the skill does not crop.
