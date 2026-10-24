# Evidence 2 — Design-system audit subagent

## The subagent

| Item | Location |
|---|---|
| Definition | `.claude/agents/design-system-auditor.md` |
| Rule catalogue | `docs/audit-rules.md` |
| Invocation | `Agent` tool with `subagent_type: "design-system-auditor"` |
| Tool access | Read, Grep, Glob, Bash (git read-only only) |

The subagent is registered at session start. It performs **read-only** code inspection
and cites findings by rule ID and file:line. It does not run tests, lint, or the build.

---

## Previous Phase C evidence

In Phase C, the subagent was demonstrated against a dedicated `RiskSummarySection.tsx`
fixture with three planted violations (V1: hex colour DS-COLOR-01, V2: colour-only dot
A11Y-01, V3: raw JSON import CONTENT-01). Run 1b (blind fixture) found all three plus
two additional observations. The corrected fixture passed with 0 findings.

See: `docs/evidence/subagent-audit/README.md` for full Phase C evidence.

---

## Phase D evidence (production code)

In Phase D recovery, the subagent was run against the real marketing website (14 files):

- **Run 1 — FAIL, 3 confirmed violations** (A11Y-06 ×2, CONTENT-03 ×1)
- All three were fixed in production code
- **Run 2 — PASS, 0 confirmed violations**

See: `docs/phase-d-report.md`, "Audit subagent" section.

---

## Final assignment three-violation fixture

A new isolated fixture, `WorkoutStatusCard.tsx`, was created to demonstrate the
three required violation types. It is located under `docs/evidence/final-assignment/`
and is **excluded from the production build, lint, type-check, and Prettier**.

### Fixture location

```
docs/evidence/final-assignment/audit-fixture/
  before/WorkoutStatusCard.tsx   ← three deliberate violations
  after/WorkoutStatusCard.tsx    ← all violations corrected
```

### Ground truth — the three deliberate violations

| ID | Violation type | Rule | Line | Evidence |
|---|---|---|---|---|
| A | Design token: hardcoded hex colour | DS-COLOR-01 | 34 | `const headingStyle = { color: '#0B4A5C' };` — used as `style={headingStyle}` on line 41 |
| B | Accessibility: status by colour only | A11Y-01 | 37–55 | Coloured circle (`'green'/'orange'/'red'`) with no text label and no icon shape |
| C | Structured content: unvalidated import | CONTENT-01 | 25, 59 | `import rawContent from '.../site-content.json'` rendered directly as `{rawContent.hero.headline}` |

---

## Audit run 1 — before fixture

**Verdict: FAIL — 4 confirmed violations**

The auditor found all three deliberate violations plus one additional real finding
(DS-COMP-01: the outer `div` reimplements the existing `Card` component).

| # | Rule | File:line | Finding | Deliberate? |
|---|---|---|---|---|
| 1 | DS-COLOR-01 | before/WorkoutStatusCard.tsx:34 | `const headingStyle = { color: '#0B4A5C' };` — raw hex, not a token | **Yes (violation A)** |
| 2 | A11Y-01 | before/WorkoutStatusCard.tsx:37–55 | Coloured dot (`'green'/'orange'/'red'`) with no text label or icon shape | **Yes (violation B)** |
| 3 | CONTENT-01 | before/WorkoutStatusCard.tsx:25, 59 | `import rawContent from …site-content.json` + direct `{rawContent.hero.headline}` render | **Yes (violation C)** |
| 4 | DS-COMP-01 | before/WorkoutStatusCard.tsx:41 | `<div className="rounded-card bg-surface-page p-4">` reimplements `Card` | Additional real finding |

**Detection rate for deliberate violations: 3/3 (100%)**

Raw finding notes (from subagent output):
> Finding 1 (DS-COLOR-01): "A raw hex value is hard-coded directly in the component's inline style, bypassing the design-token layer entirely."
> Finding 2 (A11Y-01): "The component renders a plain coloured circle as the sole indicator … There is no text label and no icon shape."
> Finding 3 (CONTENT-01): "The component imports the raw JSON file directly and renders a field from it without passing through `validateSiteContent()`."

