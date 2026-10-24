import { Check } from 'lucide-react';
import { ProductScreenshot, SectionContainer, SectionHeading } from '../components/index.ts';
import type { Feature, SiteContent } from '../content/schema.ts';
import { cx } from '../lib/cx.ts';

export interface FeatureShowcaseProps {
  featureSection: SiteContent['featureSection'];
  features: SiteContent['features'];
}

function FeatureRow({ feature }: { feature: Feature }) {
  return (
    <article className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
      <ProductScreenshot
        image={feature.image}
        sizes="(min-width: 48rem) 22rem, 80vw"
        className={cx(
          'mx-auto w-full max-w-screenshot',
          // `imageSide` is content, so the author controls the rhythm of the
          // page. Order is swapped only from md, where there are two columns;
          // on mobile the image always follows its heading.
          feature.imageSide === 'start' ? 'md:order-first' : 'md:order-last',
        )}
      />
      <div className="flex flex-col gap-4">
        <h3 className="text-h2 font-bold text-text-primary">{feature.heading}</h3>
        <p className="text-body text-text-secondary">{feature.description}</p>
        {feature.bullets && (
          <ul className="flex flex-col gap-2">
            {feature.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3">
                <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand-primary" />
                <span className="text-body text-text-primary">{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

/**
 * The product showcase: alternating screenshot/text rows.
 *
 * Each row explains what the screenshot lets the user do, and none of the page
 * copy lives inside an image, so the section still reads with images off.
 */
export function FeatureShowcase({ featureSection, features }: FeatureShowcaseProps) {
  return (
    <SectionContainer id="product" aria-labelledby="product-heading" tone="subtle">
      <div className="flex flex-col gap-12 md:gap-16">
        <SectionHeading
          id="product-heading"
          title={featureSection.heading}
          description={featureSection.intro}
        />
        {features.map((feature) => (
          <FeatureRow key={feature.id} feature={feature} />
        ))}
      </div>
    </SectionContainer>
  );
}
