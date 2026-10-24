# Evidence: `design-system-auditor` subagent

**Outcome: the subagent was invoked as a real Claude Code subagent, found all
three planted violations on a blind fixture, and passed the corrected fixture.
It also over-reported on one run and its output format is not fully reliable. Both
are recorded below.**

| Item | Where |
|---|---|
| Subagent definition | [`.claude/agents/design-system-auditor.md`](../../../.claude/agents/design-system-auditor.md) |
| Rule catalogue it cites | [`docs/audit-rules.md`](../../audit-rules.md) |
| Fixtures | [`fixture/`](fixture/): `before-annotated/`, `before-blind/`, `after/` |
| Raw event streams | `run*.stream.jsonl` |
| Extracted reports | `run*.report.txt` |
| Structural tests | `tests/tooling.test.ts` |

## Ground truth (kept out of the audited file)

The fixture `RiskSummarySection.tsx` contains exactly three deliberate violations.

| ID | Planted violation | Line (blind fixture) | Expected rule |
|---|---|---|---|
| V1 | Hard-coded colour: `style={{ color: '#0B7A6B' }}` instead of a token | 30 | `DS-COLOR-01` |
| V2 | Risk indicator relying on colour only: a coloured dot with no label or icon | 22 | `A11Y-01` |
| V3 | Renders unvalidated content: imports `site-content.json` and renders it directly | 4, 13 | `CONTENT-01` |

Both fixture variants compile as TypeScript (checked with a throwaway tsconfig), so
they are realistic code. They live under `docs/evidence/`, which is excluded from
lint, type-check, Prettier and the build.

## Invocation

A fresh Claude Code process registers `.claude/agents/` at startup (the init event
lists `design-system-auditor` among the loaded agents). The main model is asked to
delegate; the event stream proves it did:

```bash
claude -p "Use the design-system-auditor subagent to audit the file <path>. \
  Pass it only the file path. Return the subagent's report verbatim, with nothing added or removed." \
  --model sonnet \
  --allowedTools "Agent" "Read" "Glob" "Grep" \
    "Bash(git diff *)" "Bash(git status *)" "Bash(git log *)" \
    "PowerShell(git diff *)" "PowerShell(git status *)" "PowerShell(git log *)" \
  --output-format stream-json --verbose
```

**Redaction:** each stream's `init` event originally listed the authoring machine's
connected connectors, plugins, slash commands, memory paths and tool inventory.
Those fields were replaced with `[redacted: local environment inventory]` before
committing, as they are unrelated personal environment data. Nothing else in the
streams was altered: the loaded `agents` list, session id, model, every tool call and
every result are as captured.

