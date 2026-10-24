# Evidence index

Every item below states what was run and what it showed. Status words mean:
**Completed** (performed, result observed), **Partial** (performed but narrower than
the brief wanted, with the gap stated), **Not done** (planned or blocked).

Figures that grow while sessions run (tokens, requests) are in
[../phase-c-report.md](../phase-c-report.md) with the time they were collected.
Re-run `npm run track:usage` before quoting any of them.

## Checklist

| # | Evidence | Status | Where | What was observed |
|---|---|---|---|---|
| 1 | Token tracker tests and real data coverage | **Completed** | [../token-tracking.md](../token-tracking.md), [../../tracking/usage-summary.md](../../tracking/usage-summary.md) | 24 tracker tests pass. Real run: 13 sessions, 336 requests. A **gap in the Phase B collector was found and fixed** (subagent files were not read) |
| 2 | Design tokens defined | **Completed** | [../../src/styles/tokens.css](../../src/styles/tokens.css), [../style-guide.md](../style-guide.md) | One canonical file; 97 tokens, each documented with its exact value. `tests/tokens.test.ts` (51) fails on any drift |
| 3 | Colour contrast verified | **Completed** | `npm run check:tokens`, style guide "Contrast evidence" | 23/23 pairs pass WCAG. Four v0.1 values were found failing and **changed** (documented with the measurement) |
| 4 | Component specifications and tests | **Completed** | [../component-reference.md](../component-reference.md), `tests/components.test.tsx` (35) | 6 primitives. Variants, loading/disabled, label association, aria attributes, status text+icon asserted |
| 5 | Design-system showcase page | **Completed** | `dev/showcase.html`, [screenshots/](screenshots/) | Typography, colour, spacing, radii, shadows, buttons and states, cards, forms, all three status states. Viewed at 1280 and 390 px; **no horizontal overflow at 1280, 768 or 390** (measured) |
| 6 | Reference → rule → token → component trace | **Completed** (one component) | [../traceability-matrix.md](../traceability-matrix.md) | `StatusBadge` (Green) traced link by link with real line numbers. Most other matrix rows are honestly **Partial** or **Not started** |
| 7 | Structured content validation | **Completed** | [../content-model.md](../content-model.md), `tests/content-schema.test.ts` (73) | Valid, missing, wrong-type, unknown-field, bad-link, bad-image, duplicate, claim-guard and error-format cases. `npm run validate:content` also checks image files and dimensions |
| 8 | Validated content flowing into a rendered component | **Completed** | `dev/content-demo.html`, `tests/content-render.test.tsx` (14), [screenshots/](screenshots/) | Edit the JSON live: valid renders; invalid shows exact field paths and renders **nothing** |
| 9 | Subagent detects planted violations, then passes the corrected fixture | **Completed, with caveats** | [subagent-audit/README.md](subagent-audit/README.md) | Real `Agent` invocation, read-only. **3/3** planted violations found on a **blind** fixture (two runs); corrected fixture **PASS**. Over-reported once; output format not fully reliable; one sample per fixture |
| 10 | Custom skill with before/after measurements | **Completed, after 3 attempts** | [image-optimization/README.md](image-optimization/README.md) | 4 originals (2.63 MB) became 6 WebP files (267.6 KB). 46/46 verification checks. Two permission defects in the skill were found and fixed on the way |
| 11 | Fresh-session handoff | **Partial** | [handoff/README.md](handoff/README.md) | A fresh `claude -p` process answered **9/9** from `CLAUDE.md` alone. This is an **automated analogue**, written by the same author; the interactive user-run test is **Not done** |
| 12 | Tests, lint, type-check, build | **Completed** | `npm run check` | typecheck, ESLint, Prettier, contrast, content, **242 tests**, production build: all pass |
| 13 | Token totals and number of sessions | **Completed, provisional** | [../phase-c-report.md](../phase-c-report.md) | 13 sessions (2 interactive, 10 demonstration child runs, 1 helper). The authoring session is still running, so totals are a snapshot |
| 14 | Desktop and mobile screenshots of the **marketing website** | **Not done** | n/a | The landing page is Phase D. Screenshots here are of the **tooling pages** only |

## Commands that produced the evidence

| Evidence | Command | Result |
|---|---|---|
| Full gate | `npm run check` | exit 0 |
| Tests | `npm test` | 7 files, 242 tests passed |
| Contrast | `npm run check:tokens` | 23/23 pairs pass |
| Content | `npm run validate:content` | `VALID`, 3 images checked |
| Images | `npm run images:verify` | 46/46 checks passed |
| Screenshots | `npm run capture -- --url … --name … --widths 1280,768,390` | no overflow, 9 images |
| Tracker | `npm run track:usage` | 13 sessions; ledger regenerated |
| Skill | `claude -p "/optimize-web-images …"` | see `image-optimization/` |
| Subagent | `claude -p "Use the design-system-auditor subagent to audit …"` | see `subagent-audit/` |
| Handoff | `claude -p "$(cat docs/evidence/handoff/questions.txt)"` | 9/9 correct |

## Layout

```
docs/evidence/
  README.md                       this index
  image-optimization/             baseline, before/after, three raw invocation records
  subagent-audit/                 fixtures (before-annotated, before-blind, after), event streams, reports
  handoff/                        questions and raw fresh-session result
  screenshots/                    3 tooling pages x 3 widths
```

## Honest gaps

- No assistive technology (screen reader, switch device) was used; accessibility
  is covered by automated assertions and contrast measurement only.
- The subagent and skill were each demonstrated on a small number of runs.
- The sample content's `swoImplementation` statements are draft copy that the
  project owner must confirm.
- No page section has been built, so most traceability rows cannot be fully verified yet.
