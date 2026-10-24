// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
} from '../src/components/index.ts';

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it.each([
    ['primary', 'bg-brand-primary'],
    ['secondary', 'border-border-strong'],
    ['tertiary', 'text-brand-primary'],
  ] as const)('applies the %s variant tokens', (variant, expected) => {
    render(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole('button')).toHaveClass(expected);
  });

  it('keeps a minimum touch target and rounded-button radius from the tokens', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button')).toHaveClass('min-h-(--min-target-size)', 'rounded-button');
  });

  it('fires onClick, via mouse and via keyboard', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);

    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('does not fire when disabled and is removed from the tab order', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await user.click(button);
    await user.tab();
    expect(button).not.toHaveFocus();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('loading disables the button, sets aria-busy and shows a hidden spinner', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not set aria-busy when not loading', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
  });
});

describe('ButtonLink', () => {
  it('renders a real link with its destination, not a button', () => {
    render(<ButtonLink href="#faq">Read the FAQ</ButtonLink>);
    const link = screen.getByRole('link', { name: 'Read the FAQ' });
    expect(link).toHaveAttribute('href', '#faq');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shares the variant styling with Button', () => {
    render(
      <ButtonLink variant="secondary" href="/x">
        Go
      </ButtonLink>,
    );
    expect(screen.getByRole('link')).toHaveClass('border-border-strong', 'rounded-button');
  });
});

describe('StatusBadge', () => {
  it.each([
    ['green', 'Optimal zone', 'Green'],
    ['amber', 'Caution zone', 'Amber'],
    ['red', 'High-risk flag', 'Red'],
  ] as const)('%s states its meaning in text, not colour alone', (status, label, colour) => {
    const { container } = render(<StatusBadge status={status} />);
    const badge = container.querySelector('[data-status]') as HTMLElement;
    expect(badge).toHaveAttribute('data-status', status);
    expect(badge).toHaveTextContent(label);
    // Screen readers also hear which colour it is.
    expect(badge).toHaveTextContent(`${colour} status:`);
    // The icon is decorative because the text already carries the meaning.
    expect(badge.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses a different icon SHAPE for every state', () => {
    const shapes = (['green', 'amber', 'red'] as const).map((status) => {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const shape = container.querySelector('svg')?.getAttribute('class') ?? '';
      unmount();
      return shape;
    });
    expect(new Set(shapes).size).toBe(3);
  });

  it('uses the matching decision-state tokens', () => {
    const { container } = render(
      <>
        <StatusBadge status="green" />
        <StatusBadge status="amber" />
        <StatusBadge status="red" />
      </>,
    );
    const [green, amber, red] = [...container.querySelectorAll('[data-status]')];
    expect(green).toHaveClass('bg-status-green-bg', 'text-status-green-fg');
    expect(amber).toHaveClass('bg-status-amber-bg', 'text-status-amber-fg');
    expect(red).toHaveClass('bg-status-red-bg', 'text-status-red-fg');
  });

  it('accepts a custom label', () => {
    render(<StatusBadge status="amber">Consider easing off</StatusBadge>);
    expect(screen.getByText('Consider easing off')).toBeInTheDocument();
    expect(screen.queryByText('Caution zone')).toBeNull();
  });
});

describe('FormField', () => {
  it('associates the label with the control', () => {
    render(
      <FormField label="Exercise name">
        <TextInput />
      </FormField>,
    );
    expect(screen.getByLabelText('Exercise name')).toBeInstanceOf(HTMLInputElement);
  });

  it('links the hint to the control with aria-describedby', () => {
    render(
      <FormField label="Weight" hint="In kilograms.">
        <TextInput />
      </FormField>,
    );
    expect(screen.getByLabelText('Weight')).toHaveAccessibleDescription('In kilograms.');
  });

  it('marks an errored control invalid, with the error as text and an icon', () => {
    const { container } = render(
      <FormField label="Weight" hint="In kilograms." error="Enter a weight above 0.">
        <TextInput />
      </FormField>,
    );
    const input = screen.getByLabelText('Weight');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('In kilograms. Error: Enter a weight above 0.');
    expect(container.querySelector('p svg')).toHaveAttribute('aria-hidden', 'true');
    // Thicker border is a second, non-colour cue.
    expect(input).toHaveClass('border-2');
  });

  it('is not invalid when there is no error', () => {
    render(
      <FormField label="Weight">
        <TextInput />
      </FormField>,
    );
    expect(screen.getByLabelText('Weight')).not.toHaveAttribute('aria-invalid');
  });

  it('exposes required to assistive technology and the control', () => {
    render(
      <FormField label="Weight" required>
        <TextInput />
      </FormField>,
    );
    expect(screen.getByLabelText(/Weight/)).toBeRequired();
    expect(screen.getByText('(required)')).toBeInTheDocument();
  });

  it('works for a Select as well', () => {
    render(
      <FormField label="Goal">
        <Select defaultValue="a">
          <option value="a">Strength</option>
        </Select>
      </FormField>,
    );
    expect(screen.getByRole('combobox', { name: 'Goal' })).toBeInTheDocument();
  });

  it('gives each field its own id, so two fields never share a label', () => {
    render(
      <>
        <FormField label="First">
          <TextInput />
        </FormField>
        <FormField label="Second">
          <TextInput />
        </FormField>
      </>,
    );
    expect(screen.getByLabelText('First').id).not.toBe(screen.getByLabelText('Second').id);
  });

  it('refuses to render a control outside a FormField', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<TextInput />)).toThrow(/inside <FormField>/);
    spy.mockRestore();
  });
});

describe('SectionHeading', () => {
  it.each([
    [1, 'text-hero'],
    [2, 'text-h2'],
    [3, 'text-h3'],
  ] as const)('level %i renders an h%i with the matching type token', (level, token) => {
    render(<SectionHeading level={level} title="Heading" />);
    expect(screen.getByRole('heading', { level, name: 'Heading' })).toHaveClass(token);
  });

  it('defaults to h2, and renders eyebrow and description', () => {
    render(<SectionHeading title="T" eyebrow="Eyebrow" description="Desc" />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Eyebrow')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
  });

  it('passes id through so a section can be labelled by it', () => {
    render(<SectionHeading id="x" title="T" />);
    expect(screen.getByRole('heading')).toHaveAttribute('id', 'x');
  });
});

describe('SectionContainer', () => {
  it('is a named region when labelled by its heading', () => {
    render(
      <SectionContainer aria-labelledby="h">
        <SectionHeading id="h" title="How it works" />
      </SectionContainer>,
    );
    expect(screen.getByRole('region', { name: 'How it works' })).toBeInTheDocument();
  });

  it('bounds content width with the content token and applies the tone', () => {
    const { container } = render(<SectionContainer tone="subtle">x</SectionContainer>);
    expect(container.querySelector('section')).toHaveClass('bg-surface-subtle');
    expect(container.querySelector('section > div')).toHaveClass('max-w-content');
  });
});

describe('Card', () => {
  it('renders the requested semantic element', () => {
    const { container } = render(<Card as="article">x</Card>);
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it('uses card tokens for radius, border and shadow in the outlined variant', () => {
    const { container } = render(<Card>x</Card>);
    expect(container.firstElementChild).toHaveClass(
      'rounded-card',
      'border-border-default',
      'shadow-card',
    );
  });

  it('subtle variant has no border or shadow', () => {
    const { container } = render(<Card variant="subtle">x</Card>);
    expect(container.firstElementChild).toHaveClass('bg-surface-subtle');
    expect(container.firstElementChild).not.toHaveClass('shadow-card');
  });
});
