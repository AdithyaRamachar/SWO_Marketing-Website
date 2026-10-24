/**
 * Token + session usage collector for this project.
 *
 *   npm run track:usage
 *
 * Reads Claude Code's local JSONL session transcripts for THIS project only,
 * deduplicates them by requestId, and writes a machine-readable ledger plus a
 * human-readable summary into tracking/.
 *
 * SAFETY: this script only ever READS from ~/.claude. It never writes, moves,
 * renames or deletes anything there. It writes solely inside tracking/.
 *
 * PRIVACY: no prompt text, message content, file content, code or credentials
 * are read into the output. Only ids, timestamps, model names and token counts.
 *
 * Flags:
 *   --dir <path>                read transcripts from an explicit directory
 *   --slug <name>               override the derived project-slug folder name
 *   --out <path>                output directory (default: tracking)
 *   --staleness-minutes <n>     session treated as ended after this idle gap (15)
 *   --session-id <id>           override the live-session id
 *   --quiet                     suppress the stdout summary
 */

import { readdir, readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import {
  collectFromLines,
  emptyDiagnostics,
  resolveSessionStatus,
  sortRequests,
  summariseProject,
  summariseSession,
  toCsv,
  type CostStateCrossCheck,
  type Diagnostics,
  type ProjectSummary,
  type RequestUsage,
  type SessionSummary,
} from './lib/usage-parse.ts';

const COLLECTOR_VERSION = '1.0.0';

/**
 * Shape of one model's entry inside a cost-state record. Field names differ
 * from the API usage object (camelCase, and "Tokens" rather than "_tokens"),
 * which is one reason the two sources are kept strictly apart.
 */
interface CostStateModelUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
  total_tokens: number;
}

