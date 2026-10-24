import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/cx.ts';

export type CardVariant = 'outlined' | 'subtle';

const variants: Record<CardVariant, string> = {
  outlined: 'border border-border-default bg-surface-page shadow-card',
  subtle: 'bg-surface-subtle',
};

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Use `article` for self-contained content, `section` only with an accessible name. */
  as?: 'div' | 'article' | 'section';
  variant?: CardVariant;
  children: ReactNode;
}

export function Card({
  as: Element = 'div',
  variant = 'outlined',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Element className={cx('rounded-card p-6', variants[variant], className)} {...rest}>
      {children}
    </Element>
  );
}
