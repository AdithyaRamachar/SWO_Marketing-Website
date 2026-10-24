# Evidence 4 — Custom image-optimization skill

## Summary

The `optimize-web-images` skill was invoked through Claude Code and produced **15
output files from 9 source images** (combining Phase C and Phase D runs). All
outputs pass independent verification. Source files were never modified.

---

## Skill definition

- **File:** `.claude/skills/optimize-web-images/SKILL.md`
- **Engine:** `scripts/lib/image-pipeline.ts` (Sharp, crop-aware resize + WebP conversion)
- **CLI:** `npm run images:optimize -- --src <path> --out <dir> [--dry-run]`
- **Verify:** `npm run images:verify [-- --report <path>]`
- **Manifest:** `public/images/manifest.json` (JSON record of every input and output)

The skill is invoked by a **fresh Claude Code process** because skills are registered
only at session start, not mid-session. The slash command is `/optimize-web-images`.

---

## Invocation history

### Phase C (first three attempts)

| Attempt | Child session | Result | Cause |
|---|---|---|---|
| 1 | `7cc39af0…` | **Blocked** | `Bash(npm run images:*)` allowlist pattern did not match; needed a space after `images` |
| 2 | `58bda065…` | **Blocked** | Child used PowerShell tool; only Bash was allowlisted |
| 3 | `da805e33…` | **Succeeded** — 6 files, 46/46 checks | Both Bash and PowerShell allowed after fixes |

The two defects were in the skill's own permission configuration. Finding and
fixing them is itself evidence that the skill was actually run.

Full Phase C invocation: `docs/evidence/image-optimization/attempt3.raw.json`
Full Phase C before/after: `docs/evidence/image-optimization/before-after.md`

### Phase D (fourth run, in a fresh process)

9 additional output files; crops applied to remove a third-party dev URL visible
in browser-bar chrome and a personal name and profile photo. Three images required
more than one crop pass to get right (documented in `run.report.txt`).

Full Phase D run: `docs/evidence/image-optimization/phase-d/`

---

## Before / after comparison

All figures come from `public/images/manifest.json` (machine-written at run time)
and from `npm run images:verify` (independently re-measured at verification time).

### Photography

| Source | Src format | Src size | Src dimensions | Output | Out format | Out dimensions | Out size | Saving |
|---|---|---:|---|---|---|---|---:|---:|
| `references/photography/workout-01.jpg` | JPEG | 466 KB | 1152×2048 | `workout-01-800.webp` | WebP | 800×1422 | 77 KB | 83% |
| `references/photography/post-workout-01.jpg` | JPEG | 548 KB | 1538×2048 | `post-workout-01-800.webp` | WebP | 800×1065 | 76 KB | 86% |
| `references/photography/workout-02.png` | PNG | 1,754 KB | 768×1365 | `workout-02-768.webp` | WebP | 768×1365 | 56 KB | 97% |

### Product screenshots (each source produces 400px and 800px derivatives)

| Source | Src format | Src size | Src dims | 400px output | 400px size | 800px output | 800px size | Saving (800) | Crop |
|---|---|---:|---|---|---:|---|---:|---:|---|
| `exercise-card.png` | PNG | 194 KB | 864×1920 | `exercise-card-400.webp` | 19 KB | `exercise-card-800.webp` | 43 KB | 78% | none |
| `exercise-card-caution-message.png` | PNG | 200 KB | 864×1920 | `exercise-card-caution-message-400.webp` | 22 KB | `exercise-card-caution-message-800.webp` | 51 KB | 74% | none |
| `dashboard.png` | PNG | 142 KB | 864×1920 | `dashboard-400.webp` | 18 KB | `dashboard-800.webp` | 41 KB | 71% | black phone status bar (72 px) |
| `caution-explanation.png` | PNG | 205 KB | 864×1920 | `caution-explanation-400.webp` | 19 KB | `caution-explanation-800.webp` | 45 KB | 78% | browser URL bar (225 px) |
| `exercise-card-progress-message.png` | PNG | 210 KB | 864×1920 | `exercise-card-progress-message-400.webp` | 20 KB | `exercise-card-progress-message-800.webp` | 45 KB | 78% | browser URL bar (225 px) |
| `session-end-card.png` | PNG | 259 KB | 864×1920 | `session-end-card-400.webp` | 15 KB | `session-end-card-800.webp` | 36 KB | 86% | profile header + QR row |

Totals: 9 source files, 15 output files.

---

## What the crops removed

| Image | What was cropped | Why |
|---|---|---|
| `dashboard` | 72 px phone status bar at the top | Black system bar is not product UI |
| `caution-explanation` | 225 px at top (browser address bar showing `logic-check.lovable.app`) | Third-party development URL — misleading on a public product page |
| `exercise-card-progress-message` | 225 px at top (same browser bar) | Same reason |
| `session-end-card` | Profile name/avatar header at top; download QR + emoji row at bottom | Personal identity data + non-product UI |

The crop report documents that each crop was verified to preserve the relevant
product UI. See `docs/evidence/image-optimization/phase-d/run.report.txt`.

---

## Verification result

```
Command: npm run images:verify
```

```
122/122 checks passed
```

Checks performed per output file (13–14 per file):
- Output file exists on disk
- Format matches manifest record
- Pixel dimensions match manifest record
- Byte size matches manifest record
- Not upscaled (output width ≤ source width)
- Crop not stretched (aspect ratio consistent with recorded crop parameters)
- EXIF metadata stripped
- Path is inside `public/images/` (not in `references/`)

---

## Source file integrity

```
Command: git status references/
Output: (empty — no changes to any file under references/)
```

Every source file in `references/` is unmodified. The SHA-256 hashes in
`public/images/manifest.json` can be independently verified:

```bash
# Example: verify workout-01.jpg
node -e "
const crypto=require('crypto');
const fs=require('fs');
const h=crypto.createHash('sha256').update(fs.readFileSync('references/photography/workout-01.jpg')).digest('hex');
const m=JSON.parse(fs.readFileSync('public/images/manifest.json','utf8'));
const entry=m.entries['references/photography/workout-01.jpg'];
console.log('manifest:', entry.source.sha256);
console.log('actual:  ', h);
console.log('match:', entry.source.sha256 === h);
"
```

---

## What the skill does NOT claim

- Smaller file size does not mean better visual quality. WebP conversion at q78–85
  is a lossy operation; the visual difference at these quality settings is minimal
  for photographic content, but the originals are preserved in `references/` for
  comparison.
- The skill has no AI content judgment. It runs a deterministic pipeline
  (resize → crop → encode → verify). The crop parameters were decided by the
  session that ran the skill based on visual inspection of the source files.

---

## Reproduction

```bash
# Dry-run (no files written):
npm run images:optimize -- \
  --src references/photography/workout-01.jpg \
  --out public/images/photography \
  --dry-run

# Full run (adds to manifest):
npm run images:optimize -- \
  --src references/photography/workout-01.jpg \
  --out public/images/photography

# Verify all outputs:
npm run images:verify
```

To invoke through the skill in a fresh session:
```bash
claude -p "/optimize-web-images <task description>" \
  --allowedTools "Read" "Glob" "Grep" \
    "Bash(npm run images:optimize *)" "Bash(npm run images:verify *)" \
    "PowerShell(npm run images:optimize *)" "PowerShell(npm run images:verify *)"
```
