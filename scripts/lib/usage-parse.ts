/**
 * Pure parsing/aggregation functions for Claude Code token-usage collection.
 *
 * Source of truth: the JSONL session transcripts Claude Code writes under
 * ~/.claude/projects/<project-slug>/<sessionId>.jsonl
 *
 * These functions are deliberately free of filesystem and clock access so the
 * aggregation rules can be tested against synthetic fixtures. All I/O lives in
 * scripts/track-usage.ts.
 *
 * Verified record shape (see docs/token-tracking.md for the evidence):
 *   { type: "assistant", sessionId, requestId, uuid, timestamp, requestedModel,
 *     isSidechain, message: { id, model, usage: { input_tokens, output_tokens,
 *     cache_read_input_tokens, cache_creation_input_tokens,
 *     output_tokens_details: { thinking_tokens }, iterations: [...] } } }
 *
 * CRITICAL: one API response is written as SEVERAL assistant lines (one per
 * content block), each repeating the SAME usage object. Summing lines
 * triple-counts. Deduplication by requestId is mandatory, not an optimisation.
 */

/** How a numeric value in the ledger was obtained. */
export type Measurement =
  /** Every component token field was present verbatim in the transcript. */
  | 'reported'
  /** Some component fields were absent; totals are a lower bound. */
  | 'calculated'
  /** Reserved. This tracker never estimates token counts and never emits this. */
  | 'estimated'
  /** No usage object, or no numeric token fields at all. */
  | 'unavailable';

export const TOKEN_FIELDS = [
  'input_tokens',
  'output_tokens',
  'cache_creation_input_tokens',
  'cache_read_input_tokens',
] as const;

export type TokenField = (typeof TOKEN_FIELDS)[number];

export interface RequestUsage {
  session_id: string;
  request_id: string;
  /** Which field supplied request_id, since dedup correctness depends on it. */
  dedup_key: 'requestId' | 'message.id' | 'uuid';
  timestamp: string | null;
  model: string | null;
  requested_model: string | null;
  is_sidechain: boolean;
  input_tokens: number | null;
  output_tokens: number | null;
  /** Subset of output_tokens. Never added into total_tokens. */
  thinking_tokens: number | null;
  cache_creation_input_tokens: number | null;
  cache_read_input_tokens: number | null;
  /**
   * input + output + cache_creation + cache_read.
   * The four source fields are disjoint as reported by the API (input_tokens
   * excludes cached input), so each token is counted exactly once.
   */
  total_tokens: number | null;
  /** Component fields absent from the transcript record. */
  missing_fields: TokenField[];
  source: 'claude-code-transcript';
  measurement: Measurement;
}

export interface CostStateCrossCheck {
  session_id: string;
  total_cost_usd: number | null;
  model_usage: Record<string, unknown>;
}

export interface Diagnostics {
  lines_read: number;
  lines_malformed: number;
  lines_ignored_no_usage: number;
  usage_lines_seen: number;
  duplicate_lines_dropped: number;
  /** Same dedup key, differing token values. Kept first, reported here. */
  conflicting_duplicates: string[];
  /** Records whose usage.iterations had length > 1 (assumption breach). */
  multi_iteration_records: string[];
  fork_context_refs: number;
}

