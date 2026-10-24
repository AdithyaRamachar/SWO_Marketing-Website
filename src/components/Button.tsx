import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cx } from '../lib/cx.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

const base =
  'inline-flex min-h-(--min-target-size) items-center justify-center gap-2 rounded-button ' +
  'text-body font-semibold transition-colors';

const variants: Record<ButtonVariant, string> = {
  primary:
    'px-6 py-3 bg-brand-primary text-brand-on-primary ' +
    'hover:bg-brand-primary-hover active:bg-brand-primary-active',
  secondary:
    'px-6 py-3 border border-border-strong bg-surface-page text-text-primary ' +
    'hover:bg-surface-hover active:bg-surface-pressed',
  tertiary: 'px-4 py-3 text-brand-primary hover:bg-surface-hover active:bg-surface-pressed',
};

// `disabled:` sorts after `hover:` / `active:`, so a disabled button never
// shows a hover or pressed colour.
const disabledStyles =
  'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-disabled ' +
  'disabled:text-text-disabled';

interface CommonProps {
  variant?: ButtonVariant;
  children: ReactNode;
}

export interface ButtonProps
  extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Shows a spinner and blocks interaction. The label stays visible. */
  loading?: boolean;
}

/** An action. Use ButtonLink for navigation. */
export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      // A loading button is disabled so a second activation cannot fire.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(base, variants[variant], disabledStyles, className)}
      {...rest}
    >
      {loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export interface ButtonLinkProps
  extends CommonProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'> {
  /** Required: a link without a destination is not a link. */
  href: string;
}

/** Navigation styled like a Button. Renders a real anchor. */
export function ButtonLink({ variant = 'primary', className, children, ...rest }: ButtonLinkProps) {
  return (
    <a className={cx(base, variants[variant], className)} {...rest}>
      {children}
    </a>
  );
}
