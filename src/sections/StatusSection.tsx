import {
  Card,
  ProductScreenshot,
  SectionContainer,
  SectionHeading,
  StatusBadge,
} from '../components/index.ts';
import type { SiteContent } from '../content/schema.ts';

export interface StatusSectionProps {
  statusSection: SiteContent['statusSection'];
  statuses: SiteContent['statuses'];
}

/**
 * Green / Amber / Red explained.
 *
 * Every state is carried by three things that are not colour: the badge's text
 * label, the badge's icon shape, and the `meaning` / `exampleRationale` /
 * `suggestedAction` text beneath it. The cards are deliberately ordered
 * green → amber → red by the content, not sorted here, so the page shows what
 * was authored and validated.
 */
export function StatusSection({ statusSection, statuses }: StatusSectionProps) {
  return (
    <SectionContainer id="status" aria-labelledby="status-heading" tone="page">
      <div className="flex flex-col gap-8">
        <SectionHeading
          id="status-heading"
          title={statusSection.heading}
          description={statusSection.intro}
        />

        <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
          <ul className="grid gap-4 lg:col-span-2">
            {statuses.map((status) => (
              <li key={status.state}>
                <Card as="article" className="flex h-full flex-col gap-3">
                  <StatusBadge status={status.state} className="self-start">
                    {status.label}
                  </StatusBadge>
                  <p className="text-body font-medium text-text-primary">{status.meaning}</p>
                  <p className="text-body text-text-secondary">{status.exampleRationale}</p>
                  <p className="text-body text-text-primary">
                    <span className="font-semibold">{statusSection.actionLabel}: </span>
                    {status.suggestedAction}
                  </p>
                </Card>
              </li>
            ))}
          </ul>

          {statusSection.image && (
            <ProductScreenshot
              image={statusSection.image}
              sizes="(min-width: 64rem) 22rem, 80vw"
              className="mx-auto w-full max-w-screenshot"
            />
          )}
        </div>
      </div>
    </SectionContainer>
  );
}
