/**
 * Development demonstration of the content pipeline:
 *   raw JSON text -> JSON.parse -> validateSiteContent() -> ContentPreview
 *
 * Edit the JSON and it re-validates on every keystroke. Invalid content shows
 * the exact field and what is wrong, and is NEVER rendered, patched or partly
 * dropped. Not part of the marketing page.
 */

import { useMemo, useState } from 'react';
import { Button, Card, SectionContainer, SectionHeading } from '../components/index.ts';
import { validateSiteContent } from '../content/validate.ts';
import type { ContentIssue } from '../content/validate.ts';
import sampleContent from '../content/site-content.json';
import { ContentPreview } from './ContentPreview.tsx';

const SAMPLE_TEXT = JSON.stringify(sampleContent, null, 2);

/** Introduces four deliberate faults so the rejection path can be seen. */
function breakContent(): string {
  const broken = structuredClone(sampleContent) as unknown as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  delete broken['hero'].headline;
  broken['hero'].primaryCta.href = '#';
  broken['faq'][0].answer = 'Yes. SWO is clinically proven and guaranteed to prevent every injury.';
  broken['statuses'][2].state = 'blue';
  return JSON.stringify(broken, null, 2);
}

type Parsed =
  | { kind: 'syntax'; message: string }
  | { kind: 'invalid'; issues: ContentIssue[] }
  | {
      kind: 'valid';
      content: Extract<ReturnType<typeof validateSiteContent>, { ok: true }>['data'];
    };

export function ContentDemo() {
  const [text, setText] = useState(SAMPLE_TEXT);

  const parsed = useMemo<Parsed>(() => {
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (error) {
      return { kind: 'syntax', message: (error as Error).message };
    }
    const result = validateSiteContent(json);
    return result.ok
      ? { kind: 'valid', content: result.data }
      : { kind: 'invalid', issues: result.issues };
  }, [text]);

  return (
    <main>
      <SectionContainer tone="subtle" aria-labelledby="demo-title">
        <SectionHeading
          level={1}
          id="demo-title"
          eyebrow="Development only"
          title="Structured content: validate, then render"
          description="Edit the JSON. Valid content renders below. Invalid content is rejected with the exact field and reason, and nothing is rendered."
        />
        <div className="mt-6 flex flex-wrap gap-4">
          <Button variant="secondary" onClick={() => setText(SAMPLE_TEXT)}>
            Reset to sample
          </Button>
          <Button variant="secondary" onClick={() => setText(breakContent())}>
            Introduce 4 faults
          </Button>
        </div>
        <label htmlFor="content-json" className="mt-6 block text-small font-semibold">
          Content JSON
        </label>
        <textarea
          id="content-json"
          value={text}
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
          rows={12}
          className="mt-2 w-full rounded-control border border-border-strong bg-surface-page p-3 font-sans text-small"
        />
        <p role="status" className="mt-3 text-body font-semibold" data-testid="validation-status">
          {parsed.kind === 'valid' && 'Valid: rendering below.'}
          {parsed.kind === 'invalid' &&
            `Invalid: ${parsed.issues.length} issue(s). Nothing is rendered.`}
          {parsed.kind === 'syntax' && 'Not valid JSON. Nothing is rendered.'}
        </p>
      </SectionContainer>

      {parsed.kind === 'syntax' && (
        <SectionContainer aria-label="JSON syntax error">
          <Card className="border-feedback-danger-fg">
            <p className="text-body">
              <span className="font-semibold">Syntax error:</span> {parsed.message}
            </p>
          </Card>
        </SectionContainer>
      )}

      {parsed.kind === 'invalid' && (
        <SectionContainer aria-labelledby="issues-heading">
          <SectionHeading id="issues-heading" level={2} title="Content issues" />
          <ul className="mt-6 flex flex-col gap-3" data-testid="issue-list">
            {parsed.issues.map((issue, index) => (
              <li key={`${issue.path}-${index}`}>
                <Card>
                  <code className="text-small font-semibold">{issue.path}</code>
                  <p className="mt-1 text-body">{issue.message}</p>
                </Card>
              </li>
            ))}
          </ul>
        </SectionContainer>
      )}

      {parsed.kind === 'valid' && <ContentPreview content={parsed.content} />}
    </main>
  );
}
