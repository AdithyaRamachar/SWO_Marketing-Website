import { Card, SectionContainer, SectionHeading } from '../components/index.ts';

const PAGES = [
  {
    href: '/dev/showcase.html',
    title: 'Design-system showcase',
    description: 'Tokens, typography, components and states, read from tokens.css.',
  },
  {
    href: '/dev/content-demo.html',
    title: 'Structured content demo',
    description: 'Validate content against the schema, then render it. Edit it to see rejection.',
  },
] as const;

export function DevIndex() {
  return (
    <main>
      <SectionContainer aria-labelledby="dev-index-title">
        <SectionHeading
          level={1}
          id="dev-index-title"
          eyebrow="Development index"
          title="SWO website: tooling pages"
          description="The marketing landing page is not built yet. These pages exist to inspect and verify the tooling."
        />
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {PAGES.map((page) => (
            <li key={page.href}>
              <Card as="article" className="h-full">
                <h2 className="text-h3 font-semibold">
                  <a href={page.href} className="text-brand-primary underline">
                    {page.title}
                  </a>
                </h2>
                <p className="mt-2 text-text-secondary">{page.description}</p>
              </Card>
            </li>
          ))}
        </ul>
      </SectionContainer>
    </main>
  );
}
