import { Info } from 'lucide-react';
import { Card, SectionContainer, SectionHeading } from '../components/index.ts';
import type { Framework, SiteContent } from '../content/schema.ts';

export interface MethodologySectionProps {
  methodology: SiteContent['methodology'];
}

function FrameworkCard({
  framework,
  conceptLabel,
  implementationLabel,
  unsourcedNotice,
}: {
  framework: Framework;
  conceptLabel: string;
  implementationLabel: string;
  unsourcedNotice: string;
}) {
  return (
    <Card as="article" className="flex h-full flex-col gap-4">
      <h3 className="text-h3 font-semibold text-text-primary">{framework.name}</h3>

      {/* The two halves are labelled, and the labels are real text. The whole
          point of this section is that a reader can tell a published training
          concept apart from what this product does with it. */}
      <div className="flex flex-col gap-1">
        <p className="text-small font-semibold uppercase text-text-secondary">{conceptLabel}</p>
        <p className="text-body text-text-secondary">{framework.concept}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-small font-semibold uppercase text-text-secondary">
          {implementationLabel}
        </p>
        <p className="text-body text-text-primary">{framework.swoImplementation}</p>
      </div>

      {framework.evidenceStatus === 'sourced' && framework.sources ? (
        <ul className="flex flex-col gap-1">
          {framework.sources.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                className="inline-flex min-h-(--min-target-size) items-center text-small font-medium text-brand-primary underline"
                rel="noreferrer"
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-auto text-small text-text-secondary">{unsourcedNotice}</p>
      )}
    </Card>
  );
}

/**
 * Training concepts behind the guidance.
 *
 * `evidenceStatus` drives what the card says about proof: a framework with no
 * source says so in the card itself rather than leaving the reader to assume
 * one exists. The disclaimer is part of the validated content, not decoration,
 * so it cannot be dropped by editing a component.
 */
export function MethodologySection({ methodology }: MethodologySectionProps) {
  return (
    <SectionContainer id="science" aria-labelledby="science-heading" tone="page">
      <div className="flex flex-col gap-8">
        <SectionHeading
          id="science-heading"
          title={methodology.heading}
          description={methodology.intro}
        />
        <ul className="grid gap-4 md:grid-cols-3">
          {methodology.frameworks.map((framework) => (
            <li key={framework.id}>
              <FrameworkCard
                framework={framework}
                conceptLabel={methodology.conceptLabel}
                implementationLabel={methodology.implementationLabel}
                unsourcedNotice={methodology.unsourcedNotice}
              />
            </li>
          ))}
        </ul>
        <Card variant="subtle" className="flex items-start gap-3">
          <Info aria-hidden="true" className="mt-1 size-4 shrink-0 text-text-secondary" />
          <p className="text-body text-text-primary">{methodology.disclaimer}</p>
        </Card>
      </div>
    </SectionContainer>
  );
}
