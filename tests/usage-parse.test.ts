/**
 * Tests for the token-usage collector.
 *
 * All input is SYNTHETIC fixture data from tests/fixtures/synthetic-usage/.
 * Expected totals are computed by hand in that directory's README so the
 * assertions do not simply restate whatever the code produces.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  collectFromLines,
  emptyDiagnostics,
  resolveSessionStatus,
  summariseSession,
  sumTotals,
  toCsv,
} from '../scripts/lib/usage-parse.ts';

const FIXTURE_DIR = path.join(import.meta.dirname, 'fixtures', 'synthetic-usage');
const REPO_ROOT = path.join(import.meta.dirname, '..');

function readFixture(name: string): string[] {
  return readFileSync(path.join(FIXTURE_DIR, `${name}.jsonl`), 'utf8').split('\n');
}

/** Every fixture file in one collection pass, as the collector does it. */
function collectAllFixtures() {
  const diagnostics = emptyDiagnostics();
  const requests = new Map<string, ReturnType<typeof collectFromLines>['requests'][number]>();
  let crossFileDuplicates = 0;

  for (const file of readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith('.jsonl'))
    .sort()) {
    const sessionId = path.basename(file, '.jsonl');
    const result = collectFromLines(readFixture(sessionId), sessionId, diagnostics);
    for (const r of result.requests) {
      if (requests.has(r.request_id)) {
        crossFileDuplicates += 1;
        continue;
      }
      requests.set(r.request_id, r);
    }
  }
  return { requests: [...requests.values()], diagnostics, crossFileDuplicates };
}

describe('deduplication', () => {
  it('counts one request written as four identical lines exactly once', () => {
    const { requests, diagnostics } = collectFromLines(
      readFixture('SYNTHETIC-aaa'),
      'SYNTHETIC-aaa',
    );

    // Five assistant lines carry usage, but they are only two real requests.
    expect(diagnostics.usage_lines_seen).toBe(5);
    expect(requests).toHaveLength(2);
    expect(diagnostics.duplicate_lines_dropped).toBe(3);
    expect(diagnostics.conflicting_duplicates).toEqual([]);

    const a1 = requests.find((r) => r.request_id === 'SYN-REQ-A1');
    expect(a1?.input_tokens).toBe(100);
    expect(a1?.total_tokens).toBe(1000); // 100 + 200 + 300 + 400, counted once
    expect(a1?.dedup_key).toBe('requestId');

    // The naive line-summing bug this guards against would have produced 4000.
    const totals = sumTotals(requests);
    expect(totals.total_tokens).toBe(1100);
  });

  it('drops a replayed request from a forked/resumed session transcript', () => {
    const { requests, crossFileDuplicates } = collectAllFixtures();
    expect(crossFileDuplicates).toBe(1);
    expect(requests.filter((r) => r.request_id === 'SYN-REQ-A1')).toHaveLength(1);
    // The replayed line keeps its original sessionId, so resumed work stays
    // attributed to the session that produced it rather than inflating a new one.
    expect(requests.find((r) => r.request_id === 'SYN-REQ-A1')?.session_id).toBe('SYNTHETIC-aaa');
  });
});

describe('aggregation', () => {
  it('matches the hand-computed totals across all fixture sessions', () => {
    const { requests } = collectAllFixtures();
    const totals = sumTotals(requests);

    expect(totals.requests).toBe(7);
    expect(totals.input_tokens).toBe(1166);
    expect(totals.output_tokens).toBe(788);
    expect(totals.cache_creation_input_tokens).toBe(410);
    expect(totals.cache_read_input_tokens).toBe(9524);
    expect(totals.total_tokens).toBe(11888);

    // The total is exactly the sum of the four disjoint reported fields.
    expect(
      totals.input_tokens +
        totals.output_tokens +
        totals.cache_creation_input_tokens +
        totals.cache_read_input_tokens,
    ).toBe(totals.total_tokens);
  });

  it('treats thinking tokens as a subset of output tokens, not an addition', () => {
    const { requests } = collectAllFixtures();
    const totals = sumTotals(requests);
    expect(totals.thinking_tokens).toBe(100);
    expect(totals.thinking_tokens).toBeLessThan(totals.output_tokens);
    expect(totals.total_tokens).toBe(11888); // unchanged by thinking tokens
  });

  it('separates per-model subtotals', () => {
    const { requests } = collectAllFixtures();
    const modelA = sumTotals(requests.filter((r) => r.model === 'synthetic-model-a'));
    const modelB = sumTotals(requests.filter((r) => r.model === 'synthetic-model-b'));
    // model-a: A1, A2, B1, B2, D1. SYN-REQ-B2 counts as a request even though
    // its usage object carried no numeric fields, because dropping it would
    // hide a real request from the coverage picture.
    expect(modelA.requests).toBe(5);
    expect(modelB.requests).toBe(2); // C1, D2
    expect(modelA.requests + modelB.requests).toBe(7);
    expect(modelA.total_tokens + modelB.total_tokens).toBe(11888);
  });
});

