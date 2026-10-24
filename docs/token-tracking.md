# Token & Session Tracking

How Claude Code token consumption and session counts are measured for this
project, what the numbers mean, and what they do **not** cover.

## Quick reference

```bash
npm run track:usage     # collect/refresh; writes tracking/
npm test                # 17 tests over synthetic fixtures
```

Outputs, all regenerated from source on every run:

| File | Kind |
|---|---|
| `tracking/usage-ledger.json` | Machine-readable, full per-request detail |
| `tracking/usage-ledger.csv` | Machine-readable, one row per request |
| `tracking/usage-summary.md` | Human-readable summary |
| `tracking/manual-sessions.md` | Hand-maintained reconciliation for anything the parser cannot see |

## What the measurement source actually is

Claude Code writes a JSONL transcript per session to:

```
~/.claude/projects/<project-slug>/<sessionId>.jsonl
```

For this project the slug is `e--Projects-Airtribe-PM-SWO-Project`, derived from
the absolute working directory by lowercasing the drive letter and replacing
each `\`, `/`, `:` and `_` with a dash. `scripts/track-usage.ts` derives it the
same way and fails loudly, listing the folders it did find, rather than guessing
or estimating if the folder is absent.

Each `assistant` line carries the API's own `message.usage` object:

```json
{"input_tokens":2,"cache_creation_input_tokens":29165,
 "cache_read_input_tokens":27687,"output_tokens":582,
 "output_tokens_details":{"thinking_tokens":207}}
```

Every token figure in the ledger is copied verbatim from these fields. **Nothing
is estimated from characters, words or message sizes.** The `measurement` enum
includes `estimated`, but the collector never emits it; a test asserts this.

### Why the CLI is not the source

`claude --help` on version 2.1.153 exposes no usage, cost or stats subcommand.
The interactive `/usage` view shows subscription consumption but is not
machine-readable. Transcript parsing is the only reliable local option, and it
needs no API key.

## The double-counting trap

**One API response is written as several assistant lines — one per content
block — each repeating the same `usage` object.**

Measured on this project's real transcripts: 103 lines carried a `usage` object
but represented only 46 distinct requests. Summing lines would have inflated
every total by roughly 2.2×. Verified that duplicate lines share one
`message.id` and carry byte-identical token values.

The collector therefore deduplicates on **`requestId`**, falling back to
`message.id`, then `uuid`. Each request's `dedup_key` is recorded in the ledger
so the basis is auditable. If two lines share a key but disagree on token
values, the first is kept and the conflict is listed in
`diagnostics.conflicting_duplicates` rather than resolved silently.

Deduplication also runs **across files**, because a forked or resumed session
replays earlier requests. Replayed records keep their original `sessionId`, so
resumed work stays attributed to the session that produced it.

## Field definitions

| Field | Meaning |
|---|---|
| `session_id` | Claude Code session, from the record (not the filename) |
| `request_id` | Deduplication identity for one API request |
| `dedup_key` | Which field supplied `request_id` |
| `timestamp` | When the response was recorded (ISO 8601, UTC) |
| `model` | Model that served the request, e.g. `claude-opus-5` |
| `requested_model` | Model asked for, which can differ from the one that served it |
| `is_sidechain` | `true` for subagent traffic |
| `input_tokens` | Uncached input tokens. **Excludes** cached input |
| `output_tokens` | Generated tokens |
| `thinking_tokens` | **Subset of `output_tokens`.** Never added to the total |
| `cache_creation_input_tokens` | Tokens written into the prompt cache |
| `cache_read_input_tokens` | Tokens served from the prompt cache |
| `total_tokens` | See the formula below |
| `missing_fields` | Component fields absent from the record |
| `source` | Always `claude-code-transcript` |
| `measurement` | `reported` \| `calculated` \| `estimated` \| `unavailable` |

### The total formula

```
total_tokens = input_tokens + output_tokens
             + cache_creation_input_tokens + cache_read_input_tokens
