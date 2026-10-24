// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import sample from '../src/content/site-content.json';
import { validateSiteContent } from '../src/content/validate.ts';
import { ContentDemo } from '../src/dev/ContentDemo.tsx';
import { ContentPreview } from '../src/dev/ContentPreview.tsx';

function validated() {
  const result = validateSiteContent(sample);
  if (!result.ok) throw new Error('sample must be valid');
  return result.data;
}

describe('ContentPreview renders validated content', () => {
  it('renders the hero headline, copy and both calls to action from the data', () => {
    render(<ContentPreview content={validated()} />);
    expect(screen.getByRole('heading', { name: sample.hero.headline })).toBeInTheDocument();
    expect(screen.getByText(sample.hero.supportingCopy)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: sample.hero.primaryCta.label })).toHaveAttribute(
      'href',
      sample.hero.primaryCta.href,
    );
    expect(screen.getByRole('link', { name: sample.hero.secondaryCta.label })).toHaveAttribute(
      'href',
      sample.hero.secondaryCta.href,
    );
  });

  it('renders all three decision states as text, with rationale and action', () => {
    const { container } = render(<ContentPreview content={validated()} />);
    for (const status of sample.statuses) {
      const badge = container.querySelector(`[data-status="${status.state}"]`) as HTMLElement;
      expect(badge, status.state).toHaveTextContent(status.label);
      const card = badge.closest('article') as HTMLElement;
      expect(within(card).getByText(status.meaning)).toBeInTheDocument();
      expect(within(card).getByText(status.exampleRationale)).toBeInTheDocument();
      expect(within(card).getByText(status.suggestedAction)).toBeInTheDocument();
    }
  });

  it('renders images with their alt text and declared dimensions', () => {
    render(<ContentPreview content={validated()} />);
    const hero = screen.getAllByAltText(sample.hero.preview.alt)[0] as HTMLImageElement;
    expect(hero).toHaveAttribute('src', sample.hero.preview.src);
    expect(hero).toHaveAttribute('width', String(sample.hero.preview.width));
    expect(hero).toHaveAttribute('height', String(sample.hero.preview.height));
    for (const feature of sample.features) {
      expect(screen.getByAltText(feature.image.alt)).toBeInTheDocument();
    }
  });

  it('keeps each framework concept separate from what SWO does', () => {
    render(<ContentPreview content={validated()} />);
    for (const framework of sample.methodology.frameworks) {
      const card = screen.getByRole('article', { name: framework.name });
      expect(within(card).getByText(framework.concept)).toBeInTheDocument();
      expect(within(card).getByText(framework.swoImplementation)).toBeInTheDocument();
      expect(within(card).getByText('The concept')).toBeInTheDocument();
      expect(within(card).getByText('What SWO does')).toBeInTheDocument();
      expect(within(card).getByText(/No SWO validation is claimed/)).toBeInTheDocument();
    }
    expect(screen.getByText(sample.methodology.disclaimer)).toBeInTheDocument();
  });

  it('renders one FAQ entry per item and the footer links', () => {
    render(<ContentPreview content={validated()} />);
    for (const item of sample.faq) expect(screen.getByText(item.question)).toBeInTheDocument();
    const footer = screen.getByRole('navigation', { name: 'Footer' });
    for (const link of sample.footer.linkGroups[0]!.links) {
      expect(within(footer).getByRole('link', { name: link.label })).toHaveAttribute(
        'href',
        link.href,
      );
    }
  });

  it('exposes a labelled region for each major section', () => {
    render(<ContentPreview content={validated()} />);
    expect(screen.getByRole('region', { name: sample.howItWorks.heading })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: sample.methodology.heading })).toBeInTheDocument();
  });

  it('puts every in-page CTA anchor on a section that exists in the rendered output', () => {
    const { container } = render(<ContentPreview content={validated()} />);
    for (const href of [sample.hero.primaryCta.href, sample.hero.secondaryCta.href]) {
      expect(container.querySelector(href), `${href} has no target`).not.toBeNull();
    }
  });

  it('changes the rendered output when the content changes (it is data driven)', () => {
    const changed = validated();
    changed.hero.headline = 'A completely different headline for this check.';
    render(<ContentPreview content={changed} />);
    expect(
      screen.getByRole('heading', { name: 'A completely different headline for this check.' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(sample.hero.headline)).toBeNull();
  });
});

describe('ContentDemo: validate, then render', () => {
  it('starts valid and renders the preview', () => {
    render(<ContentDemo />);
    expect(screen.getByTestId('validation-status')).toHaveTextContent('Valid: rendering below.');
    expect(screen.getByTestId('content-preview')).toBeInTheDocument();
    expect(screen.queryByTestId('issue-list')).toBeNull();
  });

  it('rejects broken content, lists the exact fields and renders NOTHING', () => {
    render(<ContentDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Introduce 4 faults' }));

    expect(screen.getByTestId('validation-status')).toHaveTextContent(/Invalid: \d+ issue/);
    expect(screen.queryByTestId('content-preview')).toBeNull();

    const list = screen.getByTestId('issue-list');
    expect(within(list).getByText('hero.headline')).toBeInTheDocument();
    expect(within(list).getByText('hero.primaryCta.href')).toBeInTheDocument();
    // Each unsupported claim in the answer is reported separately.
    expect(within(list).getAllByText('faq[0].answer').length).toBeGreaterThanOrEqual(2);
    expect(within(list).getByText('statuses[2].state')).toBeInTheDocument();
    expect(within(list).getByText('is required')).toBeInTheDocument();
    expect(within(list).getByText(/placeholder "#"/)).toBeInTheDocument();
    expect(within(list).getAllByText(/unsupported claim/).length).toBeGreaterThanOrEqual(1);
  });

  it('does not render a partial page for the parts of broken content that are fine', () => {
    render(<ContentDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Introduce 4 faults' }));
    // The FAQ section is valid on its own questions, but nothing is rendered.
    expect(screen.queryByText(sample.faq[1]!.question)).toBeNull();
  });

  it('recovers when reset', () => {
    render(<ContentDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Introduce 4 faults' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset to sample' }));
    expect(screen.getByTestId('validation-status')).toHaveTextContent('Valid');
    expect(screen.getByTestId('content-preview')).toBeInTheDocument();
  });

  it('reports a JSON syntax error without rendering', () => {
    render(<ContentDemo />);
    fireEvent.change(screen.getByLabelText('Content JSON'), { target: { value: '{ "meta": ' } });
    expect(screen.getByTestId('validation-status')).toHaveTextContent('Not valid JSON');
    expect(screen.queryByTestId('content-preview')).toBeNull();
  });

  it('validates live as the author edits a field', () => {
    render(<ContentDemo />);
    const edited = JSON.stringify({ ...sample, hero: { ...sample.hero, headline: 'Too short' } });
    fireEvent.change(screen.getByLabelText('Content JSON'), { target: { value: edited } });
    expect(screen.getByTestId('validation-status')).toHaveTextContent('Invalid');
    expect(
      within(screen.getByTestId('issue-list')).getByText('must be at least 10 characters'),
    ).toBeInTheDocument();
  });
});