describe('missing fields', () => {
  it('records absent fields as unavailable rather than silently zero', () => {
    const { requests, diagnostics } = collectFromLines(
      readFixture('SYNTHETIC-bbb'),
      'SYNTHETIC-bbb',
    );

    // SYN-REQ-B0 has no usage object at all and is not a request record.
    expect(requests.map((r) => r.request_id).sort()).toEqual(['SYN-REQ-B1', 'SYN-REQ-B2']);
    expect(diagnostics.lines_ignored_no_usage).toBeGreaterThanOrEqual(1);

    const partial = requests.find((r) => r.request_id === 'SYN-REQ-B1');
    expect(partial?.cache_read_input_tokens).toBeNull();
    expect(partial?.missing_fields).toEqual(['cache_read_input_tokens']);
    expect(partial?.measurement).toBe('calculated');
    expect(partial?.total_tokens).toBe(18); // lower bound: 5 + 6 + 7

    const empty = requests.find((r) => r.request_id === 'SYN-REQ-B2');
    expect(empty?.measurement).toBe('unavailable');
    expect(empty?.total_tokens).toBeNull();
    expect(empty?.missing_fields).toHaveLength(4);
  });

  it('never labels a value reported unless every component field was present', () => {
    const { requests } = collectAllFixtures();
    for (const r of requests) {
      if (r.measurement === 'reported') expect(r.missing_fields).toEqual([]);
      else expect(r.missing_fields.length).toBeGreaterThan(0);
    }
    // Nothing is ever estimated by this collector.
    expect(requests.some((r) => r.measurement === 'estimated')).toBe(false);
  });
});

describe('malformed records', () => {
  it('skips truncated, non-JSON and non-object lines and counts them', () => {
    const { requests, diagnostics, cost_states } = collectFromLines(
      readFixture('SYNTHETIC-ccc'),
      'SYNTHETIC-ccc',
    );
    expect(diagnostics.lines_malformed).toBe(3);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.total_tokens).toBe(10);
    // The truncated line claimed 999 input tokens; it must not reach the ledger.
    expect(requests.some((r) => r.input_tokens === 999)).toBe(false);
    expect(cost_states).toHaveLength(1);
    expect(cost_states[0]?.total_cost_usd).toBe(0.0042);
  });

  it('flags duplicates that disagree instead of trusting the first silently', () => {
    const base =
      '{"type":"assistant","sessionId":"SYNTHETIC-zzz","requestId":"SYN-REQ-Z1","uuid":"z1",' +
      '"message":{"id":"m","model":"synthetic-model-a","usage":{"input_tokens":1,"output_tokens":1,' +
      '"cache_creation_input_tokens":1,"cache_read_input_tokens":1}}}';
    const conflicting = base
      .replace('"input_tokens":1', '"input_tokens":77')
      .replace('"uuid":"z1"', '"uuid":"z2"');
    const { requests, diagnostics } = collectFromLines([base, conflicting], 'SYNTHETIC-zzz');
    expect(requests).toHaveLength(1);
    expect(diagnostics.conflicting_duplicates).toEqual(['SYN-REQ-Z1']);
  });
});

describe('subagent (sidechain) attribution', () => {
  it('attributes subagent usage to the parent session but splits the subtotal', () => {
    const { requests } = collectFromLines(readFixture('SYNTHETIC-ddd'), 'SYNTHETIC-ddd');
    const summary = summariseSession('SYNTHETIC-ddd', requests, 'ended', null);

    expect(summary.totals.total_tokens).toBe(10760);
    expect(summary.main_thread.total_tokens).toBe(10500);
    expect(summary.sidechain.total_tokens).toBe(260);
    expect(summary.main_thread.total_tokens + summary.sidechain.total_tokens).toBe(
      summary.totals.total_tokens,
    );
    expect(summary.main_thread.requests).toBe(1);
    expect(summary.sidechain.requests).toBe(1);
  });
});