function zeroCostStateUsage(): CostStateModelUsage {
  return {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
    total_tokens: 0,
  };
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Translate a cost-state modelUsage entry into the ledger's field names. */
function readCostStateModelUsage(entry: unknown): CostStateModelUsage {
  const e = (typeof entry === 'object' && entry !== null ? entry : {}) as Record<string, unknown>;
  const usage: CostStateModelUsage = {
    input_tokens: num(e['inputTokens']),
    output_tokens: num(e['outputTokens']),
    cache_read_input_tokens: num(e['cacheReadInputTokens']),
    cache_creation_input_tokens: num(e['cacheCreationInputTokens']),
    total_tokens: 0,
  };
  usage.total_tokens =
    usage.input_tokens +
    usage.output_tokens +
    usage.cache_read_input_tokens +
    usage.cache_creation_input_tokens;
  return usage;
}

function addCostStateUsage(into: CostStateModelUsage, from: CostStateModelUsage): void {
  into.input_tokens += from.input_tokens;
  into.output_tokens += from.output_tokens;
  into.cache_read_input_tokens += from.cache_read_input_tokens;
  into.cache_creation_input_tokens += from.cache_creation_input_tokens;
  into.total_tokens += from.total_tokens;
}

interface Options {
  dir: string | null;
  slug: string | null;
  out: string;
  stalenessMinutes: number;
  sessionId: string | null;
  quiet: boolean;
}

function parseArgs(argv: readonly string[]): Options {
  const opts: Options = {
    dir: null,
    slug: null,
    out: 'tracking',
    stalenessMinutes: 15,
    sessionId: null,
    quiet: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = (): string => {
      const v = argv[i + 1];
      if (v === undefined) throw new Error(`Missing value for ${arg}`);
      i += 1;
      return v;
    };
    switch (arg) {
      case '--dir':
        opts.dir = next();
        break;
      case '--slug':
        opts.slug = next();
        break;
      case '--out':
        opts.out = next();
        break;
      case '--staleness-minutes':
        opts.stalenessMinutes = Number(next());
        break;
      case '--session-id':
        opts.sessionId = next();
        break;
      case '--quiet':
        opts.quiet = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

/**
 * Claude Code names each project folder after its absolute path, lowercasing
 * the drive letter and replacing path separators, colons and underscores with
 * a single dash each. Verified against the observed folder name for this repo:
 *   E:\Projects\Airtribe_PM\SWO_Project -> e--Projects-Airtribe-PM-SWO-Project
 */
export function deriveProjectSlug(cwd: string): string {
  const normalised = cwd.replace(/^([A-Za-z]):/, (_m, d: string) => `${d.toLowerCase()}:`);
  return normalised.replace(/[\\/:_]/g, '-');
}

async function resolveTranscriptDir(opts: Options): Promise<string> {
  if (opts.dir) return path.resolve(opts.dir);

  const projectsRoot = path.join(homedir(), '.claude', 'projects');
  const slug = opts.slug ?? deriveProjectSlug(process.cwd());
  const candidate = path.join(projectsRoot, slug);

  try {
    const info = await stat(candidate);
    if (info.isDirectory()) return candidate;
  } catch {
    // fall through to the diagnostic below
  }

  let available: string[] = [];
  try {
    available = (await readdir(projectsRoot, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    throw new Error(
      `No Claude Code projects directory at ${projectsRoot}. ` +
        `Token tracking cannot run: there is no local transcript source.`,
    );
  }

  throw new Error(
    `No transcript folder for this project.\n` +
      `  expected: ${candidate}\n` +
      `  available: ${available.join(', ') || '(none)'}\n` +
      `Re-run with --slug <folder> or --dir <path> if the derived name is wrong. ` +
      `Nothing was estimated and no ledger was written.`,
  );
}

interface FileRead {
  file: string;
  session_id_from_filename: string;
  mtime_ms: number | null;
  lines: string[];
}

async function readTranscripts(dir: string): Promise<FileRead[]> {
  const entries = (await readdir(dir, { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.endsWith('.jsonl'))
    .map((e) => e.name)
    .sort();

  const files: FileRead[] = [];
  for (const name of entries) {
    const full = path.join(dir, name);
    let mtime: number | null = null;
    try {
      mtime = (await stat(full)).mtimeMs;
    } catch {
      mtime = null;
    }
    let text = '';
    try {
      text = await readFile(full, 'utf8');
    } catch (err) {
      // An unreadable transcript is a coverage gap, not a reason to abort.
      process.stderr.write(`warning: could not read ${name}: ${String(err)}\n`);
      continue;
    }
    files.push({
      file: name,
      session_id_from_filename: path.basename(name, '.jsonl'),
      mtime_ms: mtime,
      lines: text.split('\n'),
    });
  }
  return files;
}

interface Ledger {
  schema_version: 1;
  collector_version: string;
  project: string;
  source: {
    kind: 'claude-code-transcript';
    directory: string;
    files: Array<{ file: string; lines: number }>;
  };
  accounting: {
    total_tokens_formula: string;
    dedup_key: string;
    notes: string[];
  };
  project_summary: ProjectSummary;
  /**
   * Usage visible ONLY in cost-state records, for sessions with no
   * usage-bearing assistant lines. Reported separately and NEVER folded into
   * project_summary, because mixing two sources would make the headline
   * figure unverifiable.
   */
  cost_state_supplement: {
    sessions: Array<{
      session_id: string;
      total_cost_usd: number | null;
      by_model: Record<string, CostStateModelUsage>;
    }>;
    totals: CostStateModelUsage;
    note: string;
  };
  sessions: SessionSummary[];
  requests: RequestUsage[];
  diagnostics: Diagnostics & { cross_file_duplicate_requests: number };
  coverage: {
    covered: string[];
    not_covered: string[];
  };
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const dir = await resolveTranscriptDir(opts);
  const files = await readTranscripts(dir);

  if (files.length === 0) {
    throw new Error(
      `No .jsonl transcripts found in ${dir}. No ledger written; nothing estimated.`,
    );
  }

  // Deduplicate GLOBALLY across files, not per file: a forked or resumed
  // session can replay earlier requests, and those must be counted once.
  const diagnostics = emptyDiagnostics();
  const byRequest = new Map<string, RequestUsage>();
  const costStateBySession = new Map<string, CostStateCrossCheck>();
  let crossFileDuplicates = 0;
  const fileStats: Array<{ file: string; lines: number }> = [];

  for (const file of files) {
    const before = diagnostics.lines_read;
    const result = collectFromLines(file.lines, file.session_id_from_filename, diagnostics);
    fileStats.push({ file: file.file, lines: diagnostics.lines_read - before });

    for (const request of result.requests) {
      if (byRequest.has(request.request_id)) {
        crossFileDuplicates += 1;
        continue;
      }
      byRequest.set(request.request_id, request);
    }
    // Later cost-state records supersede earlier ones for the same session.
    for (const cs of result.cost_states) costStateBySession.set(cs.session_id, cs);
  }

  const requests = sortRequests([...byRequest.values()]);

  const mtimeBySession = new Map<string, number | null>();
  for (const f of files) mtimeBySession.set(f.session_id_from_filename, f.mtime_ms);

  const currentSessionId =
    opts.sessionId ?? process.env['CLAUDE_CODE_SESSION_ID'] ?? null;
  const nowMs = Date.now();
  const stalenessMs = opts.stalenessMinutes * 60_000;

  // Sessions come from the union of transcript filenames and request records.
  // A session can exist with NO usage-bearing assistant lines (observed: a
  // session whose only token usage appears in a cost-state record). Deriving
  // sessions from requests alone would silently hide it.
  const sessionIds = [
    ...new Set([
      ...files.map((f) => f.session_id_from_filename),
      ...requests.map((r) => r.session_id),
    ]),
  ].sort();
  const sessions: SessionSummary[] = sessionIds.map((id) =>
    summariseSession(
      id,
      requests.filter((r) => r.session_id === id),
      resolveSessionStatus({
        session_id: id,
        current_session_id: currentSessionId,
        file_mtime_ms: mtimeBySession.get(id) ?? null,
        now_ms: nowMs,
        staleness_ms: stalenessMs,
      }),
      costStateBySession.get(id) ?? null,
    ),
  );

  const projectSummary = summariseProject(requests, sessions);

  // Sessions whose usage is ONLY recoverable from cost-state. Kept apart from
  // the headline totals: different source, different field names, and written
  // by Claude Code inconsistently.
  const supplementSessions: Ledger['cost_state_supplement']['sessions'] = [];
  const supplementTotals = zeroCostStateUsage();
  for (const session of sessions) {
    const cs = session.cost_state_cross_check;
    if (!cs || session.totals.requests > 0) continue;
    const byModel: Record<string, CostStateModelUsage> = {};
    for (const [model, entry] of Object.entries(cs.model_usage)) {
      const usage = readCostStateModelUsage(entry);
      byModel[model] = usage;
      addCostStateUsage(supplementTotals, usage);
    }
    supplementSessions.push({
      session_id: session.session_id,
      total_cost_usd: cs.total_cost_usd,
      by_model: byModel,
    });
  }

  const ledger: Ledger = {
    schema_version: 1,
    collector_version: COLLECTOR_VERSION,
    project: 'Smart Workout Optimizer (SWO) marketing website',
    source: { kind: 'claude-code-transcript', directory: dir, files: fileStats },
    accounting: {
      total_tokens_formula:
        'total_tokens = input_tokens + output_tokens + cache_creation_input_tokens + cache_read_input_tokens',
      dedup_key: 'requestId (fallback: message.id, then uuid)',
      notes: [
        'The four component fields are disjoint as reported by the API: input_tokens excludes cached input, so each token is counted exactly once.',
        'thinking_tokens is a SUBSET of output_tokens and is reported separately, never added into total_tokens.',
        'One API response is written as several assistant transcript lines sharing one requestId and one identical usage object; only the first is counted.',
        'Monetary cost is out of scope. Context-window size, subscription limits and token consumption are three different things.',
      ],
    },
    project_summary: projectSummary,
    cost_state_supplement: {
      sessions: supplementSessions,
      totals: supplementTotals,
      note:
        'Usage for sessions that have no usage-bearing assistant lines, recovered from Claude Code cost-state records. ' +
        'Reported separately and deliberately NOT added to project_summary: it comes from a different, inconsistently written source. ' +
        'Add it manually only when you state which source each figure came from.',
    },
    sessions,
    requests,
    diagnostics: { ...diagnostics, cross_file_duplicate_requests: crossFileDuplicates },
    coverage: {
      covered: [
        'Every API request recorded in this project\u2019s local Claude Code transcripts, including the session that built this tracker.',
      ],
      not_covered: [
        'Subscription-level consumption shown by the interactive /usage view (not machine-readable).',
        'Work done in other project directories (deliberately excluded; see docs/token-tracking.md).',
        'Any session whose transcript was pruned, rotated or never written. Record these in tracking/manual-sessions.md.',
        'Session end timestamps are the last observed request, not a session-close event; Claude Code writes no close record.',
      ],
    },
  };

  const outDir = path.resolve(opts.out);
  await mkdir(outDir, { recursive: true });

  // Outputs contain no wall-clock run time, so repeated runs over unchanged
  // input are byte-identical. That is what makes idempotency checkable.
  await writeFile(
    path.join(outDir, 'usage-ledger.json'),
    JSON.stringify(ledger, null, 2) + '\n',
    'utf8',
  );
  await writeFile(path.join(outDir, 'usage-ledger.csv'), toCsv(requests), 'utf8');
  await writeFile(path.join(outDir, 'usage-summary.md'), renderSummary(ledger), 'utf8');

  if (!opts.quiet) process.stdout.write(renderStdout(ledger, dir));
}

function n(value: number): string {
  return value.toLocaleString('en-US');
}

function renderSummary(ledger: Ledger): string {
  const p = ledger.project_summary;
  const lines: string[] = [];

  lines.push('# Claude Code Token & Session Usage — SWO Website');
  lines.push('');
  lines.push(
    '> Generated by `npm run track:usage` from local Claude Code session transcripts.',
  );
  lines.push(
    '> This file is regenerated from source on every run and contains no run timestamp,',
  );
  lines.push('> so two consecutive runs over unchanged input produce identical output.');
  lines.push('');
  lines.push('## Project totals');
  lines.push('');
  lines.push(`- **Claude Code sessions:** ${p.sessions} (${p.sessions_running} running)`);
  lines.push(`- **API requests (deduplicated):** ${n(p.totals.requests)}`);
  lines.push(`- **Input tokens:** ${n(p.totals.input_tokens)}`);
  lines.push(`- **Output tokens:** ${n(p.totals.output_tokens)}`);
  lines.push(
    `  - of which thinking tokens: ${n(p.totals.thinking_tokens)} (subset, not added to the total)`,
  );
  lines.push(`- **Cache-creation input tokens:** ${n(p.totals.cache_creation_input_tokens)}`);
  lines.push(`- **Cache-read input tokens:** ${n(p.totals.cache_read_input_tokens)}`);
  lines.push(`- **Total tokens:** ${n(p.totals.total_tokens)}`);
  lines.push('');
  lines.push(`Formula: \`${ledger.accounting.total_tokens_formula}\``);
  lines.push(`Deduplication key: \`${ledger.accounting.dedup_key}\``);
  lines.push('');
  lines.push('## Main thread vs subagents');
  lines.push('');
  lines.push('| Scope | Requests | Input | Output | Cache create | Cache read | Total |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|');
  for (const [label, t] of [
    ['Main thread', p.main_thread],
    ['Subagents (sidechain)', p.sidechain],
  ] as const) {
    lines.push(
      `| ${label} | ${n(t.requests)} | ${n(t.input_tokens)} | ${n(t.output_tokens)} | ` +
        `${n(t.cache_creation_input_tokens)} | ${n(t.cache_read_input_tokens)} | ${n(t.total_tokens)} |`,
    );
  }
  lines.push('');
  lines.push('## By model');
  lines.push('');
  lines.push('| Model | Requests | Input | Output | Cache create | Cache read | Total |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|');
  for (const [model, t] of Object.entries(p.by_model)) {
    lines.push(
      `| \`${model}\` | ${n(t.requests)} | ${n(t.input_tokens)} | ${n(t.output_tokens)} | ` +
        `${n(t.cache_creation_input_tokens)} | ${n(t.cache_read_input_tokens)} | ${n(t.total_tokens)} |`,
    );
  }
  lines.push('');
  lines.push('## Sessions');
  lines.push('');
  lines.push('| Session | Status | Start | Last request | Models | Requests | Total tokens |');
  lines.push('|---|---|---|---|---|---:|---:|');
  for (const s of ledger.sessions) {
    // With no requests there is no timestamp to show at all, which is different
    // from a running session that simply has no end yet.
    const lastRequest =
      s.totals.requests === 0 ? '—' : (s.end_timestamp ?? '(running)');
    lines.push(
      `| \`${s.session_id}\` | ${s.status} | ${s.start_timestamp ?? '—'} | ` +
        `${lastRequest} | ${s.models.map((m) => `\`${m}\``).join(', ') || '—'} | ` +
        `${n(s.totals.requests)} | ${n(s.totals.total_tokens)} |`,
    );
  }
  lines.push('');
  lines.push('## Collection diagnostics');
  lines.push('');
  const d = ledger.diagnostics;
  lines.push(`- Transcript lines read: ${n(d.lines_read)}`);
  lines.push(`- Lines carrying a usage object: ${n(d.usage_lines_seen)}`);
  lines.push(
    `- **Duplicate lines dropped: ${n(d.duplicate_lines_dropped)}** — same request written once per content block; counting lines instead of requests would have inflated every total.`,
  );
  lines.push(`- Duplicate requests across files (forks/resumes): ${n(d.cross_file_duplicate_requests)}`);
  lines.push(`- Malformed lines skipped: ${n(d.lines_malformed)}`);
  lines.push(`- Lines without usage (user turns, tool records, metadata): ${n(d.lines_ignored_no_usage)}`);
  lines.push(`- Fork context references: ${n(d.fork_context_refs)}`);
  lines.push(
    `- Conflicting duplicates: ${d.conflicting_duplicates.length === 0 ? 'none' : d.conflicting_duplicates.join(', ')}`,
  );
  lines.push(
    `- Multi-iteration records: ${d.multi_iteration_records.length === 0 ? 'none (top-level usage is authoritative)' : d.multi_iteration_records.join(', ')}`,
  );
  lines.push(`- Requests with a missing component field: ${n(p.totals.requests_with_missing_fields)}`);
  lines.push('');
  lines.push('## Cost-state cross-check');
  lines.push('');
  const withCost = ledger.sessions.filter((s) => s.cost_state_cross_check !== null);
  if (withCost.length === 0) {
    lines.push(
      'No `cost-state` records present in these transcripts. Claude Code writes them inconsistently, so they are an optional cross-check only — never the measurement source.',
    );
  } else {
    lines.push('Independent rollup Claude Code wrote itself. Partial by nature; for comparison only.');
    lines.push('');
    for (const s of withCost) {
      const cs = s.cost_state_cross_check;
      lines.push(
        `- \`${s.session_id}\`: reported cost USD ${cs?.total_cost_usd ?? 'n/a'}, models: ${Object.keys(cs?.model_usage ?? {}).join(', ') || 'none'}`,
      );
    }
  }
  lines.push('');
  lines.push('## Sessions with usage only in cost-state');
  lines.push('');
  const sup = ledger.cost_state_supplement;
  if (sup.sessions.length === 0) {
    lines.push('None. Every session with recorded usage had it in assistant records.');
  } else {
    lines.push(
      'These sessions have **no usage-bearing assistant lines**, so the collector cannot',
    );
    lines.push(
      'count their requests. Their usage survives only in a `cost-state` record and is',
    );
    lines.push('reported here. **It is not included in the project totals above.**');
    lines.push('');
    lines.push('| Session | Model | Input | Output | Cache read | Cache create | Total |');
    lines.push('|---|---|---:|---:|---:|---:|---:|');
    for (const s of sup.sessions) {
      for (const [model, u] of Object.entries(s.by_model)) {
        lines.push(
          `| \`${s.session_id}\` | \`${model}\` | ${n(u.input_tokens)} | ${n(u.output_tokens)} | ` +
            `${n(u.cache_read_input_tokens)} | ${n(u.cache_creation_input_tokens)} | ${n(u.total_tokens)} |`,
        );
      }
    }
    lines.push('');
    lines.push(
      `Supplementary total (separate source): **${n(sup.totals.total_tokens)} tokens**. ` +
        `Combined with the transcript-derived total that is ` +
        `${n(p.totals.total_tokens + sup.totals.total_tokens)}, but the two figures come from ` +
        `different sources and should always be quoted with their source stated.`,
    );
  }
  lines.push('');
  lines.push('## Coverage');
  lines.push('');
  lines.push('**Covered**');
  for (const c of ledger.coverage.covered) lines.push(`- ${c}`);
  lines.push('');
  lines.push('**Not covered**');
  for (const c of ledger.coverage.not_covered) lines.push(`- ${c}`);
  lines.push('');
  lines.push('See [token-tracking.md](../docs/token-tracking.md) for field definitions,');
  lines.push('limitations and the manual reconciliation procedure.');
  lines.push('');
  return lines.join('\n');
}

function renderStdout(ledger: Ledger, dir: string): string {
  const p = ledger.project_summary;
  const d = ledger.diagnostics;
  return [
    'Claude Code usage collection — SWO website',
    `  source dir      ${dir}`,
    `  files           ${ledger.source.files.length}`,
    `  lines read      ${n(d.lines_read)}`,
    `  usage lines     ${n(d.usage_lines_seen)}`,
    `  duplicates cut  ${n(d.duplicate_lines_dropped)} (same requestId, identical usage)`,
    `  malformed       ${n(d.lines_malformed)}`,
    '',
    `  sessions        ${p.sessions} (${p.sessions_running} running)`,
    `  requests        ${n(p.totals.requests)}`,
    `  input           ${n(p.totals.input_tokens)}`,
    `  output          ${n(p.totals.output_tokens)} (thinking ${n(p.totals.thinking_tokens)})`,
    `  cache create    ${n(p.totals.cache_creation_input_tokens)}`,
    `  cache read      ${n(p.totals.cache_read_input_tokens)}`,
    `  TOTAL           ${n(p.totals.total_tokens)}`,
    '',
    `  cost-state only ${n(ledger.cost_state_supplement.totals.total_tokens)} tokens in ` +
      `${ledger.cost_state_supplement.sessions.length} session(s), reported separately (different source)`,
    '',
    '  wrote tracking/usage-ledger.json, tracking/usage-ledger.csv, tracking/usage-summary.md',
    '',
  ].join('\n');
}

main().catch((err: unknown) => {
  process.stderr.write(`track:usage failed — ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
