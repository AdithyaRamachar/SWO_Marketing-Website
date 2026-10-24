/**
 * AUDIT FIXTURE (before): contains exactly THREE deliberate design-system
 * violations. It is not used by the application and is kept out of production
 * code, lint and the type-check include list on purpose.
 *
 *   V1  hard-coded colour instead of a token        (expected rule: DS-COLOR-01)
 *   V2  a risk indicator that relies on colour only (expected rule: A11Y-01)
 *   V3  renders unvalidated content directly        (expected rule: CONTENT-01)
 *
 * These expectations are the ground truth the auditor is scored against. The
 * auditor is NOT told which lines are planted.
 */

import { Card, SectionContainer, SectionHeading } from '../../../../../src/components/index.ts';
import rawContent from '../../../../../src/content/site-content.json';

const dotColour: Record<string, string> = {
  green: 'bg-status-green-fg',
  amber: 'bg-status-amber-fg',
  red: 'bg-status-red-fg',
};

export function RiskSummarySection() {
  const statuses = rawContent.statuses;

  return (
    <SectionContainer aria-labelledby="risk-summary-heading">
      <SectionHeading id="risk-summary-heading" title="What Green, Amber and Red mean" />
      <ul className="mt-8 grid gap-6 md:grid-cols-3">
        {statuses.map((entry) => (
          <li key={entry.state}>
            <Card as="article" className="flex flex-col gap-3">
              <span className={`inline-block size-4 rounded-pill ${dotColour[entry.state]}`} />
              <p className="text-body">{entry.meaning}</p>
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-body">
        Questions?{' '}
        <a href="#faq" style={{ color: '#0B7A6B' }} className="font-semibold underline">
          Read the FAQ
        </a>
      </p>
    </SectionContainer>
  );
}
