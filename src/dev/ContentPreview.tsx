/**
 * Renders VALIDATED site content with the design-system components.
 *
 * The prop type is SiteContent, the output type of the Zod schema. A caller can
 * only obtain one by passing raw data through validateSiteContent(), so this
 * component never sees unvalidated content. It is deliberately compact: it
 * proves that structured content can drive real components, and is NOT the
 * marketing page (Phase D).
 */

import {
  ButtonLink,
  Card,
  SectionContainer,
  SectionHeading,
  StatusBadge,
} from '../components/index.ts';
import type { ProductImage, SiteContent } from '../content/schema.ts';

function Figure({ image }: { image: ProductImage }) {
  return (
    <figure className="flex flex-col gap-2">
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading="lazy"
        className="h-auto w-full max-w-xs rounded-card border border-border-default"
      />
      {image.caption && (
        <figcaption className="text-small text-text-secondary">{image.caption}</figcaption>
      )}
    </figure>
  );
}

export function ContentPreview({ content }: { content: SiteContent }) {
  const { hero, problem, howItWorks, statuses, features, methodology, faq, footer } = content;

  return (
    <div data-testid="content-preview">
      <SectionContainer aria-labelledby="hero-heading">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <SectionHeading
              id="hero-heading"
              eyebrow={hero.eyebrow}
              title={hero.headline}
              description={hero.supportingCopy}
            />
            <div className="flex flex-wrap gap-4">
              <ButtonLink href={hero.primaryCta.href}>{hero.primaryCta.label}</ButtonLink>
              {hero.secondaryCta && (
                <ButtonLink variant="secondary" href={hero.secondaryCta.href}>
                  {hero.secondaryCta.label}
                </ButtonLink>
              )}
            </div>
          </div>
          <Figure image={hero.preview} />
        </div>
      </SectionContainer>

      <SectionContainer tone="subtle" id="problem" aria-labelledby="problem-heading">
        <SectionHeading id="problem-heading" title={problem.heading} description={problem.body} />
        {problem.points && (
          <ul className="mt-6 list-disc pl-6 text-body">
            {problem.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        )}
      </SectionContainer>

      <SectionContainer id="how-it-works" aria-labelledby="how-heading">
        <SectionHeading
          id="how-heading"
          title={howItWorks.heading}
          description={howItWorks.intro}
        />
        <ol className="mt-8 grid gap-4 md:grid-cols-5">
          {howItWorks.steps.map((step) => (
            <li key={step.id}>
              <Card className="h-full">
                <p className="text-small font-semibold uppercase text-brand-primary">
                  {step.stage}
                </p>
                <h3 className="mt-1 text-h3 font-semibold">{step.title}</h3>
                <p className="mt-2 text-small text-text-secondary">{step.description}</p>
              </Card>
            </li>
          ))}
        </ol>
      </SectionContainer>

      <SectionContainer tone="subtle" id="status" aria-labelledby="status-heading">
        <SectionHeading id="status-heading" title="What Green, Amber and Red mean" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {statuses.map((entry) => (
            <Card as="article" key={entry.state} className="flex flex-col gap-3">
              <StatusBadge status={entry.state}>{entry.label}</StatusBadge>
              <p className="text-body">{entry.meaning}</p>
              <p className="text-body text-text-secondary">{entry.exampleRationale}</p>
              <p className="text-body font-semibold">{entry.suggestedAction}</p>
            </Card>
          ))}
        </div>
      </SectionContainer>

      {features.map((feature) => (
        <SectionContainer
          key={feature.id}
          id={feature.id}
          aria-labelledby={`${feature.id}-heading`}
        >
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className={feature.imageSide === 'start' ? 'md:order-2' : undefined}>
              <SectionHeading
                id={`${feature.id}-heading`}
                title={feature.heading}
                description={feature.description}
              />
              {feature.bullets && (
                <ul className="mt-4 list-disc pl-6 text-body">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className={feature.imageSide === 'start' ? 'md:order-1' : undefined}>
              <Figure image={feature.image} />
            </div>
          </div>
        </SectionContainer>
      ))}

      <SectionContainer tone="subtle" id="science" aria-labelledby="science-heading">
        <SectionHeading
          id="science-heading"
          title={methodology.heading}
          description={methodology.intro}
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {methodology.frameworks.map((framework) => (
            <Card
              as="article"
              key={framework.id}
              aria-labelledby={`${framework.id}-name`}
              className="flex flex-col gap-3"
            >
              <h3 id={`${framework.id}-name`} className="text-h3 font-semibold">
                {framework.name}
              </h3>
              <p className="text-small font-semibold uppercase text-text-secondary">The concept</p>
              <p className="text-body">{framework.concept}</p>
              <p className="text-small font-semibold uppercase text-text-secondary">
                What SWO does
              </p>
              <p className="text-body">{framework.swoImplementation}</p>
              <p className="text-small text-text-secondary">
                {framework.evidenceStatus === 'sourced'
                  ? 'Sourced.'
                  : 'Concept description only. No SWO validation is claimed.'}
              </p>
            </Card>
          ))}
        </div>
        <p className="mt-6 max-w-prose text-small text-text-secondary">{methodology.disclaimer}</p>
      </SectionContainer>

      <SectionContainer id="faq" aria-labelledby="faq-heading">
        <SectionHeading id="faq-heading" title="Frequently asked questions" />
        <div className="mt-8 flex max-w-prose flex-col gap-3">
          {faq.map((item) => (
            <details
              key={item.id}
              className="rounded-card border border-border-default bg-surface-page p-4"
            >
              <summary className="cursor-pointer text-body font-semibold">{item.question}</summary>
              <p className="mt-2 text-body text-text-secondary">{item.answer}</p>
            </details>
          ))}
        </div>
      </SectionContainer>

      <footer className="bg-surface-subtle py-12">
        <div className="mx-auto w-full max-w-content px-4 md:px-6 lg:px-8">
          {footer.tagline && <p className="text-body font-semibold">{footer.tagline}</p>}
          <nav aria-label="Footer" className="mt-4 flex flex-wrap gap-8">
            {footer.linkGroups.map((group) => (
              <div key={group.heading}>
                <h2 className="text-small font-semibold">{group.heading}</h2>
                <ul className="mt-2 flex flex-col gap-1">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="text-small text-brand-primary underline">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <p className="mt-6 max-w-prose text-small text-text-secondary">{footer.legalNote}</p>
        </div>
      </footer>
    </div>
  );
}
