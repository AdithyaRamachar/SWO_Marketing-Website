# Final assignment evidence pack — Smart Workout Optimizer

Evidence for the Product Management assignment: directed Claude Code to build reusable
frontend tooling and demonstrate that it works.

All five requirements below link to evidence files in this directory and to existing
evidence preserved from Phase C and D.

---

## Assignment checklist

| Req | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Structured content pipeline demonstrated | **Verified complete** | `01-structured-content.md` |
| 2 | Design-system audit subagent: three violations detected, fixed, re-audited | **Verified complete** | `02-audit-subagent.md`, `audit-fixture/` |
| 3 | Fresh-session handoff: new session understood project from CLAUDE.md | **Verified (automated analogue)** | `03-fresh-session-handoff.md` |
| 4 | Custom image-optimization skill: before/after demonstrated | **Verified complete** | `04-custom-skill.md` |
| 5 | Token and session accounting: totals with limitations | **Verified complete** | `05-token-session-accounting.md` |

---

## 1. Structured content pipeline

**Status: Verified complete**

The full pipeline from JSON → Zod schema → React component → visible page is
implemented and tested.

| Evidence item | Location |
|---|---|
| Pipeline walkthrough + traceability table | `01-structured-content.md` |
| Content source file | `src/content/site-content.json` |
| Zod schema (validator + types) | `src/content/schema.ts` |
| Validation boundary | `src/content/validate.ts` → `assertValidSiteContent()` |
| Entry point (single call site) | `src/main.tsx` line 15 |
| Marketing page composition | `src/page/MarketingPage.tsx` |
| Section components (11 sections) | `src/sections/` |
| Content-schema tests (73 test cases) | `tests/content-schema.test.ts` |
| Screenshots of rendered page | `docs/evidence/screenshots/phase-d/` |
| Content-render tests | `tests/content-render.test.tsx` |

**Reproduction:**
```bash
npm run validate:content          # validates JSON against schema + image dimensions
npm test                          # 248 tests including 73 content-schema cases
npm run dev                       # serve at http://localhost:5173/
```

---

## 2. Design-system audit subagent

**Status: Verified complete**

An isolated three-violation fixture was created, audited (FAIL), corrected, and
re-audited (PASS). The production website was also audited.

| Evidence item | Location |
|---|---|
| Evidence document | `02-audit-subagent.md` |
| Before fixture (3 violations) | `audit-fixture/before/WorkoutStatusCard.tsx` |
| After fixture (corrected) | `audit-fixture/after/WorkoutStatusCard.tsx` |
| Before audit findings | `audit-fixture/before-audit-run1.txt` |
| Subagent definition | `.claude/agents/design-system-auditor.md` |
| Rule catalogue | `docs/audit-rules.md` |
| Phase C subagent evidence | `docs/evidence/subagent-audit/` |
| Phase D production audit | `docs/phase-d-report.md` |

**Ground truth — three deliberate violations and detection:**

| ID | Rule | Was detected? |
|---|---|---|
| A: hex colour `#0B4A5C` | DS-COLOR-01 | **Yes** (line 34, exact quote) |
| B: colour-only status dot | A11Y-01 | **Yes** (lines 37–55) |
| C: raw JSON import | CONTENT-01 | **Yes** (lines 25, 59) |

**Reproduction:**
```bash
# Audit before fixture (expect FAIL)
claude -p "Use the design-system-auditor subagent to audit \
  docs/evidence/final-assignment/audit-fixture/before/WorkoutStatusCard.tsx \
  against docs/audit-rules.md." \
  --model sonnet --allowedTools "Agent" "Read" "Glob" "Grep"

# Audit after fixture (expect PASS)
claude -p "Use the design-system-auditor subagent to audit \
  docs/evidence/final-assignment/audit-fixture/after/WorkoutStatusCard.tsx \
  against docs/audit-rules.md." \
  --model sonnet --allowedTools "Agent" "Read" "Glob" "Grep"
```

