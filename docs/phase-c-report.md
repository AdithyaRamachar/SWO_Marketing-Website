# Phase C report: reusable frontend tooling

Branch: `dev` (copied from `main` at the start of the phase). Phase D (the marketing
page) is **not** started. Evidence index: [evidence/README.md](evidence/README.md).

## 1. What was implemented

| Area | What exists | Status |
|---|---|---|
| Toolchain | React 19, TypeScript, Vite 8, Tailwind v4 (CSS-first), Zod 4, lucide-react, Vitest 5 + Testing Library, ESLint 9 + jsx-a11y, Prettier, Sharp | Done |
| Design tokens | `src/styles/tokens.css`: 97 tokens (raw palette + semantic), integrated with Tailwind through `@theme`; Tailwind defaults removed so off-system classes do not compile | Done |
| Style guide v0.2 | Every token documented with exact value, status (kept/adjusted/added/proposed) and WCAG evidence; v0.1 changes listed with measurements | Done |
| Primitives | `Button`/`ButtonLink`, `Card`, `SectionContainer`, `SectionHeading`, `StatusBadge`, `FormField`/`TextInput`/`Select` | Done |
| Showcase | `dev/showcase.html`: reads `tokens.css` itself; typography, colour, spacing, radii, shadows, buttons and states, cards, forms, all three status states | Done |
| Structured content | Zod schema + validation boundary + sample dataset + `npm run validate:content`; build refuses invalid content | Done |
| Content demo | `dev/content-demo.html`: edit JSON live; valid renders, invalid shows exact paths and renders nothing | Done |
| Subagent | `.claude/agents/design-system-auditor.md` + rule catalogue `docs/audit-rules.md` | Done, demonstrated |
| Skill | `.claude/skills/optimize-web-images/` + Sharp engine, manifest and verifier | Done, demonstrated |
| Tracker | Phase B collector preserved and **extended** (subagent transcripts); ledger not reset | Done |
| Handoff | `CLAUDE.md` rewritten; automated fresh-session test | Partial |

### Findings that changed the design

Measured, not assumed:

- **Four v0.1 colour values failed their own accessibility needs and were changed**
  (secondary text on subtle surfaces 4.43:1; white on the brand teal 3.55:1; green
  status text 4.42:1; the default border 1.29:1 as a control boundary). Details in
  the style guide. Two of my own Phase A estimates were wrong in the same exercise.
- **The Phase B tracker was silently under-counting subagent work** (section 5).
- **My first hex-colour lint rule never fired.** ESLint's selector parser ends an
  attribute at the first `]`, so a regex with a character class matched nothing. A
  deliberate probe file exposed it; it is now a real rule, with an independent test as backup.
- **Two permission defects in the skill** only appeared because the skill was
  actually run (section 4).
- **`FormField` had a screen-reader defect** (`Error:Enter…` with no space), caught by
  a test, and fixed along with the same pattern in `StatusBadge`.

## 2. Important files