In every run the stream shows one `Agent` tool call with
`subagent_type: "design-system-auditor"`, followed by the subagent's own `Read`
and `Grep` calls attributed to it (`parent_tool_use_id` set). **Zero** `Write` or
`Edit` calls occurred in any run. The subagent's own tools are `Read, Grep, Glob,
Bash`; the Bash allowlist was limited to read-only git commands.

## Runs

| Run | Fixture | Agent version | Verdict | Confirmed | Notes |
|---|---|---|---|---|---|
| 1 | `before-annotated` | first | **FAIL** | 3 | **Not blind**: the file's header comment announced the violations and expected rules. Treat as a smoke test only |
| 1b | `before-blind` | first | **FAIL** | 5 | **Blind.** All three planted found. Two extras (below) |
| 1c | `before-blind` | tightened | **FAIL** | 4 | Blind. All three planted found. One related extra |
| 2 | `after` | first | **PASS** | 0 | 1 uncertain observation |
| 2b | `after` | **final** | **PASS** | 0 | 0 uncertain observations |
| 3 | `src/components/` (production) | first | **PASS** | 0 | 2 uncertain observations |

"First" and "final" refer to the agent definition. After run 1b I tightened the rule
wording and the agent's output instructions (see "Defects found in the agent").

### Scoring against the ground truth (blind runs)

| Planted | Run 1b | Run 1c |
|---|---|---|
| V1 `DS-COLOR-01`, line 30 | found, exact line, quoted | found |
| V2 `A11Y-01`, line 22 | found, exact line, quoted | found |
| V3 `CONTENT-01`, lines 4 and 13 | found, exact lines, quoted | found |
| **Recall** | **3 / 3** | **3 / 3** |

Extra confirmed findings beyond the three:

| Run | Extra | My judgement |
|---|---|---|
| 1b | `DS-COMP-01` on line 22: hand-built status dot instead of `StatusBadge` | Legitimate but **overlapping**: the same defect as V2 |
| 1b | `DS-STATE-01` on lines 6-10, 22: dots "used decoratively" | **Questionable.** The dots represent decision states, which is exactly why `A11Y-01` applies, so "decorative" contradicts the agent's own V2 finding |
| 1c | `DS-COMP-01` on line 22 | Same overlap as above, still filed separately |

So **precision on the planted violations was perfect, but the agent double-files
one defect under neighbouring rules.** Whether an overlapping finding counts as a
false positive is a judgement call. I count the `DS-STATE-01` one as a
mis-application and the `DS-COMP-01` ones as redundant but defensible.

## Independent checks on the agent's reports

| Claim | Check |
|---|---|
| Line numbers (15/24, 33, 41 in the annotated file; 4/13, 22, 30 in the blind file; `tokens.css` line 80) | All exact (checked with `grep -n`) |
| Quoted code | Matches the file |
| "No tests, lint, type-check, build or browser were run" | Consistent with the tool calls: only `Read`/`Grep`/`Glob` and one blocked Bash |
| "`SiteContent` is exported from `validate.ts`" (in run 1's recommended fix) | **Wrong**: it is exported from `schema.ts`. A slip in remediation advice, not in any finding or rule citation |
| Subagent stays read-only | No `Write`/`Edit` calls in any stream. In run 3 it tried a PowerShell `Select-String` via Bash, which was not allowlisted and was denied, then fell back to `Grep` |

## Defects found in the agent (and what was done)

1. **Narration before the report (run 1b).** 3,299 characters of reasoning preceded
   the `# Design-system audit` heading, against the output spec. *Fix:* the agent now
   states the final message must contain only the report. *Result:* run 1c began at
   the heading; run 2b still emitted a **241-character preamble**. Format adherence
   is **improved, not guaranteed.**
2. **Overlapping findings (runs 1b, 1c).** The agent filed one defect under two or
   three rules. *Fix:* added "One defect, one finding" to `docs/audit-rules.md` and
   narrowed `DS-STATE-01`. *Result:* the `DS-STATE-01` mis-application disappeared;
   `DS-COMP-01` is still filed separately. **Partly fixed.** I stopped there rather
   than keep tuning wording against a single fixture, which would overfit.
3. **Inconsistency between runs.** Run 1 treated hard-coded JSX strings (`Questions?`,
   `Read the FAQ`) as a borderline `CONTENT-03` case; run 2 asserted all text comes
   from the `statuses` prop, which is not true of those strings. Same code, different
   conclusions: the audit is an LLM and **not deterministic**.

## Corrected fixture

`fixture/after/RiskSummarySection.tsx` fixes each violation: a semantic token class
(`text-brand-primary`), `StatusBadge` with a label, icon and colour, and a prop typed
`SiteContent['statuses']` instead of an imported JSON file. It audited **PASS (0
confirmed)** in runs 2 and 2b. The `after` file's comments name the violations they
fix, so it is **not** a blind test, but a hint toward "this was bad" cannot cause a
PASS to be wrongly reached.

## Limits

- **One sample per fixture.** Each audit was run once or twice. Because the agent is
  an LLM, a different run might miss something. Recall of 3/3 across two blind runs is
  encouraging, not proof.
- **Only three violation types were tested.** Nothing here shows it catches
  responsive, spacing, typography or other rule families.
- **It reads; it does not run.** It never executed tests, lint or a browser, and says so.
  The structural checks (lint, `tokens.test.ts`) remain the enforced gates; the
  agent is an additional review layer, not a replacement.
- **Cost.** Wall-clock time was about 1.3 to 3.4 minutes per audit. Tokens
  *processed* (input + output + cache; dominated by re-read cached context), subagent
  included, from the ledger: 162K (run 1), 165K (1b), 225K (1c), 449K (2), 349K (2b),
  and 1.2M (run 3, a whole directory). A single-file audit is therefore **hundreds of
  thousands of processed tokens, not tens of thousands**: an earlier version of this
  note said 50-55K, which counted the main thread only because subagent usage was not
  yet being collected. Each run was a separate session and is in the token ledger.
- **Uncertain observations on production code** (run 3) were accurate but not
  acted on: `SectionContainer` and `Card as="section"` document that they need an
  accessible name but cannot enforce it.
