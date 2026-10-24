import { Check } from 'lucide-react';
import { Card, SectionContainer, SectionHeading } from '../components/index.ts';
import type { SiteContent } from '../content/schema.ts';

export interface ProblemSectionProps {
  problem: SiteContent['problem'];
}

/**
 * The problem the product addresses. Deliberately plain: no imagery, no
 * statistics and no alarming language, because the honest version of this
 * section is "these inputs are hard to weigh against each other", not "your
 * soreness is dangerous".
 */
export function ProblemSection({ problem }: ProblemSectionProps) {
  return (
    <SectionContainer id="problem" aria-labelledby="problem-heading" tone="page">
      <div className="flex flex-col gap-8">
        <SectionHeading id="problem-heading" title={problem.heading} description={problem.body} />
        {problem.points && (
          <ul className="grid gap-4 md:grid-cols-3">
            {problem.points.map((point) => (
              <li key={point}>
                <Card as="article" variant="subtle" className="flex h-full items-start gap-3">
                  <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand-primary" />
                  <p className="text-body text-text-primary">{point}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionContainer>
  );
}