| Purpose | Files |
|---|---|
| Tokens and styles | `src/styles/tokens.css`, `src/styles/index.css` |
| Components | `src/components/*.tsx`, `src/lib/cx.ts`, `src/lib/token-parse.ts` |
| Content | `src/content/schema.ts`, `validate.ts`, `site-content.json` |
| Dev pages | `index.html`, `dev/showcase.html`, `dev/content-demo.html`, `src/dev/*` |
| Token and contrast tooling | `scripts/lib/tokens.ts`, `scripts/lib/contrast.ts`, `scripts/check-contrast.ts` |
| Image tooling | `scripts/lib/image-pipeline.ts`, `optimize-images.ts`, `verify-images.ts` |
| Screenshot tooling | `scripts/capture-screenshots.ts` |
| Claude Code | `.claude/agents/design-system-auditor.md`, `.claude/skills/optimize-web-images/SKILL.md` |
| Docs | `docs/style-guide.md`, `component-reference.md`, `content-model.md`, `audit-rules.md`, `traceability-matrix.md`, `token-tracking.md`, `evidence/` |
| Config | `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `package.json` |
| Changed from Phase B | `scripts/track-usage.ts`, `scripts/lib/usage-parse.ts`, `tests/usage-parse.test.ts` (collector 1.1.0) |
| Documentation defect fixed | `docs/asset-manifest.json`, `docs/reference-catalogue.md` (`.jpg` to `.png` for two photographs) |

`references/` was not modified: `git status` shows it clean.

## 3. Tests and checks actually run

| Command | Result |
|---|---|
| `npm run check` (typecheck, lint, format, tokens, content, tests, build) | **exit 0** |
| `npm test` | **7 files, 242 tests passed** |
| `npm run check:tokens` | 23/23 contrast pairs pass |
| `npm run validate:content` | VALID, 3 images checked |
| `npm run images:verify` | 46/46 checks |
| `npm run capture` (3 pages x 1280/768/390) | no horizontal overflow, 9 screenshots |

| Test file | Tests | Covers |
|---|---:|---|
| `tokens.test.ts` | 51 | token presence, resolution, docs sync (names and values), contrast, no raw values in components |
| `components.test.tsx` | 35 | variants, loading/disabled, keyboard, label association, aria, status text and icons |
| `content-schema.test.ts` | 73 | valid, missing, types, unknown fields, links, images, structure, claim guard, errors, CLI |
| `content-render.test.tsx` | 14 | validated content renders; invalid content rendered as errors only |
| `image-pipeline.test.ts` | 26 | resize, no upscale, source integrity, EXIF, orientation, safety refusals, verification |
| `tooling.test.ts` | 19 | agent and skill file structure, rule catalogue, fixtures, docs point at real files |
| `usage-parse.test.ts` | 24 | the 17 Phase B tests (kept) plus 7 for subagent transcripts |

Checks I made to confirm checks can fail: a mutated docs value (caught), a lint probe
with hex and palette tokens (all three caught), a weakened colour (contrast test fails),
the original collector compared against the fixed one on real data.

**Separating pre-existing from new failures:** there were no pre-existing failures.
Every failure during the phase was caused by my own work and fixed, listed in
section 1. No test was deleted or weakened, and no lint finding was suppressed to pass.
One dependency change was made for a stated reason: Vitest 2 to 5, because Vitest 2
pinned Vite 5 against plugins needing Vite 8; the 17 Phase B tests passed after it.

## 4. Subagent and skill execution

Full records: [evidence/subagent-audit/README.md](evidence/subagent-audit/README.md),
[evidence/image-optimization/README.md](evidence/image-optimization/README.md).

**Subagent `design-system-auditor`.** Invoked as a real subagent (the event stream
shows an `Agent` call with `subagent_type: "design-system-auditor"`; no `Write` or
`Edit` calls in any run).
- **Blind fixture, two runs: all 3 planted violations found** with the expected rules
  (`DS-COLOR-01`, `A11Y-01`, `CONTENT-01`), exact line numbers (checked).
- Corrected fixture: **PASS, 0 confirmed** (two runs).
- Real production components: PASS, 0 confirmed, 2 sensible uncertain observations.
- **Not clean:** the first blind run reported 5 findings, one a mis-application of a
  rule; a fix removed that one but the agent still double-files one defect. Its final
  message sometimes carries narration before the report. It is an LLM and
  non-deterministic. My first fixture **leaked the answers in a comment**, so I built
  a blind one; the first run is a smoke test only.

**Skill `optimize-web-images`.** Invoked as `/optimize-web-images` in a fresh process.
- Attempt 1 and 2 **failed on permission patterns in my own skill** (`images:*` does not
  match `images:optimize`; PowerShell not allowlisted). Both fixed.
- Attempt 3 **succeeded**: 4 originals (2.63 MB) to 6 WebP files (267.6 KB, 90.1%
  smaller); 46/46 independent checks; originals unchanged; EXIF stripped.
- When its report write was denied, the child tried seven other ways to write it. The
  boundary held; the report is now a built-in output of the verifier.
- Only two of six outputs were viewed by eye.

## 5. Token and session tracking

**Source:** Claude Code's local transcripts for this project only, via the preserved
Phase B collector. Collected at 2026-10-24 ~06:55 UTC (newest request in the ledger).
**This session is still running, so its figures are a snapshot that will grow.**

### The gap that was found

Collector 1.0.0 read only `<session>.jsonl`. Subagent work lives in
`<session>/subagents/agent-*.jsonl`, so it was uncounted. Phase B could not have seen
this (no subagent had run). Collector **1.1.0** reads those files and attributes the
usage to the parent session. On the same data at the same moment, the original reported
241 requests / 50,407,720 tokens and the fix 315 / 52,638,198: **74 requests and
2,230,478 tokens (4.2%) had been missed**, all from the `design-system-auditor`
(6 agents). Documented in [token-tracking.md](token-tracking.md).

### Sessions: 13 transcript sessions, not 13 sittings

| Kind | Count | Total tokens |
|---|---:|---:|
| Interactive working sessions | 2 (Phase A+B; Phase C) | 58,123,376 |
| Demonstration child runs (`claude -p` launched by this tooling) | 10 | 4,252,748 |
| Helper (title generation, `cost-state` only) | 1 | 0 (1,191 reported separately) |
| **Project total** | **13** | **62,376,124** |

| Session | Kind | Purpose | Requests (subagent) | Total tokens | Model(s) |
|---|---|---|---:|---:|---|
| `c5817597…` | interactive | Phase A + B | 66 (0) | 8,196,703 | claude-opus-5, claude-sonnet-5-5 |
| `fa729ae8…` | interactive | Phase C (this session) | 140 (0) | 49,926,673 | claude-sonnet-5-5 |
| `7cc39af0…` | child | skill attempt 1 (blocked) | 13 (0) | 466,161 | claude-sonnet-4-6 |
| `58bda065…` | child | skill attempt 2 (blocked) | 11 (0) | 368,374 | claude-sonnet-4-6 |
| `da805e33…` | child | skill attempt 3 (succeeded) | 19 (0) | 843,197 | claude-sonnet-4-6 |
| `76c09373…` | child | audit run 1, annotated fixture | 7 (5) | 162,035 | claude-sonnet-4-6 |
| `21ea3623…` | child | audit run 1b, blind | 7 (5) | 164,566 | claude-sonnet-4-6 |
| `f5971897…` | child | audit run 1c, blind, tightened agent | 9 (7) | 224,531 | claude-sonnet-4-6 |
| `3ce993b4…` | child | audit run 2, corrected fixture | 16 (14) | 448,901 | claude-sonnet-4-6 |
| `66cb4f8d…` | child | audit run 2b, corrected, final agent | 13 (11) | 349,479 | claude-sonnet-4-6 |
| `a6067e33…` | child | audit run 3, production components | 34 (32) | 1,199,155 | claude-sonnet-4-6 |
| `861d0671…` | child | fresh-session handoff test | 1 (0) | 26,349 | claude-sonnet-4-6 |
| `cdcd3731…` | helper | title generation | 0 (0) | 0 | none |

### Project-wide totals (formula: input + output + cache-creation + cache-read)

| Component | Tokens |
|---|---:|
| Input | 580 |
| Output | 391,363 (of which thinking 91,681, not added again) |
| Cache creation | 1,231,823 |
| Cache read | 60,752,358 |
| **Total** | **62,376,124** across 336 requests (262 main thread, 74 subagent) |

By model: `claude-opus-5` 59 requests, 7,156,505; `claude-sonnet-5-5` 147, 50,966,871;
`claude-sonnet-4-6` 130, 4,252,748.

**Read this number carefully.** 97.4% of it is cache-read: the same conversation
context re-processed on every request. Input, output and cache-creation together are
**1,623,766 (2.6%)**. The total measures tokens *processed*, not new content, and
grows faster than linearly with session length. It is not a cost and not a subscription
usage figure.

### Limitations

- **Snapshot.** The Phase C session is running; its totals will increase. The tables above are the snapshot at ~06:55 UTC (336 requests, 62,376,124 tokens). The regenerated `tracking/` files in the working tree were collected later and show larger figures (349 requests, 69,075,158 tokens at the last run) because work and this report kept adding requests. Both are correct for their collection time; the session count was 13 in both.
- **Running vs ended is inferred** (15-minute staleness), so some finished child runs
  display as `running`.
- **Model discrepancy, unexplained.** Every request in the Phase C session is recorded
  as `claude-sonnet-5-5` (served and requested), although the session began with
  `/model claude-opus-5`. The ledger reports what the transcript says; check `/status`
  if the model matters for the assignment.
- Subscription-level `/usage` is not machine-readable and is not tracked.
- The other project's transcripts were not read, as agreed.
- Child sessions cost tokens: 10 demonstration runs used 4.25M (6.8% of the total),
  mostly for the three skill attempts and the audit runs that tuned the agent.

## 6. Outstanding issues and risks

| # | Item | Risk |
|---|---|---|
| 1 | **Draft copy.** `swoImplementation` statements in the sample content describe how SWO uses ACWR, fatigue/recovery and progressive overload. Nothing in the repository establishes the algorithm, so the project owner must confirm or correct them | Could misdescribe the product |
| 2 | **No citations verified.** All three frameworks are `framework-description-only`. The claim guard is a heuristic, not editorial review | Unsupported-claim risk remains in future copy |
| 3 | **Proposed, unvalidated values**: breakpoints, shadows, focus-ring size, `--min-target-size`; Inter is named but **not loaded** | May need revision against a real layout |
| 4 | **Screenshot content for Phase D**: the product screenshots show a third-party dev URL in the browser bar; `session-end-card.png` shows a personal profile photo and handle | Privacy/branding; needs a cropping decision |
| 5 | **`workout-02.png`** has a visible sparkle mark resembling an AI-editing watermark, and third-party logos | Fit with "personal gym photography" |
| 6 | **ESLint 9 is end-of-support** (npm warns), held back because `eslint-plugin-jsx-a11y` does not support ESLint 10 | Revisit when the plugin updates |
| 7 | **No assistive technology used**; accessibility is automated assertions and contrast maths only | Real-world gaps possible |
| 8 | **The `after` audit fixture's comments name the fixed violations** (not a blind test) | Limited; a hint cannot cause a wrongful PASS |
| 9 | **The interactive fresh-session test is still the user's to run** | Acceptance item open |
| 10 | **`dev/` pages are built into `dist/`** by the current Vite config | Phase D must exclude them from production |
| 11 | Port 4173 on this machine is held by another project's server; a first screenshot batch accidentally hit it (I only loaded a page, read nothing, and discarded the images) | Use explicit ports and check the page title |

## 7. Recommended next step for Phase D

1. **You review** this phase, then run the interactive fresh-session handoff
   (script in [evidence/handoff/README.md](evidence/handoff/README.md)).
2. **Decide the open questions** in section 6 items 1, 3, 4 and 5. In particular
   confirm the `swoImplementation` copy and choose a screenshot-cropping approach.
3. **Give a separate Phase D instruction.** Suggested order: hero from validated
   content, then how-it-works and the Green/Amber/Red section (the highest-value
   proof of the product), then product walkthrough, science, FAQ. Build page
   sections as thin compositions over the existing primitives, and add only the
   components a section needs (for example a recommendation panel).
4. **Use the auditor and `npm run check` on each section** before moving on, and
   capture real desktop and mobile screenshots of the site with `npm run capture`.
5. **Merge `dev` to `main` only after review.**
