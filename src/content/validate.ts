/**
 * The validation boundary. Raw content enters here as `unknown` and leaves as
 * either a typed SiteContent or a list of actionable issues. Nothing downstream
 * should render content that has not passed through this function.
 */

import { siteContentSchema } from './schema.ts';
import type { SiteContent } from './schema.ts';

export interface ContentIssue {
  /** Dotted path to the offending field, e.g. `faq[2].answer`. */
  path: string;
  /** What is wrong, phrased so the author can fix it. */
  message: string;
  code: string;
}

export type ValidationResult =
  { ok: true; data: SiteContent } | { ok: false; issues: ContentIssue[] };

export function formatPath(path: ReadonlyArray<PropertyKey>): string {
  let out = '';
  for (const segment of path) {
    if (typeof segment === 'number') out += `[${segment}]`;
    else out += out === '' ? String(segment) : `.${String(segment)}`;
  }
  return out === '' ? '(root)' : out;
}

export function validateSiteContent(input: unknown): ValidationResult {
  const result = siteContentSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };

  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: formatPath(issue.path),
      message: issue.message,
      code: issue.code,
    })),
  };
}

export function formatIssues(issues: readonly ContentIssue[]): string {
  return issues.map((issue) => `  ${issue.path}: ${issue.message}`).join('\n');
}

export class ContentValidationError extends Error {
  readonly issues: ContentIssue[];

  constructor(issues: ContentIssue[]) {
    super(
      `Site content is invalid (${issues.length} issue${issues.length === 1 ? '' : 's'}):\n${formatIssues(issues)}`,
    );
    this.name = 'ContentValidationError';
    this.issues = issues;
  }
}

/** For build-time and script use, where invalid content must stop the process. */
export function assertValidSiteContent(input: unknown): SiteContent {
  const result = validateSiteContent(input);
  if (!result.ok) throw new ContentValidationError(result.issues);
  return result.data;
}
