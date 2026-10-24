import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/cx.ts';

export type SectionTone = 'page' | 'subtle';

const tones: Record<SectionTone, string> = {
  page: 'bg-surface-page',
  subtle: 'bg-surface-subtle',
};

export interface SectionContainerProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  tone?: SectionTone;
  /**
   * A <section> is only a landmark when it has an accessible name, so pass
   * `aria-labelledby` pointing at the SectionHeading id (or `aria-label`).
   */
  children: ReactNode;
}

/** Full-width band with a bounded, gutter-padded content column. */
export function SectionContainer({
  tone = 'page',
  className,
  children,
  ...rest
}: SectionContainerProps) {
  return (
    <section className={cx('py-12 md:py-16', tones[tone], className)} {...rest}>
      <div className="mx-auto w-full max-w-content px-4 md:px-6 lg:px-8">{children}</div>
    </section>
  );
}