```

These four fields are **disjoint** as reported by the API: `input_tokens`
excludes cached input, so cache reads are counted exactly once and never added
on top of `input_tokens`. A test asserts the project total equals the sum of the
four component totals.

`thinking_tokens` is excluded because it is already inside `output_tokens`.
Adding it would double-count.

### `measurement` semantics

`measurement` describes the **component** fields, which are copied verbatim.
`total_tokens` is always derived by the collector.

| Value | Meaning |
|---|---|
| `reported` | All four component fields present verbatim |
| `calculated` | Some absent; `total_tokens` is a **lower bound** from the fields that were present |
| `unavailable` | No numeric token fields; `total_tokens` is `null`, not `0` |
| `estimated` | Reserved and never emitted. This tracker does not estimate |

Missing values are `null`, never `0`, so a gap can never masquerade as zero
consumption.

## Three different things, not to be confused

| Concept | What it is | Where to see it |
|---|---|---|
| **Token consumption** | Tokens actually processed by the API | This tracker |
| **Subscription usage** | Consumption against plan limits over a rolling window | Interactive `/usage`, not machine-readable, **not** tracked here |
| **Context-window size** | How much a single request can hold at once | A per-request capacity, unrelated to cumulative totals |

Monetary cost is out of scope. The only dollar figure in the ledger comes from a
`cost-state` cross-check and is labelled as such.

## Coverage and known gaps

**Covered**

- Every API request in this project's local transcripts, including the session
  that built this tracker. No history was lost.
- Main-thread and subagent (sidechain) usage, reported separately.

**Not covered**

- **Subscription-level consumption.** `/usage` is not machine-readable.
- **Other project directories.** Tracking is deliberately scoped to this
  project. `~/.claude/projects/e--Projects-Airtribe-PM-AI-Agents-in-Prod-swo-site`
  (the pre-existing SWO product repo) is excluded and never read.
- **Pruned or rotated transcripts.** Nothing can be recovered from a transcript
  that does not exist. Use `tracking/manual-sessions.md`.
- **True session end times.** Claude Code writes no session-close record.
  `end_timestamp` is the **last observed request**, and session `status` is
  **inferred**: the live session is identified from `CLAUDE_CODE_SESSION_ID`,
  and any other transcript idle longer than `--staleness-minutes` (default 15)
  is treated as ended.
- **Sessions whose usage exists only in `cost-state`.** See below.

### The cost-state-only gap (found in real data)

Session `cdcd3731-bb11-48de-beb1-ae1373f11dc2` in this project has **zero**
usage-bearing assistant lines, yet its `cost-state` record reports 1,174 input
and 17 output tokens on `claude-haiku-5-5` — an auxiliary call, such as
conversation-title generation.

The collector surfaces this instead of dropping it:

- sessions are derived from the union of transcript filenames and request
  records, so a session with no countable requests still appears with 0;
- its recoverable usage is reported under `cost_state_supplement`, **separate
  from the headline totals**, because it comes from a different and
  inconsistently written source with different field names.

`cost-state` is a **cross-check, never the measurement source**: it was absent
entirely from this project's main session transcript.

## Safety properties

- **Read-only on `~/.claude`.** The collector only reads. It never writes,
  moves, renames or deletes Claude Code's own data, and writes solely into
  `tracking/`.
- **Privacy.** No prompt text, message content, file content, code, secrets or
  credentials reach the output. Only ids, timestamps, model names and numbers.
- **Idempotent.** Keyed on `requestId`, with ledgers rebuilt from source rather
  than appended to, and no run timestamp in any output file. Two consecutive
  runs over unchanged input are byte-identical.
- **Resilient.** Malformed, truncated and non-object lines are skipped and
  counted in `diagnostics.lines_malformed`, never allowed to abort collection.
- **Refuses to invent.** With no transcript directory or no `.jsonl` files it
  exits non-zero, writes no ledger, and says so.

## Verification evidence

Commands actually executed, with observed results.

### `npm test` — 17 passed

```
 ✓ tests/usage-parse.test.ts (17 tests) 2233ms
 Test Files  1 passed (1)
      Tests  17 passed (17)
```

Input is synthetic fixture data in `tests/fixtures/synthetic-usage/`, labelled
throughout (`SYNTHETIC-` session ids, `SYN-REQ-` request ids, `"_synthetic": true`
on every record). Expected totals are hand-computed in that directory's README,
so assertions do not merely restate the code's own output.

Coverage: deduplication (4 identical lines → 1 request); cross-file dedup of a
fork replay; hand-computed aggregation (11,888 tokens); thinking tokens as a
subset; per-model split; missing fields as `unavailable`/`calculated` rather than
`0`; malformed-line handling; conflicting-duplicate detection; sidechain split;
running vs ended status; deterministic CSV ordering; end-to-end ledger totals;
byte-identical idempotency; and refusal to write anything when no source exists.

### `npm run track:usage` — real data

```
Claude Code usage collection — SWO website
  source dir      C:\Users\Adithya Ramachar\.claude\projects\e--Projects-Airtribe-PM-SWO-Project
  files           2
  lines read      453
  usage lines     103
  duplicates cut  57 (same requestId, identical usage)
  malformed       0

  sessions        2 (1 running)
  requests        46
  input           92
  output          62,091 (thinking 10,238)
  cache create    115,291
  cache read      4,974,990
  TOTAL           5,152,464

  cost-state only 1,191 tokens in 1 session(s), reported separately (different source)
```

### Idempotency on real data

Two consecutive runs, then compared:

```
usage-ledger.json: IDENTICAL
usage-ledger.csv: IDENTICAL
usage-summary.md: IDENTICAL
```

**These figures grow as work continues** — they were current when this document
was written, during the tracker-development session itself. `tracking/` holds
the live numbers; re-run the command before quoting a total.

## Manual reconciliation

If a session cannot be collected automatically, record it in
`tracking/manual-sessions.md` with the reason. Do not edit the generated ledger:
it is overwritten on the next run, and hand-edited figures would be
indistinguishable from measured ones. **Never estimate or invent historical
usage.**
