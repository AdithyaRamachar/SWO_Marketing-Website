import type { ReactNode } from 'react';
import { cx } from '../lib/cx.ts';

const sizes = {
  1: 'text-hero font-bold',
  2: 'text-h2 font-bold',
  3: 'text-h3 font-semibold',
} as const;

export interface SectionHeadingProps {
  /** Document outline level. Visual size follows the level, so pick by structure. */
  level?: 1 | 2 | 3;
  title: ReactNode;
  eyebrow?: string;
  description?: ReactNode;
  align?: 'start' | 'center';
  /** Set so a parent section can reference it with aria-labelledby. */
  id?: string;
  className?: string;
}

export function SectionHeading({
  level = 2,
  title,
  eyebrow,
  description,
  align = 'start',
  id,
  className,
}: SectionHeadingProps) {
  const Heading = `h${level}` as const;
  return (
    <div
      className={cx(
        'flex max-w-prose flex-col gap-3',
        align === 'center' && 'mx-auto items-center text-center',
        className,
      )}
    >
      {eyebrow && (
        <p className="text-small font-semibold uppercase text-brand-primary">{eyebrow}</p>
      )}
      <Heading id={id} className={cx(sizes[level], 'text-text-primary')}>
        {title}
      </Heading>
      {description && <p className="text-body text-text-secondary">{description}</p>}
    </div>
  );
}
