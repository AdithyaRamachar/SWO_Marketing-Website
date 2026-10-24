/**
 * WorkoutStatusCard — CORRECTED FIXTURE (after)
 *
 * All three deliberate violations from the before/ version have been fixed.
 * This file is still a test fixture under docs/evidence/ and is not part
 * of the production build.
 *
 * Corrections applied:
 *
 *   A — DS-COLOR-01 fixed: removed inline style with raw hex;
 *       heading now uses className="text-brand-primary" (semantic token)
 *
 *   B — A11Y-01 fixed: replaced colour-only dot with <StatusBadge>
 *       which renders a text label and a distinct icon shape
 *
 *   C — CONTENT-01 fixed: removed direct JSON import;
 *       component now accepts validated SiteContent as a typed prop
 */

import { StatusBadge } from '../../../src/components/StatusBadge.tsx';
import type { SiteContent } from '../../../src/content/schema.ts';

interface WorkoutStatusCardProps {
  exerciseName: string;
  riskLevel: 'low' | 'medium' | 'high';
  /** Validated, typed page content — never raw JSON. */
  content: SiteContent;
}

const STATUS_MAP: Record<
  WorkoutStatusCardProps['riskLevel'],
  { state: 'green' | 'amber' | 'red'; label: string }
> = {
  low: { state: 'green', label: 'Optimal zone' },
  medium: { state: 'amber', label: 'Caution zone' },
  high: { state: 'red', label: 'High risk' },
};

export function WorkoutStatusCard({
  exerciseName,
  riskLevel,
  content,
}: WorkoutStatusCardProps) {
  const { state, label } = STATUS_MAP[riskLevel];

  return (
    <div className="rounded-card bg-surface-page p-4">
      {/* FIX A: semantic colour token, not a raw hex */}
      <h3 className="text-h3 font-semibold text-brand-primary">{exerciseName}</h3>

      {/* FIX B: StatusBadge provides a text label AND a distinct icon shape */}
      <StatusBadge status={state} className="mt-2">
        {label}
      </StatusBadge>

      {/* FIX C: content comes from a validated prop, not from raw JSON */}
      <p className="mt-2 text-body text-text-secondary">{content.hero.supportingCopy}</p>
    </div>
  );
}