export function emptyDiagnostics(): Diagnostics {
  return {
    lines_read: 0,
    lines_malformed: 0,
    lines_ignored_no_usage: 0,
    usage_lines_seen: 0,
    duplicate_lines_dropped: 0,
    conflicting_duplicates: [],
    multi_iteration_records: [],
    fork_context_refs: 0,
  };
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Extract one request's usage from a single parsed transcript line.
 * Returns null when the line is not an assistant line carrying usage.
 */
export function extractUsage(
  line: Record<string, unknown>,
  fallbackSessionId: string,
  diagnostics: Diagnostics,
): RequestUsage | null {
  if (line['type'] !== 'assistant') return null;

  const message = asRecord(line['message']);
  const usage = message ? asRecord(message['usage']) : null;
  if (!usage) return null;

  diagnostics.usage_lines_seen += 1;

  // Dedup key, most to least specific. requestId is per API request;
  // message.id is per API response; uuid is per transcript line (last resort,
  // and the only one that cannot deduplicate, so it is flagged in the ledger).
  let dedupKey: RequestUsage['dedup_key'] = 'requestId';
  let requestId = typeof line['requestId'] === 'string' ? line['requestId'] : '';
  if (!requestId && message && typeof message['id'] === 'string') {
    requestId = message['id'];
    dedupKey = 'message.id';
  }
  if (!requestId && typeof line['uuid'] === 'string') {
    requestId = line['uuid'];
    dedupKey = 'uuid';
  }
  if (!requestId) return null;

  const iterations = usage['iterations'];
  if (Array.isArray(iterations) && iterations.length > 1) {
    // Top-level usage is read as authoritative. If this ever fires, the
    // relationship between iterations and top-level usage must be re-verified
    // before the totals can be trusted.
    diagnostics.multi_iteration_records.push(requestId);
  }

  const values: Record<TokenField, number | null> = {
    input_tokens: numberOrNull(usage['input_tokens']),
    output_tokens: numberOrNull(usage['output_tokens']),
    cache_creation_input_tokens: numberOrNull(usage['cache_creation_input_tokens']),
    cache_read_input_tokens: numberOrNull(usage['cache_read_input_tokens']),
  };

  const missing = TOKEN_FIELDS.filter((f) => values[f] === null);
  const present = TOKEN_FIELDS.filter((f) => values[f] !== null);

  let measurement: Measurement;
  let total: number | null;
  if (missing.length === 0) {
    measurement = 'reported';
    total = present.reduce((sum, f) => sum + (values[f] as number), 0);
  } else if (present.length === 0) {
    measurement = 'unavailable';
    total = null;
  } else {
    // Lower bound: summed from the fields that were actually reported.
    measurement = 'calculated';
    total = present.reduce((sum, f) => sum + (values[f] as number), 0);
  }

  const details = asRecord(usage['output_tokens_details']);

  return {
    session_id: typeof line['sessionId'] === 'string' ? line['sessionId'] : fallbackSessionId,
    request_id: requestId,
    dedup_key: dedupKey,
    timestamp: typeof line['timestamp'] === 'string' ? line['timestamp'] : null,
    model: message && typeof message['model'] === 'string' ? message['model'] : null,
    requested_model: typeof line['requestedModel'] === 'string' ? line['requestedModel'] : null,
    is_sidechain: line['isSidechain'] === true,
    input_tokens: values.input_tokens,
    output_tokens: values.output_tokens,
    thinking_tokens: details ? numberOrNull(details['thinking_tokens']) : null,
    cache_creation_input_tokens: values.cache_creation_input_tokens,
    cache_read_input_tokens: values.cache_read_input_tokens,
    total_tokens: total,
    missing_fields: missing,
    source: 'claude-code-transcript',
    measurement,
  };
}

export interface CollectResult {
  requests: RequestUsage[];
  cost_states: CostStateCrossCheck[];
  diagnostics: Diagnostics;
}

function sameTokens(a: RequestUsage, b: RequestUsage): boolean {
  return TOKEN_FIELDS.every((f) => a[f] === b[f]);
}

/**
 * Parse raw JSONL lines into deduplicated request records.
 * Malformed lines are skipped and counted, never allowed to abort collection.
 */
export function collectFromLines(
  lines: readonly string[],
  fallbackSessionId: string,
  diagnostics: Diagnostics = emptyDiagnostics(),
): CollectResult {
  const byKey = new Map<string, RequestUsage>();
  const costStates: CostStateCrossCheck[] = [];

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (trimmed === '') continue;
    diagnostics.lines_read += 1;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      diagnostics.lines_malformed += 1;
      continue;
    }

    const line = asRecord(parsed);
    if (!line) {
      diagnostics.lines_malformed += 1;
      continue;
    }

    if (line['type'] === 'cost-state') {
      costStates.push({
        session_id: typeof line['sessionId'] === 'string' ? line['sessionId'] : fallbackSessionId,
        total_cost_usd: numberOrNull(line['totalCostUSD']),
        model_usage: asRecord(line['modelUsage']) ?? {},
      });
      continue;
    }

    if (line['type'] === 'fork-context-ref') {
      diagnostics.fork_context_refs += 1;
      continue;
    }

    const usage = extractUsage(line, fallbackSessionId, diagnostics);
    if (!usage) {
      diagnostics.lines_ignored_no_usage += 1;
      continue;
    }

    const existing = byKey.get(usage.request_id);
    if (existing) {
      diagnostics.duplicate_lines_dropped += 1;
      if (!sameTokens(existing, usage)) {
        diagnostics.conflicting_duplicates.push(usage.request_id);
      }
      continue;
    }
    byKey.set(usage.request_id, usage);
  }

  return { requests: [...byKey.values()], cost_states: costStates, diagnostics };
}

export interface TokenTotals {
  requests: number;
  input_tokens: number;
  output_tokens: number;
  thinking_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  total_tokens: number;
  /** Requests where at least one component field was absent. */
  requests_with_missing_fields: number;
}

export function zeroTotals(): TokenTotals {
  return {
    requests: 0,
    input_tokens: 0,
    output_tokens: 0,
    thinking_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    total_tokens: 0,
    requests_with_missing_fields: 0,
  };
}

