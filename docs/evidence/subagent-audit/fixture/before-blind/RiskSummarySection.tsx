/** Risk summary section: explains what the Green, Amber and Red states mean. */

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
