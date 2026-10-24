import { Card, SectionContainer, SectionHeading } from '../components/index.ts';
import type { SiteContent } from '../content/schema.ts';

export interface HowItWorksSectionProps {
  howItWorks: SiteContent['howItWorks'];
}

/**
 * The inputs → analysis → guidance flow as an ordered list.
 *
 * It is a real `<ol>`: the order carries meaning, so it should survive styles
 * being switched off, and a screen reader should announce "3 of 5". The stage
 * is shown as a word, not only as a position, so the grouping does not depend
 * on reading the layout.
 */
export function HowItWorksSection({ howItWorks }: HowItWorksSectionProps) {
  return (
    <SectionContainer id="how-it-works" aria-labelledby="how-it-works-heading" tone="subtle">
      <div className="flex flex-col gap-8">
        <SectionHeading
          id="how-it-works-heading"
          title={howItWorks.heading}
          description={howItWorks.intro}
        />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {howItWorks.steps.map((step, index) => (
            <li key={step.id}>
              <Card as="article" className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-pill bg-brand-subtle text-small font-bold text-brand-primary"
                  >
                    {index + 1}
                  </span>
                  <span className="text-small font-semibold uppercase text-text-secondary">
                    {howItWorks.stageLabels[step.stage]}
                  </span>
                </div>
                <h3 className="text-h3 font-semibold text-text-primary">{step.title}</h3>
                <p className="text-body text-text-secondary">{step.description}</p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </SectionContainer>
  );
}
