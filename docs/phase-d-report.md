# Phase D report — the marketing website

Phase D built the public SWO marketing homepage on the Phase C design system,
content model and tooling. This report records what was done, the commands that
prove it, and what is still open.

Phase D ran across two sessions. The first implemented the page and the image
work; it ended when it ran out of context. The second (the **recovery session**)
resumed from the repository state, finished verification, fixed the audit
findings and wrote this report. Where it matters which session did what, the
tables say so.

## Status against the Phase D checklist

Criteria are those in [phase-d-checklist.md](phase-d-checklist.md).

| # | Criterion | Status | Evidence |
|---|---|---|---|
| D1 | Full marketing homepage implemented locally | **Done** (session 1) | `src/page/MarketingPage.tsx` composes 11 sections; served by `npm run dev` |
| D2 | Visual design follows the design system | **Done and audited** | Auditor PASS, 0 violations; `swo/no-raw-colour` and `tests/tokens.test.ts` green |
| D3 | Responsive at 375 / 768 / 1024 / 1440 | **Done** (recovery) | `npm run capture`: no horizontal overflow at any of the four widths |
| D4 | Supplied assets used, all paths resolve | **Done** (recovery verified) | 7/7 images render with real pixels and non-empty `alt` |
| D5 | Content validated before render | **Done** | `src/main.tsx` is the single boundary; no section imports the JSON |
| D6 | Navigation and CTAs work | **Done** (recovery verified) | 17/17 in-page links resolve and scroll to their target |
| D7 | Three states distinguished without colour alone | **Done** (session 1) | `StatusBadge` label + icon shape, asserted in tests |
| D8 | Methodology claims qualified | **Done** | `concept` / `swoImplementation` split, `evidenceStatus`, `unsourcedNotice` |
| D9 | Audit run against the real implementation | **Done** (recovery) | Two runs: FAIL (3 findings) → fixes → PASS (0 findings) |
| D10 | Intentional violation detected, then removed | **Not done** | Superseded: the audit found 3 *real* violations in the actual page, which is stronger evidence than a planted fixture. The planted-violation test was already completed in Phase C |
| D11 | Image skill used, or no-op documented | **Done** (session 1) | 9 outputs, 122/122 verification checks, originals unmodified |
| D12 | Tests, lint, typecheck, build run | **Done** (recovery) | `npm run check` exit 0; 248 tests |
| D13 | Evidence and documentation updated | **Done** (recovery) | This report, `docs/evidence/README.md`, `CLAUDE.md` |
| D14 | Token/session totals with limitations | **Done, provisional** | `npm run track:usage`; see below |
| D15 | No deployment, database or backend added | **Held** | No new runtime dependencies in Phase D |

## What the recovery session changed

| File | Change | Why |
|---|---|---|
| `src/sections/SiteHeader.tsx` | brand link gains `inline-flex min-h-(--min-target-size) items-center` | Audit finding 1 (A11Y-06): the target was ~1.5rem, below the 2.75rem minimum |
| `src/sections/MethodologySection.tsx` | source links gain the same; card labels and the unsourced notice now come from props | Audit findings 2 (A11Y-06) and 3 (CONTENT-03) |
| `src/sections/HowItWorksSection.tsx` | `STAGE_LABEL` constant deleted; labels read `howItWorks.stageLabels` | Audit finding 3 (CONTENT-03) |
| `src/sections/StatusSection.tsx` | action prefix reads `statusSection.actionLabel` | Audit finding 3 (CONTENT-03) |
| `src/content/schema.ts` | adds `howItWorks.stageLabels`, `statusSection.actionLabel`, `methodology.conceptLabel` / `implementationLabel` / `unsourcedNotice` | Gives the moved copy a validated home |
| `src/content/site-content.json` | the five new fields, with the previously hard-coded wording | Same |
| `tests/content-schema.test.ts` | two assertions updated: `images checked 3` → `7`, `801x1778` → `801x1682` | The page now declares 7 images, and the hero image is a different crop. Stale expectations, not loosened ones |
| `docs/style-guide.md` | documents `--container-screenshot` (`22rem`) | `tests/tokens.test.ts` requires every token to be documented; the token was added in session 1 but not the guide |