---

## Corrections applied (before → after)

| Finding | Fix applied |
|---|---|
| DS-COLOR-01 | Removed `headingStyle` object; replaced inline style with `className="text-brand-primary"` |
| A11Y-01 | Replaced colour dot and `dotColour` variable entirely with `<StatusBadge status={…}>` which provides text label + icon |
| CONTENT-01 | Removed raw JSON import; added `content: SiteContent` typed prop; rendered `content.hero.supportingCopy` |
| DS-COMP-01 | Outer `div` replaced with `<Card as="article">` |

---

## Audit run 2 — after fixture

**Verdict: PASS — 0 confirmed violations**

All three deliberate violations are confirmed clean:

| Fixed violation | Rule | Auditor verdict | Evidence quoted |
|---|---|---|---|
| A: hex colour | DS-COLOR-01 | **CLEAN** | "`text-brand-primary` maps to `--color-brand-primary`… CLEAN." |
| B: colour-only dot | A11Y-01 | **CLEAN** | "StatusBadge renders a distinct icon shape, a screen-reader prefix, and a visible text label. Colour is no longer the sole channel. CLEAN." |
| C: raw JSON import | CONTENT-01 | **CLEAN** | "The component now accepts the validated SiteContent type as a typed prop. No JSON import exists anywhere in the file. CLEAN." |

One **uncertain observation** (not a confirmed violation): the outer `div` uses
`rounded-card` token directly rather than the `Card` component. The auditor noted
this may be a deliberate lighter wrapper. It did not affect the PASS verdict.

Raw findings: `audit-fixture/after-audit-run2.txt`

---

## Production audit result

The production website (`src/sections/`, `src/page/`, `src/components/`) was audited
twice in Phase D:

| Run | Files | Verdict | Findings |
|---|---|---|---|
| Run 1 (Phase D, before fixes) | 14 production files | **FAIL** | 3 confirmed (A11Y-06 ×2, CONTENT-03 ×1) |
| Run 2 (Phase D, after fixes) | 14 production files | **PASS** | 0 confirmed violations |

See `docs/phase-d-report.md` for details, including the three fixed violations and
the auditor's explicit confirmations by file and line.

---

## Reproduction commands

### Audit the before fixture
Invoke from the project root via the `Agent` tool in Claude Code with:
```
subagent_type: "design-system-auditor"
prompt: "Audit docs/evidence/final-assignment/audit-fixture/before/WorkoutStatusCard.tsx against docs/audit-rules.md. Report every finding with rule ID, file:line, and evidence."
```

Or via `claude -p`:
```bash
claude -p "Use the design-system-auditor subagent to audit \
  docs/evidence/final-assignment/audit-fixture/before/WorkoutStatusCard.tsx. \
  Return the subagent's report verbatim." \
  --model sonnet \
  --allowedTools "Agent" "Read" "Glob" "Grep"
```

### Audit the after fixture
Same command, replacing `before/` with `after/`.

### Audit the production website
```bash
claude -p "Use the design-system-auditor subagent to audit \
  src/page/MarketingPage.tsx src/sections/ src/components/. \
  Return the subagent's report verbatim." \
  --model sonnet \
  --allowedTools "Agent" "Read" "Glob" "Grep"
```

---

## Limitations

- The auditor is an LLM and is **not deterministic**. Two runs of the same file may
  differ in which issues are flagged and how they are worded.
- It performs read-only inspection. It does not run the TypeScript compiler, ESLint,
  Vitest, or a browser. Contrast ratios, layout overflow, and runtime behaviour are
  not checked.
- It may over-report (false positives) or miss edge cases. The Phase C README
  documents one over-report instance.
- The "uncertain observations" the auditor raises in each run require human review
  to classify as violations or non-issues.