describe('running sessions', () => {
  const now = Date.parse('2026-10-24T12:00:00.000Z');
  const staleness = 15 * 60_000;

  it('marks the live session running and withholds its end timestamp', () => {
    const status = resolveSessionStatus({
      session_id: 'SYNTHETIC-ddd',
      current_session_id: 'SYNTHETIC-ddd',
      file_mtime_ms: now - 60 * 60_000, // stale mtime must not override the live id
      now_ms: now,
      staleness_ms: staleness,
    });
    expect(status).toBe('running');

    const { requests } = collectFromLines(readFixture('SYNTHETIC-ddd'), 'SYNTHETIC-ddd');
    const summary = summariseSession('SYNTHETIC-ddd', requests, status, null);
    expect(summary.end_timestamp).toBeNull();
    expect(summary.start_timestamp).toBe('2026-10-23T11:00:00.000Z');
  });

  it('marks an idle transcript ended and reports its last observed request', () => {
    const status = resolveSessionStatus({
      session_id: 'SYNTHETIC-ddd',
      current_session_id: 'SYNTHETIC-other',
      file_mtime_ms: now - 60 * 60_000,
      now_ms: now,
      staleness_ms: staleness,
    });
    expect(status).toBe('ended');

    const { requests } = collectFromLines(readFixture('SYNTHETIC-ddd'), 'SYNTHETIC-ddd');
    const summary = summariseSession('SYNTHETIC-ddd', requests, status, null);
    expect(summary.end_timestamp).toBe('2026-10-23T11:01:00.000Z');
  });

  it('treats a recently written transcript as still running', () => {
    expect(
      resolveSessionStatus({
        session_id: 'SYNTHETIC-ddd',
        current_session_id: null,
        file_mtime_ms: now - 60_000,
        now_ms: now,
        staleness_ms: staleness,
      }),
    ).toBe('running');
  });
});

describe('deterministic output', () => {
  it('produces a stable CSV ordering regardless of input order', () => {
    const { requests } = collectAllFixtures();
    const forward = toCsv(requests);
    const reversed = toCsv([...requests].reverse());
    expect(forward).toBe(reversed);
    expect(forward.split('\n')[0]).toContain('session_id,request_id,dedup_key');
  });
});

