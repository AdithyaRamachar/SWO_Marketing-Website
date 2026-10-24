/**
 * Design-system showcase. DEVELOPMENT ONLY: not part of the marketing page.
 *
 * Every token listed here is read from src/styles/tokens.css itself (imported
 * as raw text), so this page cannot show a stale or invented token. Component
 * examples use the real components from src/components.
 */

import { useSyncExternalStore } from 'react';
import {
  Button,
  ButtonLink,
  Card,
  FormField,
  SectionContainer,
  SectionHeading,
  Select,
  StatusBadge,
  TextInput,
} from '../components/index.ts';
import type { WorkoutStatus } from '../components/index.ts';
import { parseTokenDeclarations } from '../lib/token-parse.ts';
import tokensCss from '../styles/tokens.css?raw';

const tokens = parseTokenDeclarations(tokensCss);

function names(prefix: string, exclude: readonly string[] = []): string[] {
  return [...tokens.keys()].filter(
    (name) => name.startsWith(prefix) && !exclude.some((e) => name.startsWith(e)),
  );
}

/** The browser's resolved value of a token, so aliases show their real colour. */
function useResolved(name: string): string {
  // Reading computed CSS is reading an external system, so it is a store read,
  // not state to mirror into React with an effect.
  return useSyncExternalStore(
    () => () => undefined,
    () => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    () => '',
  );
}

function Swatch({ name }: { name: string }) {
  const resolved = useResolved(name);
  const alias = tokens.get(name)?.startsWith('var(') ? tokens.get(name) : undefined;
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="size-12 shrink-0 rounded-button border border-border-default"
        style={{ backgroundColor: `var(${name})` }}
      />
      <span className="flex min-w-0 flex-col">
        <code className="text-small font-semibold break-all">{name}</code>
        <span className="text-small text-text-secondary">
          {resolved || '…'}
          {alias ? ` ← ${alias}` : ''}
        </span>
      </span>
    </li>
  );
}

function SwatchGroup({
  title,
  prefix,
  exclude,
}: {
  title: string;
  prefix: string;
  exclude?: string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-h3 font-semibold">{title}</h3>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {names(prefix, exclude).map((name) => (
          <Swatch key={name} name={name} />
        ))}
      </ul>
    </div>
  );
}

const STATUS_EXAMPLES: ReadonlyArray<{
  status: WorkoutStatus;
  rationale: string;
  action: string;
}> = [
  {
    status: 'green',
    rationale: 'Example: recovery looks strong and recent sessions have been steady.',
    action: 'Train as planned, or consider a small step up.',
  },
  {
    status: 'amber',
    rationale: 'Example: this muscle is recovered, but overall readiness is moderate.',
    action: 'Consider reducing the weight or the number of sets.',
  },
  {
    status: 'red',
    rationale: 'Example: recovery signals and recent load both point toward holding back.',
    action: 'Rest, or choose an active-recovery option instead.',
  },
];

