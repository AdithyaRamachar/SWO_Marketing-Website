# Manual Session Reconciliation

Append-only record of Claude Code sessions that `npm run track:usage` **cannot**
collect automatically. This file is hand-maintained and is never overwritten by
the collector.

## Rules

1. Add a row only for a session the collector genuinely cannot see.
2. State **why** it is uncollectable.
3. Enter token counts only where a real, citable source exists. Leave them
   blank otherwise — **never estimate or invent usage.**
4. Do not edit `usage-ledger.json`, `usage-ledger.csv` or `usage-summary.md`.
   They are regenerated from source on every run, and a hand-edited figure
   there would be indistinguishable from a measured one.

## Uncollectable sessions

| Session / date | Why uncollectable | Input | Output | Cache read | Cache create | Total | Source of figures |
|---|---|---|---|---|---|---|---|
| _(none recorded)_ | — | — | — | — | — | — | — |

As of the Phase B verification run, every session for this project was
collected automatically from local transcripts. No manual reconciliation was
required.

## Partially collected sessions

Sessions the collector sees but cannot fully quantify. These are already
reported in the generated ledger; this section exists to explain them.

| Session | Limitation | Where it is reported |
|---|---|---|
| `cdcd3731-bb11-48de-beb1-ae1373f11dc2` | No usage-bearing assistant lines. Usage survives only in a `cost-state` record: 1,174 input + 17 output tokens on `claude-haiku-5-5` (auxiliary call, e.g. title generation). | `cost_state_supplement` in `usage-ledger.json`, and the "Sessions with usage only in cost-state" section of `usage-summary.md`. Deliberately excluded from the headline totals because it comes from a different source. |

## Out-of-scope usage, recorded for honesty

Not a gap in this project's tracking — noted so the scope boundary is explicit.

| Source | Status |
|---|---|
| `~/.claude/projects/e--Projects-Airtribe-PM-AI-Agents-in-Prod-swo-site` | The pre-existing SWO **product** repository, outside this assignment. Excluded by decision; never read by the collector. |
| Subscription-level consumption (interactive `/usage`) | Not machine-readable, so not tracked. It measures plan limits, which is a different quantity from token consumption. See [../docs/token-tracking.md](../docs/token-tracking.md). |
