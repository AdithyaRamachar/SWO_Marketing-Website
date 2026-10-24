import { ButtonLink, SectionContainer, SectionHeading } from '../components/index.ts';
import type { SiteContent } from '../content/schema.ts';

export interface FinalCtaSectionProps {
  finalCta: SiteContent['finalCta'];
}

/**
 * Closing call to action.
 *
 * There is no sign-up, download or app-store listing to point at, and inventing
 * one would be a lie, so the single action moves the reader back to a section
 * of this page. The content model allows exactly one CTA here and the schema
 * checks that its anchor resolves to a real section.
 */
export function FinalCtaSection({ finalCta }: FinalCtaSectionProps) {
  return (
    <SectionContainer aria-labelledby="final-cta-heading" tone="subtle">
      <div className="flex flex-col items-center gap-8">
        <SectionHeading
          id="final-cta-heading"
          align="center"
          title={finalCta.heading}
          description={finalCta.body}
        />
        <ButtonLink href={finalCta.cta.href}>{finalCta.cta.label}</ButtonLink>
      </div>
    </SectionContainer>
  );
}
