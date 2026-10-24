/**
 * Structural checks on the Claude Code tooling files: the subagent, the skill,
 * the audit-rule catalogue and the audit fixtures. These prove the files are
 * well formed and consistent with the project. They do NOT prove the agent or
 * skill behaves well; that is demonstrated by the recorded invocations in
 * docs/evidence/.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.join(import.meta.dirname, '..');
const read = (relative: string) => readFileSync(path.join(ROOT, relative), 'utf8');

function frontmatter(file: string): Record<string, string> {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(read(file).replace(/\r\n/g, '\n'));
  if (!match) throw new Error(`${file} has no frontmatter`);
  const fields: Record<string, string> = {};
  for (const line of (match[1] as string).split('\n')) {
    const separator = line.indexOf(':');
    if (separator > 0) fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return fields;
}

const packageScripts = JSON.parse(read('package.json')).scripts as Record<string, string>;

describe('design-system-auditor subagent definition', () => {
  const file = '.claude/agents/design-system-auditor.md';
  const meta = frontmatter(file);
  const body = read(file);

  it('has the name, a delegating description and a tool list', () => {
    expect(meta['name']).toBe('design-system-auditor');
    expect(meta['description']?.length).toBeGreaterThan(80);
    expect(meta['description']).toMatch(/use proactively/i);
    expect(meta['tools']).toBeTruthy();
  });

  it('is read-only: no write, edit or notebook tools', () => {
    const tools = (meta['tools'] as string).split(',').map((t) => t.trim());
    for (const forbidden of ['Write', 'Edit', 'NotebookEdit', 'MultiEdit']) {
      expect(tools).not.toContain(forbidden);
    }
    expect(tools).toEqual(expect.arrayContaining(['Read', 'Grep', 'Glob']));
  });

  it('tells the agent not to modify anything and not to overclaim checks', () => {
    expect(body).toMatch(/never modify files/i);
    expect(body).toMatch(/did \*\*not\*\* run tests/i);
    expect(body).toMatch(/uncertain/i);
  });

  it('points at documents that exist', () => {
    const referenced = [
      ...body.matchAll(/`((?:docs\/[\w.-]+\.md)|CLAUDE\.md|src\/styles\/tokens\.css)`/g),
    ].map((m) => m[1] as string);
    expect(referenced.length).toBeGreaterThanOrEqual(5);
    for (const doc of new Set(referenced)) expect(existsSync(path.join(ROOT, doc)), doc).toBe(true);
  });
});

describe('audit rule catalogue', () => {
  const rules = [
    ...read('docs/audit-rules.md').matchAll(
      /^\| ([A-Z0-9]+-[A-Z0-9]+(?:-\d+)?) \| (.+?) \| (.+?) \| (High|Medium|Low) \|$/gm,
    ),
  ].map((m) => ({
    id: m[1] as string,
    text: m[2] as string,
    source: m[3] as string,
    severity: m[4] as string,
  }));

  it('defines rules with unique ids', () => {
    expect(rules.length).toBeGreaterThanOrEqual(20);
    expect(new Set(rules.map((r) => r.id)).size).toBe(rules.length);
  });

  it('covers every audit area the brief requires', () => {
    const ids = rules.map((r) => r.id);
    for (const required of [
      'DS-COLOR-01',
      'DS-SPACE-01',
      'DS-TYPE-01',
      'DS-RADIUS-01',
      'DS-SHADOW-01',
      'DS-STATE-01',
      'DS-COMP-01',
      'A11Y-01',
      'A11Y-02',
      'A11Y-03',
      'RESP-01',
      'CONTENT-01',
      'CONTENT-02',
    ]) {
      expect(ids, required).toContain(required);
    }
  });

  it('cites a source document for every rule, and the sources exist', () => {
    for (const rule of rules) {
      const documents = [...rule.source.matchAll(/([\w-]+\.md)/g)].map((m) => m[1] as string);
      const named = documents.length > 0 || /tokens\.css/.test(rule.source);
      expect(named, `${rule.id} cites no document`).toBe(true);
      for (const document of documents) {
        const exists =
          existsSync(path.join(ROOT, 'docs', document)) || existsSync(path.join(ROOT, document));
        expect(exists, `${rule.id} cites missing ${document}`).toBe(true);
      }
    }
  });

  it('every rule id the agent file mentions exists in the catalogue', () => {
    const catalogue = new Set(rules.map((r) => r.id));
    const mentioned = [
      ...read('.claude/agents/design-system-auditor.md').matchAll(
        /\b((?:DS|A11Y|RESP|CONTENT)-[A-Z0-9]+(?:-\d+)?)\b/g,
      ),
    ].map((m) => m[1] as string);
    for (const id of mentioned) expect(catalogue.has(id), id).toBe(true);
  });
});

describe('audit fixtures', () => {
  const dir = 'docs/evidence/subagent-audit/fixture';

  for (const variant of ['before-annotated', 'before-blind']) {
    it(`${variant} contains exactly the three planted violations`, () => {
      const source = read(`${dir}/${variant}/RiskSummarySection.tsx`);
      // V1: hard-coded colour
      expect(source).toMatch(/#0B7A6B/i);
      // V2: colour-only indicator, so no StatusBadge and no label rendered
      expect(source).not.toContain('StatusBadge');
      expect(source).not.toContain('entry.label');
      // V3: raw JSON imported and rendered, no validation
      expect(source).toMatch(/import rawContent from .*site-content\.json/);
      expect(source).not.toContain('validateSiteContent');
    });
  }

  it('the blind fixture does not leak the ground truth', () => {
    const source = read(`${dir}/before-blind/RiskSummarySection.tsx`);
    expect(source).not.toMatch(
      /violation|planted|expected rule|deliberate|DS-COLOR|A11Y-|CONTENT-0/i,
    );
  });

  it('the blind fixture has the same code as the annotated one', () => {
    const code = (file: string) => read(file).slice(read(file).indexOf('import '));
    expect(code(`${dir}/before-blind/RiskSummarySection.tsx`)).toBe(
      code(`${dir}/before-annotated/RiskSummarySection.tsx`),
    );
  });

  it('the corrected fixture removes all three', () => {
    const source = read(`${dir}/after/RiskSummarySection.tsx`);
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b(?![\w-])/);
    expect(source).toContain('StatusBadge');
    expect(source).not.toMatch(/site-content\.json/);
    expect(source).toMatch(/import type \{ SiteContent \}/);
  });
});

describe('optimize-web-images skill definition', () => {
  const file = '.claude/skills/optimize-web-images/SKILL.md';
  const meta = frontmatter(file);
  const body = read(file);

  it('is named after its directory and describes when to use it', () => {
    expect(meta['name']).toBe('optimize-web-images');
    expect(meta['description']?.length).toBeGreaterThan(100);
    expect(meta['description']).toMatch(/use when/i);
  });

  it('only allows the project image scripts that exist, in both Bash and PowerShell', () => {
    const allowed = meta['allowed-tools'] as string;
    for (const script of ['images:optimize', 'images:verify']) {
      expect(packageScripts[script], `${script} missing from package.json`).toBeTruthy();
      expect(allowed).toContain(`Bash(npm run ${script} *)`);
      expect(allowed).toContain(`PowerShell(npm run ${script} *)`);
    }
    // The first invocation attempt failed because of a malformed pattern here.
    expect(allowed).not.toContain('images:*');
  });

  it('documents the safety rules the tooling enforces', () => {
    for (const phrase of [
      'never modified',
      'public/images/',
      'EXIF',
      'never overwritten',
      'upscale',
      'external-templates',
    ]) {
      expect(body.toLowerCase(), phrase).toContain(phrase.toLowerCase());
    }
  });

  it('every command example uses a real flag', () => {
    const optimizeSource = read('scripts/optimize-images.ts');
    const flags = [...body.matchAll(/ (--[a-z-]+)/g)].map((m) => m[1] as string);
    for (const flag of new Set(flags)) {
      const known =
        optimizeSource.includes(`'${flag}'`) ||
        read('scripts/verify-images.ts').includes(`'${flag}'`);
      expect(known, `${flag} is not implemented`).toBe(true);
    }
  });
});

describe('documentation points at real files', () => {
  it('lists only reference assets that exist (asset-manifest.json)', () => {
    const manifest = JSON.parse(read('docs/asset-manifest.json')) as { copied_assets: string[] };
    expect(manifest.copied_assets).toHaveLength(19);
    for (const asset of manifest.copied_assets)
      expect(existsSync(path.join(ROOT, asset)), asset).toBe(true);
  });

  it('lists only reference assets that exist (reference-catalogue.md)', () => {
    const paths = [...read('docs/reference-catalogue.md').matchAll(/`(references\/[^`]+)`/g)].map(
      (m) => m[1] as string,
    );
    expect(paths.length).toBeGreaterThanOrEqual(19);
    for (const asset of paths) expect(existsSync(path.join(ROOT, asset)), asset).toBe(true);
  });
});
