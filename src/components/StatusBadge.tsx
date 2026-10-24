import type { ReactNode } from 'react';
import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import { cx } from '../lib/cx.ts';

/** The three workout decision states. Use for decision meaning only. */
export type WorkoutStatus = 'green' | 'amber' | 'red';

interface StatusMeta {
  /** Colour name, announced to screen readers. */
  colour: string;
  /** Default visible label. Meaning comes from this text, never from colour. */
  label: string;
  Icon: typeof CircleCheck;
  className: string;
}

// Distinct SHAPES as well as colours: circle+check, triangle, circle+cross.
export const STATUS_META: Record<WorkoutStatus, StatusMeta> = {
  green: {
    colour: 'Green',
    label: 'Optimal zone',
    Icon: CircleCheck,
    className: 'bg-status-green-bg text-status-green-fg border-status-green-fg',
  },
  amber: {
    colour: 'Amber',
    label: 'Caution zone',
    Icon: TriangleAlert,
    className: 'bg-status-amber-bg text-status-amber-fg border-status-amber-fg',
  },
  red: {
    colour: 'Red',
    label: 'High-risk flag',
    Icon: CircleX,
    className: 'bg-status-red-bg text-status-red-fg border-status-red-fg',
  },
};

export interface StatusBadgeProps {
  status: WorkoutStatus;
  /** Overrides the default label. It must still say what the state means. */
  children?: ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const { colour, label, Icon, className: tone } = STATUS_META[status];
  return (
    <span
      data-status={status}
      className={cx(
        'inline-flex items-center gap-2 rounded-pill border px-3 py-1',
        'text-small font-semibold',
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">{colour} status:</span> {children ?? label}
    </span>
  );
}
