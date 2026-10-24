# Evidence 5 — Token and session accounting

## Source of truth

All figures come from local Claude Code session transcripts, collected by
`scripts/track-usage.ts` (collector version 1.1.0).

```
Source directory: C:\Users\Adithya Ramachar\.claude\projects\e--Projects-Airtribe-PM-SWO-Project
```

The collector reads every `*.jsonl` file under that directory, including
`<sessionId>/subagents/agent-*.jsonl` for subagent usage. It deduplicates by
`requestId` (falls back to `message.id`, then a generated UUID). It does **not**
estimate any value; it only sums what the API returned in `usage` fields.

To refresh: `npm run track:usage`

---

## Current totals (at last tracker run during this session)

| Category | Tokens |
|---|---|
| Input | 1,049 |
| Output | 584,417 |
| — of which thinking (subset, not added) | 122,809 |
| Cache creation | 2,023,013 |
| Cache read | 100,794,350 |
| **Total** | **103,402,829** |

**Sessions: 15** (1 marked running — this session)
**Deduplicated requests: 610**

Formula: `total = input + output + cache_creation + cache_read`

Note: these figures grow while this session is active. The final settled total
will be available by running `npm run track:usage` after this session ends.

---

## What "total tokens" measures here

This total is the sum of **all token fields returned by the API** across all
requests. It is not the same as:

- **Unique text tokens** — the same prompt text reused from cache still shows as
  cache-read tokens, not zero.
- **API-billed tokens** — Anthropic's billing applies a discount to cache-read
  tokens. This total does not apply any pricing rate.
- **Subscription quota** — the interactive `/usage` view shows quota consumption,
  which is not machine-readable and not accessible from transcripts.
- **Prompt-cache capacity** — the 15 M token limit stated in the session header
  is a context-window budget, not a usage total.

The dominant category is **cache-read tokens (~97% of the total)**. This is
normal for a long project where the same system prompt, CLAUDE.md content, and
tool schemas are re-read every turn from the prompt cache. The actual new text
generated (output tokens) is ~585 K, and the input tokens read fresh (not from
cache) are ~1 K.

---

## Session breakdown

All 15 sessions are on date 2026-10-24 (the project was built in one day).

| Session ID (short) | Status | Models used | Requests | Tokens | Notes |
|---|---|---|---|---:|---:|
| `fa729ae8` | ended | opus-5, sonnet-5-5, synthetic | 262 | 77,920,229 | Largest session — Phase C + D construction |
| `c5817597` | ended | opus-5, sonnet-5-5, haiku-5-5 | 66 | 8,196,703 | Phase C tooling |
| `b1677bf1` | **running** | opus-5, sonnet-5-5 | ~58+ | 4,742,967+ | Phase D recovery + this session |
| `e47f83a0` | ended | sonnet-4-6 | 52 | 3,634,226 | Phase C/D work |
| `a6067e33` | ended | sonnet-4-6 | 34 | 1,199,155 | — |
| `da805e33` | ended | sonnet-4-6 | 19 | 843,197 | Image skill (successful run) |
| `3ce993b4` | ended | sonnet-4-6 | 16 | 448,901 | — |
| `66cb4f8d` | ended | sonnet-4-6 | 13 | 349,479 | — |
| `7cc39af0` | ended | sonnet-4-6 | 13 | 466,161 | Image skill (attempt 1 — blocked) |
| `58bda065` | ended | sonnet-4-6 | 11 | 368,374 | Image skill (attempt 2 — blocked) |
| `21ea3623` | ended | sonnet-4-6 | 7 | 164,566 | — |
| `76c09373` | ended | sonnet-4-6 | 7 | 162,035 | — |
| `f5971897` | ended | sonnet-4-6 | 9 | 224,531 | — |
| `861d0671` | ended | sonnet-4-6 | 1 | 26,349 | Fresh-session handoff test |
| `cdcd3731` | ended | haiku-5-5 | 0 | 1,191* | Cost-state only (see below) |

*`cdcd3731` has no usage-bearing assistant lines. Its 1,191 tokens come from a
`cost-state` record (a different source). They are **not** included in the 103 M
total above. Including them: 103,404,020 tokens.

---

## How sessions are identified

The collector treats each distinct `sessionId` in the transcript files as one
session. This includes:

- Interactive (VS Code extension) sessions
- Child `claude -p` processes launched for demonstrations

The `fa729ae8` session contains 262 requests and 77.9 M tokens — this is the
primary build session where most of Phase C and D were implemented.

---

## Deduplication

The same API response is written as multiple JSONL lines (one per content block).
The collector drops every line that shares a `requestId` with a previously seen
line. This run: **799 duplicates dropped, 0 malformed lines.**

64 requests appeared in multiple transcript files (from forks or resumes); these
were also deduplicated.

---

## Collector version and known gap

Collector 1.0.0 did not read `<sessionId>/subagents/agent-*.jsonl`, so any ledger
it produced after a subagent ran was under-counted. This was fixed in 1.1.0.

Current collector: `scripts/track-usage.ts`, COLLECTOR_VERSION `1.1.0`.

Subagent work in this project:

| Agent type | Agents spawned | Requests | Total tokens |
|---|---:|---:|---:|
| `design-system-auditor` | 8 | 84–90+ | ~2.5 M |

All subagent usage is attributed to its parent session and included in the totals.

---

## Incomplete / not covered

| Gap | Reason |
|---|---|
| This session's final usage | Session `b1677bf1` is still running; its usage will be higher when it ends |
| Subscription `/usage` view | Not machine-readable; shows quota consumption differently from API billing |
| Any session whose transcript was pruned | No such session detected; 0 malformed lines in the latest run |
| Cost in USD | The collector sums tokens, not USD. Pricing is not applied |

---

## What to report to the assignment

The honest assignment-deliverable figure is approximately **103 M tokens** across
**15 sessions** (of which the final session will add somewhat more when complete).

This number is dominated by **cache-read tokens (~97%)** which are reuse of the
same prompt context. The actual text generated by the models is:

- **Output tokens: ~585 K** (including ~123 K thinking tokens)
- **New input (not from cache): ~1 K**
- **Cache creation (first write of new context): ~2 M**

If the assignment asks for "tokens used to build the project", the most meaningful
single number is the total (103 M) with the breakdown provided. If it asks for
"output generated", that is ~585 K. Both are real figures from the API.

---

## Reproduction

```bash
# Refresh the ledger (safe to run multiple times — idempotent):
npm run track:usage

# Output files:
#   tracking/usage-ledger.json   (machine-readable)
#   tracking/usage-ledger.csv    (spreadsheet-friendly)
#   tracking/usage-summary.md    (human-readable)
```

The tracker is idempotent: running it again over the same transcripts produces
the same totals. Running it after a session ends will add that session's final
usage.
