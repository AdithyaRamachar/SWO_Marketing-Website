import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ButtonLink } from '../components/index.ts';
import type { NavContent } from '../content/schema.ts';
import { cx } from '../lib/cx.ts';

export interface SiteHeaderProps {
  nav: NavContent;
}

/**
 * Sticky site header.
 *
 * Below `md` the links collapse into a disclosure panel. The panel is a real
 * button + region pair (`aria-expanded`, `aria-controls`), closes on Escape and
 * on choosing a link, and returns focus to the toggle when Escape closes it, so
 * a keyboard user is never left with focus inside a hidden panel.
 *
 * The links are not rendered twice: one list is laid out inline from `md` and
 * stacked inside the panel below it. That keeps a single tab order and means a
 * screen reader finds one navigation landmark, not two.
 */
export function SiteHeader({ nav }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-10 border-b border-border-default bg-surface-page">
      <div className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8">
        <a
          href="#hero"
          className="inline-flex min-h-(--min-target-size) items-center rounded-button text-h3 font-bold text-text-primary"
          onClick={close}
        >
          {nav.brand}
        </a>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className={cx(
            'inline-flex min-h-(--min-target-size) min-w-(--min-target-size) items-center',
            'justify-center gap-2 rounded-button border border-border-strong px-3',
            'text-small font-semibold text-text-primary hover:bg-surface-hover md:hidden',
          )}
        >
          {open ? (
            <X aria-hidden="true" className="size-4" />
          ) : (
            <Menu aria-hidden="true" className="size-4" />
          )}
          Menu
        </button>

        <nav
          id={panelId}
          aria-label="Main"
          // Hidden below md until opened; always laid out inline from md.
          className={cx(
            'absolute inset-x-0 top-full border-b border-border-default bg-surface-page',
            'px-4 pb-4 md:static md:inset-auto md:border-0 md:px-0 md:pb-0',
            open ? 'block' : 'hidden md:block',
          )}
        >
          <ul className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
            {nav.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={close}
                  className={cx(
                    'flex min-h-(--min-target-size) items-center rounded-button px-3',
                    'text-body font-medium text-text-secondary',
                    'hover:bg-surface-hover hover:text-text-primary',
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="mt-2 md:mt-0 md:ml-2">
              <ButtonLink href={nav.cta.href} onClick={close} className="w-full md:w-auto">
                {nav.cta.label}
              </ButtonLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
