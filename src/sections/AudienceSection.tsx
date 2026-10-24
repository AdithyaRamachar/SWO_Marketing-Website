import { Check } from 'lucide-react';
import { Card, ProductScreenshot, SectionContainer, SectionHeading } from '../components/index.ts';
import type { SiteContent } from '../content/schema.ts';

export interface AudienceSectionProps {
  audiences: SiteContent['audiences'];
}

/**
 * Who the product is for.
 *
 * There is nowhere in this section to put a quote, a name or a user count: the
 * content model has no field for one, so the section can only describe what
 * each audience can do with the product.
 */
export function AudienceSection({ audiences }: AudienceSectionProps) {
  return (
    <SectionContainer id="audiences" aria-labelledby="audiences-heading" tone="subtle">
      <div className="flex flex-col gap-8">
        <SectionHeading
          id="audiences-heading"
          title={audiences.heading}
          description={audiences.intro}
        />
        <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
          <ul className="grid gap-4 md:grid-cols-2 lg:col-span-2">
            {audiences.groups.map((group) => (
              <li key={group.id}>
                <Card as="article" className="flex h-full flex-col gap-3">
                  <h3 className="text-h3 font-semibold text-text-primary">{group.name}</h3>
                  <p className="text-body text-text-secondary">{group.description}</p>
                  {group.points && (
                    <ul className="flex flex-col gap-2">
                      {group.points.map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <Check
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0 text-brand-primary"
                          />
                          <span className="text-body text-text-primary">{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </li>
            ))}
          </ul>
          {audiences.image && (
            <ProductScreenshot
              image={audiences.image}
              sizes="(min-width: 64rem) 22rem, 80vw"
              className="mx-auto w-full max-w-screenshot"
            />
          )}
        </div>
      </div>
    </SectionContainer>
  );
}