export function Showcase() {
  return (
    <main>
      <SectionContainer tone="subtle" aria-labelledby="top">
        <SectionHeading
          level={1}
          id="top"
          eyebrow="Development only"
          title="SWO design-system showcase"
          description="Reads src/styles/tokens.css directly. This is not the marketing page."
        />
        <nav aria-label="Showcase sections" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {[
              'typography',
              'colour',
              'spacing',
              'geometry',
              'buttons',
              'cards',
              'forms',
              'status',
              'layout',
            ].map((id) => (
              <li key={id}>
                <ButtonLink variant="tertiary" href={`#${id}`}>
                  {id}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </nav>
      </SectionContainer>

      <SectionContainer aria-labelledby="typography">
        <SectionHeading
          id="typography"
          title="Typography"
          description={`Family: ${tokens.get('--font-sans')}`}
        />
        <div className="mt-8 flex flex-col gap-6">
          <p className="text-hero font-bold">Hero: train with the full picture</p>
          <p className="text-h2 font-bold">Section heading (h2)</p>
          <p className="text-h3 font-semibold">Card title (h3)</p>
          <p className="max-w-prose text-body">
            Body: SWO turns sleep quality, fatigue and workout history into exercise-level guidance,
            and shows the reason beside every status.
          </p>
          <p className="text-small text-text-secondary">Small: supporting label and captions.</p>
          <ul className="flex flex-wrap gap-6 text-body">
            <li className="font-regular">Regular 400</li>
            <li className="font-medium">Medium 500</li>
            <li className="font-semibold">Semibold 600</li>
            <li className="font-bold">Bold 700</li>
          </ul>
        </div>
      </SectionContainer>

      <SectionContainer tone="subtle" aria-labelledby="colour">
        <SectionHeading
          id="colour"
          title="Colour"
          description="Semantic tokens. Components never use palette tokens."
        />
        <div className="mt-8 flex flex-col gap-8">
          <SwatchGroup title="Text" prefix="--color-text-" />
          <SwatchGroup title="Brand" prefix="--color-brand-" />
          <SwatchGroup title="Surfaces" prefix="--color-surface-" />
          <SwatchGroup title="Borders" prefix="--color-border-" />
          <SwatchGroup title="Workout status (Green / Amber / Red)" prefix="--color-status-" />
          <SwatchGroup
            title="Feedback (success / warning / danger / info)"
            prefix="--color-feedback-"
          />
          <SwatchGroup title="Focus" prefix="--color-focus-" />
          <SwatchGroup title="Palette (raw, reference only)" prefix="--palette-" />
        </div>
      </SectionContainer>

      <SectionContainer aria-labelledby="spacing">
        <SectionHeading
          id="spacing"
          title="Spacing"
          description="Each step is a multiple of 0.25rem."
        />
        <ul className="mt-8 flex flex-col gap-3">
          {names('--space-').map((name) => (
            <li key={name} className="flex items-center gap-4">
              <code className="w-24 shrink-0 text-small">{name}</code>
              <span
                aria-hidden="true"
                className="h-4 rounded-button bg-brand-primary"
                style={{ width: `var(${name})` }}
              />
              <span className="text-small text-text-secondary">{tokens.get(name)}</span>
            </li>
          ))}
        </ul>
      </SectionContainer>

      <SectionContainer tone="subtle" aria-labelledby="geometry">
        <SectionHeading id="geometry" title="Radii, borders and shadows" />
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {names('--radius-').map((name) => (
            <li key={name} className="flex flex-col gap-2">
              <span
                aria-hidden="true"
                className="h-20 border border-border-strong bg-surface-page"
                style={{ borderRadius: `var(${name})` }}
              />
              <code className="text-small font-semibold">{name}</code>
              <span className="text-small text-text-secondary">{tokens.get(name)}</span>
            </li>
          ))}
          {names('--shadow-').map((name) => (
            <li key={name} className="flex flex-col gap-2">
              <span
                aria-hidden="true"
                className="h-20 rounded-card bg-surface-page"
                style={{ boxShadow: `var(${name})` }}
              />
              <code className="text-small font-semibold">{name}</code>
            </li>
          ))}
          {names('--border-width-').map((name) => (
            <li key={name} className="flex flex-col gap-2">
              <span
                aria-hidden="true"
                className="h-20 rounded-card border-border-strong bg-surface-page"
                style={{ borderStyle: 'solid', borderWidth: `var(${name})` }}
              />
              <code className="text-small font-semibold">{name}</code>
              <span className="text-small text-text-secondary">{tokens.get(name)}</span>
            </li>
          ))}
        </ul>
      </SectionContainer>

      <SectionContainer aria-labelledby="buttons">
        <SectionHeading
          id="buttons"
          title="Buttons and interaction states"
          description="Press Tab to see the real focus ring. Hover and press a button to see its state colours."
        />
        <div className="mt-8 flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <ButtonLink href="#top">Link button</ButtonLink>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" disabled>
              Primary disabled
            </Button>
            <Button variant="secondary" disabled>
              Secondary disabled
            </Button>
            <Button variant="tertiary" disabled>
              Tertiary disabled
            </Button>
            <Button variant="primary" loading>
              Saving
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-h3 font-semibold">State colours</h3>
            <ul className="flex flex-wrap gap-4">
              {[
                ['default', '--color-brand-primary'],
                ['hover', '--color-brand-primary-hover'],
                ['active', '--color-brand-primary-active'],
                ['surface hover', '--color-surface-hover'],
                ['surface pressed', '--color-surface-pressed'],
                ['disabled', '--color-surface-disabled'],
              ].map(([label, name]) => (
                <li key={name} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-8 rounded-button border border-border-default"
                    style={{ backgroundColor: `var(${name})` }}
                  />
                  <span className="text-small">{label}</span>
                </li>
              ))}
            </ul>
            <p className="text-small text-text-secondary">
              Focus ring: {tokens.get('--focus-ring-width')} solid, offset{' '}
              {tokens.get('--focus-ring-offset')}.
            </p>
          </div>
        </div>
      </SectionContainer>

      <SectionContainer tone="subtle" aria-labelledby="cards">
        <SectionHeading id="cards" title="Cards" />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card as="article" aria-labelledby="card-outlined">
            <h3 id="card-outlined" className="text-h3 font-semibold">
              Outlined card
            </h3>
            <p className="mt-2 text-text-secondary">Border, surface and card shadow tokens.</p>
          </Card>
          <Card as="article" variant="subtle" aria-labelledby="card-subtle">
            <h3 id="card-subtle" className="text-h3 font-semibold">
              Subtle card
            </h3>
            <p className="mt-2 text-text-secondary">Quiet panel on the page canvas.</p>
          </Card>
        </div>
      </SectionContainer>

      <SectionContainer aria-labelledby="forms">
        <SectionHeading
          id="forms"
          title="Form controls"
          description="Every control has a visible label."
        />
        <form className="mt-8 grid max-w-prose gap-6" onSubmit={(event) => event.preventDefault()}>
          <FormField label="Exercise name" hint="As it appears in your log.">
            <TextInput placeholder="Lying leg curl" />
          </FormField>
          <FormField label="Weight (kg)" required error="Enter a weight greater than 0.">
            <TextInput type="number" defaultValue="-5" />
          </FormField>
          <FormField label="Training goal">
            <Select defaultValue="strength">
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
            </Select>
          </FormField>
          <FormField label="Disabled field">
            <TextInput disabled defaultValue="Not editable" />
          </FormField>
          <div>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </SectionContainer>

      <SectionContainer tone="subtle" aria-labelledby="status">
        <SectionHeading
          id="status"
          title="Workout status"
          description="Meaning is carried by the label and a distinct icon shape, never colour alone. Order: status, rationale, action."
        />
        <div className="mt-8 flex flex-wrap gap-4">
          <StatusBadge status="green" />
          <StatusBadge status="amber" />
          <StatusBadge status="red" />
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STATUS_EXAMPLES.map((example) => (
            <Card as="article" key={example.status} className="flex flex-col gap-3">
              <StatusBadge status={example.status} className="self-start" />
              <p className="text-body">{example.rationale}</p>
              <p className="text-body font-semibold">{example.action}</p>
            </Card>
          ))}
        </div>
      </SectionContainer>

      <SectionContainer aria-labelledby="layout">
        <SectionHeading id="layout" title="Layout tokens" />
        <ul className="mt-8 grid gap-2 text-body">
          {[...names('--container-'), ...names('--breakpoint-'), '--min-target-size'].map(
            (name) => (
              <li key={name}>
                <code className="font-semibold">{name}</code>{' '}
                <span className="text-text-secondary">{tokens.get(name)}</span>
              </li>
            ),
          )}
        </ul>
      </SectionContainer>
    </main>
  );
}