The CONTENT-03 fix matters beyond tidiness: the sentence *"Described as a
training concept. No study is cited here, and none is implied."* is an evidence
statement. It was hard-coded in JSX, where editing a component could have
removed it silently. It is now validated content with a minimum length, so the
schema rejects content that drops it.

## Commands run in the recovery session, with results

| Command | Result |
|---|---|
| `npm run check` | **exit 0** — typecheck, ESLint, Prettier, contrast, content, tests, build |
| `npm test` | **248 passed**, 7 files, 0 failed |
| `npm run check:tokens` | **23/23** pairs pass WCAG |
| `npm run validate:content` | `VALID` — hero 1 · steps 5 · statuses 3 · features 4 · frameworks 3 · faq 6 · **images checked 7** |
| `npm run images:verify` | **122/122** checks passed |
| `npm run build` | built in 323 ms; `index.js` 348.07 kB (106.56 kB gzip), `index.css` 21.34 kB |
| `npm run capture -- --url http://localhost:5199/ --name homepage --widths 375,768,1024,1440` | **no horizontal overflow at any width** |
| `npm run track:usage` | 15 sessions, 568 requests, 98,746,873 total tokens |

Four tests failed at the start of this session and all four were stale
assertions left by session 1's changes (a new design token, and more images in
the content). They were corrected by updating the expectation to the new true
value. Nothing was deleted, skipped, or loosened, and no threshold was lowered.

## Audit subagent

Run with the `Agent` tool against the real implementation — 14 files, the whole
of `src/sections/`, `src/page/MarketingPage.tsx` and `src/components/ProductScreenshot.tsx`.

**Run 1 — verdict FAIL, 3 confirmed violations:**

| # | Rule | Location | Finding |
|---|---|---|---|
| 1 | A11Y-06 | `SiteHeader.tsx:44-48` | Brand link below the 2.75rem minimum target size |
| 2 | A11Y-06 | `MethodologySection.tsx:30-36` | Source links below the minimum target size |
| 3 | CONTENT-03 | `MethodologySection.tsx:18,22,42`, `HowItWorksSection.tsx:9-11`, `StatusSection.tsx:45` | Marketing copy hard-coded in JSX instead of validated content |

All three were fixed. **Run 2 — verdict PASS, 0 confirmed violations**, with
both items confirmed clean by file and line.

The auditor also raised uncertain observations in both runs. Resolved here:

- *Focus rings not set per-element.* **Clean.** `src/styles/index.css:22` has a
  global `:focus-visible` rule covering `a, button, input, select, textarea,
  summary, [tabindex]`, using `--focus-ring-width` and `--color-focus-ring`.
- *Chrome strings hard-coded* (`Skip to main content`, `Menu`, `aria-label="Main"`).
  **Left as is, deliberately.** These describe the page's own structure, not the
  product. CONTENT-03 covers marketing copy. Recorded as a decision, not an
  oversight.
- *`sizes` attributes use `22rem` / `80vw` rather than a token.* Left as is;
  `sizes` is a browser hint evaluated before CSS custom properties resolve, so a
  token cannot be used there.

Limitation, unchanged from Phase C: the auditor is an LLM and is **not
deterministic**. Two runs is a small sample. It is a review layer on top of lint
and tests, not a replacement for them.

## Custom skill

The image skill was run in **session 1**, not in the recovery session; the
recovery session verified its output rather than re-running it. Evidence:
[evidence/image-optimization/phase-d/](evidence/image-optimization/phase-d/).

Nine outputs from five sources. Crops were needed because two screenshots showed
a third-party development URL in a browser bar and one showed a personal name
and profile photo; the crop option was added to the pipeline for this. Three of
the crops took more than one pass to get right, which the run report records.

Verified in this session: `npm run images:verify` → **122/122 checks passed**
(existence, format, dimensions, byte size, no upscaling, crop aspect not
stretched, EXIF stripped, path inside `public/images/`). `git status references/`
is empty, so every original is unmodified.

