/**
 * WorkoutStatusCard — INTENTIONAL VIOLATION FIXTURE (before)
 *
 * This file is a test fixture for the design-system-auditor subagent.
 * It is located under docs/evidence/ and is excluded from the production
 * build, lint, and type-check. It contains three deliberate violations.
 * Do NOT copy this into src/.
 *
 * Planted violations (ground truth, kept separate from the audited file):
 *
 *   A — DS-COLOR-01  Hard-coded hex colour instead of a design token
 *       Line 33: style={{ color: '#0B4A5C' }}
 *       Should be: className="text-brand-primary" (token)
 *
 *   B — A11Y-01  Status communicated by colour alone — no text label or icon
 *       Lines 44-50: coloured dot with no accompanying text or icon shape
 *       Should be: use <StatusBadge> which provides label + icon
 *
 *   C — CONTENT-01  Unvalidated content imported and rendered directly
 *       Line 3: import rawContent from '../../../src/content/site-content.json'
 *       Line 56: renders rawContent.hero.headline without going through assertValidSiteContent
 *       Should be: accept validated SiteContent as a prop
 */

import rawContent from '../../../src/content/site-content.json';

interface WorkoutStatusCardProps {
  exerciseName: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export function WorkoutStatusCard({ exerciseName, riskLevel }: WorkoutStatusCardProps) {
  // VIOLATION A (DS-COLOR-01): hardcoded hex colour, not a design token
  const headingStyle = { color: '#0B4A5C' };

  // VIOLATION B (A11Y-01): status communicated through colour only
  const dotColour =
    riskLevel === 'low' ? 'green' : riskLevel === 'medium' ? 'orange' : 'red';

  return (
    <div className="rounded-card bg-surface-page p-4">
      {/* VIOLATION A in effect: inline style with raw hex */}
      <h3 style={headingStyle} className="text-h3 font-semibold">
        {exerciseName}
      </h3>

      {/* VIOLATION B in effect: colour dot, no label, no icon shape */}
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: dotColour,
        }}
      />

      {/* VIOLATION C in effect: unvalidated JSON rendered directly */}
      <p className="text-body text-text-secondary">
        {rawContent.hero.headline}
      </p>
    </div>
  );
}