export function sumTotals(requests: readonly RequestUsage[]): TokenTotals {
  const totals = zeroTotals();
  for (const r of requests) {
    totals.requests += 1;
    totals.input_tokens += r.input_tokens ?? 0;
    totals.output_tokens += r.output_tokens ?? 0;
    totals.thinking_tokens += r.thinking_tokens ?? 0;
    totals.cache_creation_input_tokens += r.cache_creation_input_tokens ?? 0;
    totals.cache_read_input_tokens += r.cache_read_input_tokens ?? 0;
    totals.total_tokens += r.total_tokens ?? 0;
    if (r.missing_fields.length > 0) totals.requests_with_missing_fields += 1;
  }
  return totals;
}

export type SessionStatus = 'running' | 'ended';

export interface StatusInput {
  session_id: string;
  /** Value of CLAUDE_CODE_SESSION_ID, when the collector runs inside a session. */
  current_session_id: string | null;
  /** Transcript file mtime in ms, or null when unknown. */
  file_mtime_ms: number | null;
  now_ms: number;
  /** A session untouched for longer than this is treated as ended. */
  staleness_ms: number;
}

/**
 * A transcript has no explicit "session closed" record, so status is inferred:
 * the live session is known from the environment, and any other transcript not
 * written to recently is treated as ended. Documented as inferred, not reported.
 */
export function resolveSessionStatus(input: StatusInput): SessionStatus {
  if (input.current_session_id && input.session_id === input.current_session_id) {
    return 'running';
  }
  if (input.file_mtime_ms === null) return 'ended';
  return input.now_ms - input.file_mtime_ms <= input.staleness_ms ? 'running' : 'ended';
}

export interface SessionSummary {
  session_id: string;
  status: SessionStatus;
  start_timestamp: string | null;
  /** Last observed request, not a true session-close event. Null while running. */
  end_timestamp: string | null;
  models: string[];
  totals: TokenTotals;
  main_thread: TokenTotals;
  sidechain: TokenTotals;
  cost_state_cross_check: CostStateCrossCheck | null;
}

export function summariseSession(
  sessionId: string,
  requests: readonly RequestUsage[],
  status: SessionStatus,
  costState: CostStateCrossCheck | null,
): SessionSummary {
  const stamps = requests
    .map((r) => r.timestamp)
    .filter((t): t is string => typeof t === 'string')
    .sort();
  const last = stamps.length > 0 ? (stamps[stamps.length - 1] as string) : null;

  return {
    session_id: sessionId,
    status,
    start_timestamp: stamps[0] ?? null,
    end_timestamp: status === 'running' ? null : last,
    models: [...new Set(requests.map((r) => r.model).filter((m): m is string => !!m))].sort(),
    totals: sumTotals(requests),
    main_thread: sumTotals(requests.filter((r) => !r.is_sidechain)),
    sidechain: sumTotals(requests.filter((r) => r.is_sidechain)),
    cost_state_cross_check: costState,
  };
}

export interface ProjectSummary {
  sessions: number;
  sessions_running: number;
  totals: TokenTotals;
  main_thread: TokenTotals;
  sidechain: TokenTotals;
  by_model: Record<string, TokenTotals>;
}

export function summariseProject(
  requests: readonly RequestUsage[],
  sessions: readonly SessionSummary[],
): ProjectSummary {
  const byModel: Record<string, TokenTotals> = {};
  for (const model of [...new Set(requests.map((r) => r.model ?? 'unknown'))].sort()) {
    byModel[model] = sumTotals(requests.filter((r) => (r.model ?? 'unknown') === model));
  }
  return {
    sessions: sessions.length,
    sessions_running: sessions.filter((s) => s.status === 'running').length,
    totals: sumTotals(requests),
    main_thread: sumTotals(requests.filter((r) => !r.is_sidechain)),
    sidechain: sumTotals(requests.filter((r) => r.is_sidechain)),
    by_model: byModel,
  };
}

const CSV_COLUMNS = [
  'session_id',
  'request_id',
  'dedup_key',
  'timestamp',
  'model',
  'requested_model',
  'is_sidechain',
  'input_tokens',
  'output_tokens',
  'thinking_tokens',
  'cache_creation_input_tokens',
  'cache_read_input_tokens',
  'total_tokens',
  'missing_fields',
  'source',
  'measurement',
] as const;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = Array.isArray(value) ? value.join(';') : String(value);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** Stable ordering, required for byte-identical output across runs. */
export function sortRequests(requests: readonly RequestUsage[]): RequestUsage[] {
  return [...requests].sort((a, b) => {
    const ta = a.timestamp ?? '';
    const tb = b.timestamp ?? '';
    if (ta !== tb) return ta < tb ? -1 : 1;
    return a.request_id < b.request_id ? -1 : a.request_id > b.request_id ? 1 : 0;
  });
}

/** Deterministic CSV: rows sorted by timestamp then request_id, so reruns match. */
export function toCsv(requests: readonly RequestUsage[]): string {
  const rows = sortRequests(requests).map((r) =>
    CSV_COLUMNS.map((c) => csvCell(r[c as keyof RequestUsage])).join(','),
  );
  return [CSV_COLUMNS.join(','), ...rows].join('\n') + '\n';
}
