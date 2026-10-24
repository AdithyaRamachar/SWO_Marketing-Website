# SYNTHETIC TEST DATA — NOT REAL USAGE

Every record in this directory is **fabricated test data**. None of it describes
real Claude Code activity, real token consumption or real cost. It exists only
to prove that `scripts/lib/usage-parse.ts` aggregates, deduplicates and degrades
correctly, and it must never be mixed into the real ledger in `tracking/`.

Markers that make synthetic data unmistakable:

- every session id begins with `SYNTHETIC-`
- every request id begins with `SYN-REQ-`
- every record carries `"_synthetic": true`
- models are named `synthetic-model-a` / `synthetic-model-b`, not real model ids

## Fixtures and what each one proves

| File | Proves |
|---|---|
| `SYNTHETIC-aaa.jsonl` | Deduplication: one request written as 4 identical lines is counted once |
| `SYNTHETIC-bbb.jsonl` | Missing fields recorded as `unavailable`/`calculated`, never silently `0` |
| `SYNTHETIC-ccc.jsonl` | Malformed, truncated and non-object lines skipped and counted |
| `SYNTHETIC-ddd.jsonl` | Subagent (sidechain) split, thinking-token subset, cost-state cross-check |

## Hand-computed expected totals (all four fixtures combined)

Derived by hand from the fixture files, so the test asserts against arithmetic
that was not produced by the code under test.

| Quantity | Expected |
|---|---|
| Deduplicated requests | 7 |
| `input_tokens` | 1,166 |
| `output_tokens` | 788 |
| `thinking_tokens` (subset of output) | 100 |
| `cache_creation_input_tokens` | 410 |
| `cache_read_input_tokens` | 9,524 |
| **`total_tokens`** | **11,888** |
| Duplicate lines dropped | 3 |
| Malformed lines skipped | 3 |

Check: 1,166 + 788 + 410 + 9,524 = 11,888. Thinking tokens are excluded from the
total because they are already counted inside `output_tokens`.

## Subagent fixtures (real on-disk layout)

Added after the first real subagent run showed Claude Code writes subagent work to
`<sessionId>/subagents/agent-<id>.jsonl`, **not** into the session's own file.

| File | Contents |
|---|---|
| `SYNTHETIC-ddd/subagents/agent-synthetic1.jsonl` | `SYN-REQ-S1` written as 2 identical lines (in 10, out 20, cache-create 30, cache-read 40 = 100) and `SYN-REQ-S2` (1+2+3+4 = 10, model-b) |
| `SYNTHETIC-ddd/subagents/agent-synthetic1.meta.json` | agent type `synthetic-auditor` |
| `SYNTHETIC-ddd/subagents/agent-synthetic2.jsonl` | `SYN-REQ-S3` (5+5+5+5 = 20), deliberately **no** `.meta.json`, so its type is unknown |

Hand-computed expected totals for the **full collector run** (top-level sessions
plus these subagent files):

| Quantity | Expected |
|---|---|
| Deduplicated requests | 10 |
| `input_tokens` | 1,182 |
| `output_tokens` | 815 |
| `cache_creation_input_tokens` | 448 |
| `cache_read_input_tokens` | 9,573 |
| **`total_tokens`** | **12,018** (= 11,888 + 100 + 10 + 20) |
| Duplicate lines dropped | 4 |
| Sidechain requests | 4 (`SYN-REQ-D2`, `S1`, `S2`, `S3`) |
| Sidechain tokens | 390 (= 260 + 100 + 10 + 20) |
| Sessions | 5 (subagent files belong to `SYNTHETIC-ddd`, so they add none) |

The earlier top-level-only totals (7 requests, 11,888 tokens) still describe the
top-level files alone, which the pure-parser unit tests use.
