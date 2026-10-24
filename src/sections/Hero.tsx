import { ButtonLink, ProductScreenshot, SectionHeading } from '../components/index.ts';
import type { SiteContent } from '../content/schema.ts';

export interface HeroProps {
  hero: SiteContent['hero'];
}

/**
 * Product-led hero: the value proposition and the product itself, side by side
 * from `lg`. The screenshot is the one eager image on the page.
 *
 * The heading is the page's only `h1`, which is why `SectionHeading` is given
 * `level={1}`; size follows the level, so the outline and the visual hierarchy
 * cannot disagree.
 */
export function Hero({ hero }: HeroProps) {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="bg-surface-subtle">
      <div className="mx-auto grid w-full max-w-content gap-12 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <div className="flex flex-col gap-8">
          <SectionHeading
            level={1}
            id="hero-heading"
            eyebrow={hero.eyebrow}
            title={hero.headline}
            description={hero.supportingCopy}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href={hero.primaryCta.href}>{hero.primaryCta.label}</ButtonLink>
            {hero.secondaryCta && (
              <ButtonLink href={hero.secondaryCta.href} variant="secondary">
                {hero.secondaryCta.label}
              </ButtonLink>
            )}
          </div>
        </div>

        {/* Phone screenshot: bounded by --container-screenshot so a 1700px-tall
            image cannot dominate a desktop viewport. */}
        <ProductScreenshot
          image={hero.preview}
          priority
          sizes="(min-width: 48rem) 22rem, 80vw"
          className="mx-auto w-full max-w-screenshot"
        />
      </div>
    </section>
  );
}