---

## 3. Fresh-session handoff

**Status: Verified (automated analogue — see limitations)**

A fresh `claude -p` process with no background context answered 9/9 project questions
correctly from `CLAUDE.md` alone.

| Evidence item | Location |
|---|---|
| Evidence document | `03-fresh-session-handoff.md` |
| Questions prompt | `docs/evidence/handoff/questions.txt` |
| Raw session output | `docs/evidence/handoff/fresh-session.raw.json` |
| Session ID | `861d0671-aa5d-4ed2-9c8b-f0d27203a5f6` |

**Reproduction:**
```bash
claude -p "$(cat docs/evidence/handoff/questions.txt)" \
  --model sonnet \
  --allowedTools "Read" "Glob" "Grep" \
  --output-format json
```

**Limitation:** The interactive form (a human starting a new session, asking open
questions, and attempting a real task) has not been demonstrated. See
`03-fresh-session-handoff.md` for a script to run it.

---

## 4. Custom image-optimization skill

**Status: Verified complete**

The skill was invoked through Claude Code (after diagnosing and fixing two permission
defects), produced 15 output files from 9 sources, and all 122 verification checks pass.

| Evidence item | Location |
|---|---|
| Evidence document | `04-custom-skill.md` |
| Skill definition | `.claude/skills/optimize-web-images/SKILL.md` |
| Before/after table (Phase C) | `docs/evidence/image-optimization/before-after.md` |
| Phase D run report | `docs/evidence/image-optimization/phase-d/run.report.txt` |
| Image manifest | `public/images/manifest.json` |
| Generated derivatives | `public/images/product/`, `public/images/photography/` |

**Reproduction:**
```bash
npm run images:verify             # 122/122 checks — confirms derivatives are intact
git status references/            # confirms sources are unmodified (empty output expected)
```

---

## 5. Token and session accounting

**Status: Verified complete (with limitations)**

| Evidence item | Location |
|---|---|
| Evidence document | `05-token-session-accounting.md` |
| Ledger (machine-readable) | `tracking/usage-ledger.json` |
| Summary (human-readable) | `tracking/usage-summary.md` |
| Tracker source | `scripts/track-usage.ts` |

**Current totals (last run during this session):**

| Metric | Value |
|---|---|
| Sessions | 15 (1 running — this session) |
| Deduplicated requests | 610 |
| Output tokens | ~584 K |
| Cache-read tokens | ~101 M |
| **Total tokens** | **~103 M** |

The 103 M total is dominated by cache-read tokens (~97%). Output tokens (actual
model-generated text) are ~584 K. See `05-token-session-accounting.md` for a full
breakdown and discussion of what this number measures.

**Reproduction:**
```bash
npm run track:usage               # regenerates from local transcripts; idempotent
```

---

## Related evidence not in this directory

| Item | Location |
|---|---|
| Phase C report | `docs/phase-c-report.md` |
| Phase D report | `docs/phase-d-report.md` |
| Design token style guide | `docs/style-guide.md` |
| Component reference | `docs/component-reference.md` |
| Audit rule catalogue | `docs/audit-rules.md` |
| Evidence index (all phases) | `docs/evidence/README.md` |
| Responsive screenshots | `docs/evidence/screenshots/phase-d/` |
| Interaction check | `docs/evidence/phase-d/interaction-check.txt` |

---

## What is NOT in this evidence pack

| Item | Reason |
|---|---|
| Human visual browser review | Not performed — all visual checks are machine measurements or screenshots |
| Interactive fresh-session handoff | Requires a human to start a new session; see `03-fresh-session-handoff.md` |
| USD cost figures | Tracker sums tokens, not currency; pricing not applied |
| Subscription-level `/usage` view | Not machine-readable |
| swoImplementation copy confirmed by product owner | Draft copy; owner confirmation still outstanding |
