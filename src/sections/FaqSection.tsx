import { ChevronDown } from 'lucide-react';
import { SectionContainer, SectionHeading } from '../components/index.ts';
import type { SiteContent } from '../content/schema.ts';

export interface FaqSectionProps {
  faqSection: SiteContent['faqSection'];
  faq: SiteContent['faq'];
}

/**
 * FAQ as native `<details>` / `<summary>` disclosures.
 *
 * Chosen over a hand-built accordion on purpose: the browser gives keyboard
 * operation (Enter and Space), the expanded state in the accessibility tree,
 * and find-in-page through collapsed answers, with no JavaScript and nothing to
 * get wrong. The chevron is decorative and rotates with `[open]`; the
 * reduced-motion rule in `styles/index.css` removes the transition.
 */
export function FaqSection({ faqSection, faq }: FaqSectionProps) {
  return (
    <SectionContainer id="faq" aria-labelledby="faq-heading" tone="page">
      <div className="flex flex-col gap-8">
        <SectionHeading
          id="faq-heading"
          title={faqSection.heading}
          description={faqSection.intro}
        />
        <ul className="flex max-w-prose flex-col gap-3">
          {faq.map((item) => (
            <li key={item.id}>
              <details
                id={item.id}
                className="group rounded-card border border-border-default bg-surface-page"
              >
                <summary className="flex min-h-(--min-target-size) cursor-pointer items-center justify-between gap-4 rounded-card px-6 py-3 text-body font-semibold text-text-primary hover:bg-surface-hover">
                  {item.question}
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="px-6 pb-6 text-body text-text-secondary">{item.answer}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </SectionContainer>
  );
}
