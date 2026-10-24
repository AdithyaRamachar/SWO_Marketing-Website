import type { SiteContent } from '../content/schema.ts';

export interface SiteFooterProps {
  footer: SiteContent['footer'];
}

/**
 * Compact footer.
 *
 * Every link is an in-page anchor checked by the schema. There are no social
 * profiles, no contact address and no legal pages, because none of those exist
 * for this project; a dead link would be worse than an absent one.
 */
export function SiteFooter({ footer }: SiteFooterProps) {
  return (
    <footer className="border-t border-border-default bg-surface-page">
      <div className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-12 md:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          {footer.tagline && (
            <p className="text-h3 font-semibold text-text-primary">{footer.tagline}</p>
          )}
          <nav aria-label="Footer" className="flex flex-col gap-8 sm:flex-row sm:gap-12">
            {footer.linkGroups.map((group) => (
              <div key={group.heading} className="flex flex-col gap-2">
                <h2 className="text-small font-semibold uppercase text-text-secondary">
                  {group.heading}
                </h2>
                <ul className="flex flex-col gap-1">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="flex min-h-(--min-target-size) items-center rounded-button text-body text-text-primary hover:text-brand-primary"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <p className="max-w-prose text-small text-text-secondary">{footer.legalNote}</p>
      </div>
    </footer>
  );
}