One discrepancy worth recording: `run.report.txt` lists `dashboard-400/800` as
400×856 / 800×1711, while `before-after.md` and the files on disk are 400×841 /
800×1682. The report text describes an earlier pass; the manifest and the files
agree with each other, and `images:verify` checks against the manifest.

## Interactive and visual verification

Driven through the DevTools protocol against the running dev server. Full output:
[evidence/phase-d/interaction-check.txt](evidence/phase-d/interaction-check.txt).

| Check | Result |
|---|---|
| Images render with real pixels after scrolling the page | **7/7 loaded**, every one with a non-empty `alt` |
| In-page links resolve to an existing element | **17/17 resolve** |
| Clicking each in-page link scrolls its target into place | **17/17 OK** |
| FAQ disclosure | 6 items, 0 open initially, **6 open** after clicking each summary |
| Mobile menu at 375px | `aria-expanded` false→true, panel height 0→visible, **Escape closes it** and returns `aria-expanded` to false |

Screenshots at the four required widths:
[evidence/screenshots/phase-d/](evidence/screenshots/phase-d/).

| Width | Document width | Page height | Overflow |
|---|---|---|---|
| 375 | 375 | 15919 | none |
| 768 | 753 | 11538 | none |
| 1024 | 1009 | 9869 | none |
| 1440 | 1425 | 10141 | none |

The 375 and 1440 captures were also inspected visually: sections stack in one
column on mobile with the hamburger in the header, and the two-column hero,
alternating feature rows and three-up card grids appear as intended on desktop.

Note on the captures: `Page.captureScreenshot` does not trigger lazy loading, so
the product screenshots appear as empty boxes in the saved PNGs. That is a
property of the capture, not of the page — the interaction check above loads the
same page, scrolls it, and finds all seven images decoded at their real pixel
dimensions.

**Not done:** no human has looked at this page in a real browser. The checks
above are machine measurements and screenshot inspection. A person should still
open it, particularly for typography, rhythm and whether the copy reads well.

## Token and session accounting

From `npm run track:usage`, which reads this project's local Claude Code
transcripts. The existing ledger was regenerated from source, not reset or
hand-edited.

Figures from the last run of this session. They rise while the session is open.

| Figure | Value |
|---|---|
| Sessions | **15** (1 counted as running) |
| API requests, deduplicated | 568 |
| Input | 1,000 |
| Output | 564,146 (thinking 119,464, a subset) |
| Cache creation | 1,767,566 |
| Cache read | 96,414,161 |
| **Total** | **98,746,873** |

Collector health on that run: 0 malformed lines, 793 duplicate records cut by
`requestId`.

Of this, subagents account for 82 requests and 2,484,380 tokens across 8
`design-system-auditor` agents — which includes the two runs above. A further
1,191 tokens in one session come from cost-state records only and are reported
separately, because they are a different source.

Limitations, carried forward and still true:

- Totals are a **snapshot**. The recovery session was still running when the
  tracker last ran, so its own usage is incomplete in the figures above. Re-run
  `npm run track:usage` after the session ends for a settled number.
- Session 1's usage **is** included: its transcript is on disk and was read.
  There is no evidence of a missing session, but note that "complete" cannot be
  proven from the transcripts alone — only that nothing was dropped by the
  collector (0 malformed lines, 771 duplicates cut by `requestId`).
- The session count includes child `claude -p` runs launched for demonstrations.
- Nothing here is estimated. No figure is derived from characters or words, and
  prompt-cache capacity is not treated as a usage total.
- Subscription-level `/usage` is still not machine-readable.

## Open items

1. **A person should view the site in a real browser.** `npm run dev`, then
   http://localhost:5173/.
2. **`swoImplementation` copy still needs owner confirmation**, carried over from
   Phase C. The schema cannot check whether a statement about what SWO does is
   true; only an owner can.
3. **Inter is still not loaded.** The type scale assumes it. Either load it or
   change the stack and re-measure.
4. **Breakpoints, shadows and the focus ring are still marked *proposed*** in the
   style guide. The responsive captures above are evidence that the breakpoints
   work; the style guide has not been updated to promote them.
5. **D10 was not done as written** — see the table above for why.
6. **The interactive fresh-session handoff test is still pending** from Phase C.