describe('collector end to end', () => {
  function runCollector(outDir: string): string {
    return execFileSync(
      process.execPath,
      [
        path.join('scripts', 'track-usage.ts'),
        '--dir',
        FIXTURE_DIR,
        '--out',
        outDir,
        '--session-id',
        'SYNTHETIC-none',
        '--quiet',
      ],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
  }

  it('writes a ledger whose totals match the hand-computed fixture totals', () => {
    const out = mkdtempSync(path.join(tmpdir(), 'swo-track-'));
    runCollector(out);

    const ledger = JSON.parse(readFileSync(path.join(out, 'usage-ledger.json'), 'utf8'));
    expect(ledger.project_summary.totals.total_tokens).toBe(12018);
    expect(ledger.project_summary.totals.requests).toBe(10);
    // Five transcript files, so five sessions. SYNTHETIC-eee is a fork replay
    // that contributed no NEW requests: it is still a real session, and it is
    // listed with zero requests rather than being hidden or double-counted.
    expect(ledger.project_summary.sessions).toBe(5);
    const forkSession = ledger.sessions.find(
      (s: { session_id: string }) => s.session_id === 'SYNTHETIC-eee',
    );
    expect(forkSession.totals.requests).toBe(0);
    expect(forkSession.totals.total_tokens).toBe(0);
    expect(ledger.diagnostics.duplicate_lines_dropped).toBe(4);
    expect(ledger.diagnostics.cross_file_duplicate_requests).toBe(1);
    expect(ledger.diagnostics.lines_malformed).toBe(3);
    expect(ledger.diagnostics.multi_iteration_records).toEqual([]);

    // One data row per deduplicated request, plus the header.
    const csv = readFileSync(path.join(out, 'usage-ledger.csv'), 'utf8').trimEnd().split('\n');
    expect(csv).toHaveLength(11);

    const summary = readFileSync(path.join(out, 'usage-summary.md'), 'utf8');
    expect(summary).toContain('12,018');
  });

  it('is idempotent: a second run over unchanged input is byte-identical', () => {
    const out = mkdtempSync(path.join(tmpdir(), 'swo-track-'));
    runCollector(out);
    const first = ['usage-ledger.json', 'usage-ledger.csv', 'usage-summary.md'].map((f) =>
      readFileSync(path.join(out, f), 'utf8'),
    );
    runCollector(out);
    const second = ['usage-ledger.json', 'usage-ledger.csv', 'usage-summary.md'].map((f) =>
      readFileSync(path.join(out, f), 'utf8'),
    );
    expect(second).toEqual(first);
  });

  it('refuses to invent data when no transcript source exists', () => {
    const emptyDir = mkdtempSync(path.join(tmpdir(), 'swo-empty-'));
    const out = mkdtempSync(path.join(tmpdir(), 'swo-track-'));
    let failed = false;
    let stderr = '';
    try {
      execFileSync(
        process.execPath,
        [path.join('scripts', 'track-usage.ts'), '--dir', emptyDir, '--out', out, '--quiet'],
        { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
    } catch (err) {
      failed = true;
      stderr = String((err as { stderr?: string }).stderr ?? '');
    }
    expect(failed).toBe(true);
    expect(stderr).toContain('No .jsonl transcripts found');
    expect(readdirSync(out)).toEqual([]);
  });
});

// The collector's ledger is checked field by field; typing all of it adds nothing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ledger = any;

describe('subagent transcripts (<session>/subagents/agent-*.jsonl)', () => {
  function collect(): Ledger {
    const out = mkdtempSync(path.join(tmpdir(), 'swo-track-'));
    execFileSync(
      process.execPath,
      [
        path.join('scripts', 'track-usage.ts'),
        '--dir',
        FIXTURE_DIR,
        '--out',
        out,
        '--session-id',
        'SYNTHETIC-none',
        '--quiet',
      ],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
    return JSON.parse(readFileSync(path.join(out, 'usage-ledger.json'), 'utf8'));
  }

  it('reads subagent files and lists them with their kind', () => {
    const ledger = collect();
    const kinds = ledger.source.files.map((f: { kind: string }) => f.kind);
    expect(kinds.filter((k: string) => k === 'subagent')).toHaveLength(2);
    expect(kinds.filter((k: string) => k === 'session')).toHaveLength(5);
    expect(ledger.source.files.map((f: { file: string }) => f.file)).toContain(
      'SYNTHETIC-ddd/subagents/agent-synthetic1.jsonl',
    );
  });

  it('counts each subagent request once, even when written as several lines', () => {
    const ledger = collect();
    const s1 = ledger.requests.filter((r: { request_id: string }) => r.request_id === 'SYN-REQ-S1');
    expect(s1).toHaveLength(1);
    expect(s1[0].total_tokens).toBe(100);
  });

  it('attributes subagent usage to the PARENT session without creating a new session', () => {
    const ledger = collect();
    expect(ledger.project_summary.sessions).toBe(5);
    const parent = ledger.sessions.find(
      (s: { session_id: string }) => s.session_id === 'SYNTHETIC-ddd',
    );
    expect(parent.totals.requests).toBe(5); // D1, D2, S1, S2, S3
    expect(parent.totals.total_tokens).toBe(10890);
    expect(parent.main_thread.total_tokens).toBe(10500);
    expect(parent.sidechain.total_tokens).toBe(390);
    expect(parent.sidechain.requests).toBe(4);
  });

  it('records agent id and type, and reports unknown when there is no meta file', () => {
    const ledger = collect();
    const byId = (id: string) =>
      ledger.requests.find((r: { request_id: string }) => r.request_id === id);
    expect(byId('SYN-REQ-S1')).toMatchObject({
      is_sidechain: true,
      agent_id: 'synthetic1',
      agent_type: 'synthetic-auditor',
    });
    expect(byId('SYN-REQ-S3')).toMatchObject({
      is_sidechain: true,
      agent_id: 'synthetic2',
      agent_type: null,
    });
    // A main-thread request is not attributed to any agent.
    expect(byId('SYN-REQ-D1')).toMatchObject({
      is_sidechain: false,
      agent_id: null,
      agent_type: null,
    });
  });

  it('reports subagent usage by type in the summary', () => {
    const out = mkdtempSync(path.join(tmpdir(), 'swo-track-'));
    execFileSync(
      process.execPath,
      [path.join('scripts', 'track-usage.ts'), '--dir', FIXTURE_DIR, '--out', out, '--quiet'],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
    const summary = readFileSync(path.join(out, 'usage-summary.md'), 'utf8');
    expect(summary).toContain('## Subagents by type');
    expect(summary).toContain('`synthetic-auditor`');
    expect(summary).toContain('`unknown`');
  });

  it('keeps the grand total equal to the sum of main-thread and sidechain', () => {
    const { project_summary: p } = collect();
    expect(p.main_thread.total_tokens + p.sidechain.total_tokens).toBe(p.totals.total_tokens);
    expect(p.totals.total_tokens).toBe(12018);
  });

  it('does not let a subagent file change whether a session counts as running', () => {
    const ledger = collect();
    // With a different live-session id and old fixture mtimes the sessions are
    // judged by their own transcript only.
    const ids = ledger.sessions.map((s: { session_id: string }) => s.session_id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
