import {
  AudienceSection,
  FaqSection,
  FeatureShowcase,
  FinalCtaSection,
  Hero,
  HowItWorksSection,
  MethodologySection,
  ProblemSection,
  SiteFooter,
  SiteHeader,
  StatusSection,
} from '../sections/index.ts';
import type { SiteContent } from '../content/schema.ts';

export interface MarketingPageProps {
  /**
   * Already validated. The page takes `SiteContent`, never raw JSON, so there
   * is no path by which unvalidated copy reaches the DOM.
   */
  content: SiteContent;
}

/**
 * The SWO marketing homepage.
 *
 * Section order follows the reader's questions: what is it (hero) → why would I
 * need it (problem) → how does it work (how it works) → what will it tell me
 * (states) → show me (product) → why should I believe it (methodology) → is it
 * for me (audiences) → what about… (FAQ) → now what (final CTA).
 *
 * This component holds composition only. Every string comes from `content`, and
 * the skip link is the one piece of text here, because it describes the page's
 * own structure rather than the product.
 */
export function MarketingPage({ content }: MarketingPageProps) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-button focus:bg-brand-primary focus:px-4 focus:py-3 focus:text-brand-on-primary"
      >
        Skip to main content
      </a>
      <SiteHeader nav={content.nav} />
      <main id="main">
        <Hero hero={content.hero} />
        <ProblemSection problem={content.problem} />
        <HowItWorksSection howItWorks={content.howItWorks} />
        <StatusSection statusSection={content.statusSection} statuses={content.statuses} />
        <FeatureShowcase featureSection={content.featureSection} features={content.features} />
        <MethodologySection methodology={content.methodology} />
        <AudienceSection audiences={content.audiences} />
        <FaqSection faqSection={content.faqSection} faq={content.faq} />
        <FinalCtaSection finalCta={content.finalCta} />
      </main>
      <SiteFooter footer={content.footer} />
    </>
  );
}
