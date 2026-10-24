/**
 * AUDIT FIXTURE (after): the same section with the three planted violations
 * corrected. Each fix is annotated with the violation it removes.
 */

import {
  Card,
  SectionContainer,
  SectionHeading,
  StatusBadge,
} from '../../../../../src/components/index.ts';
import type { SiteContent } from '../../../../../src/content/schema.ts';

export interface RiskSummarySectionProps {
  /** Validated content only: obtain it from validateSiteContent(). (fixes V3) */
  statuses: SiteContent['statuses'];
}

export function RiskSummarySection({ statuses }: RiskSummarySectionProps) {
  return (
    <SectionContainer aria-labelledby="risk-summary-heading">
      <SectionHeading id="risk-summary-heading" title="What Green, Amber and Red mean" />
      <ul className="mt-8 grid gap-6 md:grid-cols-3">
        {statuses.map((entry) => (
          <li key={entry.state}>
            <Card as="article" className="flex flex-col gap-3">
              {/* Label + icon shape + colour, not colour alone. (fixes V2) */}
              <StatusBadge status={entry.state}>{entry.label}</StatusBadge>
              <p className="text-body">{entry.meaning}</p>
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-body">
        Questions?{' '}
        {/* Semantic token utility instead of a hex value. (fixes V1) */}
        <a href="#faq" className="font-semibold text-brand-primary underline">
          Read the FAQ
        </a>
      </p>
    </SectionContainer>
  );
}
